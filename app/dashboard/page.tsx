"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, animate } from "framer-motion";
import Link from "next/link";
import { Trophy, ArrowLeft, Eye, RefreshCw } from "lucide-react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import PassportCard from "@/components/PassportCard";
import { type KarmaPassport, type ContributionData } from "@/lib/types";
import { buildPassportFromContribution } from "@/lib/karmaEngine";

// ─── SparkleIcon — pulsing ✦ for AI Review nav link ─────────────────────────

function SparkleIcon() {
  return (
    <span
      style={{
        display: "inline-block",
        animation: "kc-pulse 2s ease-in-out infinite",
      }}
    >
      ✦
      <style>{`
        @keyframes kc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </span>
  );
}

// ─── Rate Limit Countdown ─────────────────────────────────────────────────────

function RateLimitCountdown({ onRetry }: { onRetry: () => void }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="min-h-screen bg-gh-bg flex items-center justify-center p-6">
      <div className="border border-amber/40 bg-amber/5 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
            API Rate Limited
          </span>
        </div>
        <p className="font-mono text-amber text-base font-bold mb-2">
          GitHub API rate limited.
        </p>
        <p className="font-sans text-sm text-gh-muted mb-6 leading-relaxed">
          Too many requests. Please wait{" "}
          <span className="font-mono text-amber font-bold">{seconds}s</span>{" "}
          before retrying.
        </p>
        <button
          onClick={onRetry}
          disabled={seconds > 0}
          className="flex items-center gap-2 font-mono text-xs px-6 py-2.5 bg-amber text-gh-bg font-bold
                     hover:bg-amber/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={12} />
          {seconds > 0 ? `Retry in ${seconds}s` : "Retry now"}
        </button>
      </div>
    </div>
  );
}

// ─── New Account Notice ───────────────────────────────────────────────────────

function NewAccountNotice({ username }: { username: string }) {
  return (
    <div className="min-h-screen bg-gh-bg flex items-center justify-center p-6">
      <div className="border border-emerald/40 bg-emerald/5 p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-5">🌱</div>
        <h2 className="font-mono font-bold text-gh-text text-base mb-3">
          Not enough public contribution data.
        </h2>
        <p className="font-sans text-sm text-gh-muted leading-relaxed mb-6">
          <span className="font-mono text-emerald">@{username}</span> is just
          getting started. Make some open source magic first!{" "}
          <span>🌱</span>
        </p>
        <p className="font-sans text-xs text-gh-muted mb-6">
          We need at least a handful of public commits, PRs, or reviews to
          compute a Karma Score. Contribute to a few repos and come back!
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="https://github.com/explore"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-amber text-xs px-5 py-2"
          >
            Explore repos →
          </a>
          <button
            onClick={() => window.location.reload()}
            className="font-mono text-xs px-5 py-2 border border-gh-border text-gh-muted hover:text-gh-text transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  Legend:      "👑 LEGEND",
  Luminary:    "⚡ VETERAN",
  Maintainer:  "⚙️ MAINTAINER",
  Contributor: "🌱 CONTRIBUTOR",
  Sprout:      "🌿 APPRENTICE",
  Seed:        "🌱 APPRENTICE",
};

const TIER_COLOR: Record<string, string> = {
  Legend:      "#f43f5e",
  Luminary:    "#f0a500",
  Maintainer:  "#10b981",
  Contributor: "#10b981",
  Sprout:      "#8b949e",
  Seed:        "#8b949e",
};

const CATEGORY_ICONS: Record<string, string> = {
  Builder:       "🔨",
  Reviewer:      "👁️",
  "Bug Hunter":  "🐛",
  Documentor:    "📖",
  Mentor:        "🎓",
};

const CATEGORY_TOOLTIPS: Record<string, string> = {
  Builder:       "Total commits + PRs merged — raw code output",
  Reviewer:      "PR reviews given, ratio of comments to commits",
  "Bug Hunter":  "Issues opened and closed, triage activity",
  Documentor:    "Commits touching README, docs/, and .md files",
  Mentor:        "Good-first-issue comments, cross-repo diversity",
};

// ─── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(end: number, duration = 2, delaySeconds = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let animation: { stop: () => void } | undefined;

    timeout = setTimeout(() => {
      animation = animate(0, end, {
        duration,
        ease: "easeOut",
        onUpdate: (latest) => setValue(Math.round(latest)),
      });
    }, delaySeconds * 1000);

    return () => {
      clearTimeout(timeout);
      animation?.stop();
    };
  }, [end, duration, delaySeconds]);

  return value;
}

// ─── ScoreHero ────────────────────────────────────────────────────────────────

function ScoreHero({
  passport,
  rawData,
}: {
  passport: KarmaPassport;
  rawData: ContributionData;
}) {
  const displayScore = useCountUp(passport.score.total, 2);
  const tierColor = TIER_COLOR[passport.score.tier] ?? "#8b949e";
  const tierLabel = TIER_LABEL[passport.score.tier] ?? "🌱 APPRENTICE";

  const memberSince = new Date(passport.user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      className="border border-gh-border bg-gh-surface p-4 sm:p-6 hover:border-amber/40 transition-colors duration-200"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Identity row */}
      <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={passport.user.avatar_url}
            alt={passport.user.login}
            className="w-16 h-16 rounded-full"
            style={{ outline: "2px solid #f0a500", outlineOffset: "3px" }}
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="font-mono font-bold text-lg sm:text-xl text-gh-text truncate leading-none mb-1">
            {passport.user.name ?? passport.user.login}
          </h1>
          <p className="font-mono text-xs sm:text-sm text-gh-muted">@{passport.user.login}</p>
          {passport.user.bio && (
            <p className="font-sans text-xs text-gh-muted mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
              {passport.user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Giant score */}
      <div className="flex items-end gap-2 sm:gap-3 mb-3">
        <span
          className="font-mono font-bold leading-none tabular-nums text-5xl sm:text-7xl lg:text-[96px]"
          style={{ color: "#f0a500", lineHeight: 1 }}
        >
          {displayScore}
        </span>
        <span className="font-mono text-gh-muted text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-3">/ 1000</span>
      </div>

      {/* Rank pill */}
      <div className="mb-6 sm:mb-8">
        <span
          className="font-mono text-xs px-2 sm:px-3 py-1 sm:py-1.5 border font-bold tracking-widest"
          style={{
            color: tierColor,
            borderColor: `${tierColor}50`,
            backgroundColor: `${tierColor}12`,
          }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Account stats row */}
      <div className="flex items-center gap-0 pt-4 sm:pt-5 border-t border-gh-border">
        <div className="flex-1 text-center">
          <div className="font-mono text-base sm:text-lg font-semibold text-gh-text">
            {(rawData.followers).toLocaleString()}
          </div>
          <div className="font-mono text-xs text-gh-muted mt-0.5">Followers</div>
        </div>
        <div className="w-px h-8 sm:h-10 bg-gh-border" />
        <div className="flex-1 text-center">
          <div className="font-mono text-base sm:text-lg font-semibold text-gh-text">
            {rawData.publicRepos.toLocaleString()}
          </div>
          <div className="font-mono text-xs text-gh-muted mt-0.5">Public Repos</div>
        </div>
        <div className="w-px h-8 sm:h-10 bg-gh-border" />
        <div className="flex-1 text-center">
          <div className="font-mono text-base sm:text-lg font-semibold text-gh-text">{memberSince}</div>
          <div className="font-mono text-xs text-gh-muted mt-0.5">Member Since</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CategoryBreakdown ────────────────────────────────────────────────────────

function CategoryBreakdown({ passport }: { passport: KarmaPassport }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      className="border border-gh-border bg-gh-surface p-4 sm:p-6 hover:border-amber/40 transition-colors duration-200"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="font-mono text-xs text-gh-muted tracking-widest uppercase mb-4 sm:mb-6">
        Contribution Breakdown
      </h2>

      <div className="space-y-4 sm:space-y-5">
        {passport.score.dimensions.map((dim, i) => (
          <div
            key={dim.dimension}
            className="relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span className="text-base leading-none flex-shrink-0">{CATEGORY_ICONS[dim.label] ?? "📌"}</span>
                <span className="font-mono text-xs sm:text-sm text-gh-text truncate">{dim.label}</span>
              </div>
              <span className="font-mono text-xs sm:text-sm tabular-nums flex-shrink-0 ml-1" style={{ color: dim.color }}>
                {dim.score}/100
              </span>
            </div>

            {/* Track + fill */}
            <div className="h-2 bg-gh-bg border border-gh-border overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: dim.color }}
                initial={{ width: 0 }}
                animate={{ width: `${dim.score}%` }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.1, ease: "easeOut" }}
              />
            </div>

            {/* Tooltip on hover */}
            {hovered === i && (
              <motion.div
                className="absolute right-0 -top-8 bg-gh-surface border border-gh-border px-2 sm:px-3 py-1 sm:py-1.5 z-10 pointer-events-none text-xs"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <p className="font-sans text-xs text-gh-muted whitespace-nowrap">
                  {CATEGORY_TOOLTIPS[dim.label] ?? dim.description}
                </p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── StatsGrid ────────────────────────────────────────────────────────────────

function StatCard({ label, value, delay }: { label: string; value: number; delay: number }) {
  const display = useCountUp(value, 1.4, delay);

  return (
    <motion.div
      className="border border-gh-border bg-gh-bg p-3 sm:p-4 hover:border-amber/40 transition-colors duration-200"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="font-mono text-xl sm:text-2xl font-bold text-amber tabular-nums">
        {display.toLocaleString()}
      </div>
      <div className="font-sans text-xs text-gh-muted mt-0.5 sm:mt-1">{label}</div>
    </motion.div>
  );
}

function StatsGrid({ rawData }: { passport: KarmaPassport; rawData: ContributionData }) {
  const stats = [
    { label: "Total Commits",      value: rawData.totalCommits },
    { label: "PRs Merged",         value: rawData.totalPRsMerged },
    { label: "PR Reviews Given",   value: rawData.totalPRReviews },
    { label: "Issues Closed",      value: rawData.totalIssuesClosed },
    { label: "Doc Commits",        value: rawData.totalDocCommits },
    { label: "Repos Contributed",  value: rawData.reposContributedTo },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
      {stats.map((s, i) => (
        <StatCard key={s.label} label={s.label} value={s.value} delay={0.3 + i * 0.06} />
      ))}
    </div>
  );
}

// ─── RadarSection ─────────────────────────────────────────────────────────────

function RadarSection({ passport }: { passport: KarmaPassport }) {
  const data = passport.score.dimensions.map((d) => ({
    subject: d.label,
    score: d.score,
    fullMark: 100,
  }));

  return (
    <motion.div
      className="border border-gh-border bg-gh-surface p-4 sm:p-6 hover:border-amber/40 transition-colors duration-200"
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <h2 className="font-mono text-xs text-gh-muted tracking-widest uppercase mb-1">
        Karma Radar
      </h2>
      <ResponsiveContainer width="100%" height={220} minHeight={220} className="sm:h-72">
        <RechartsRadarChart data={data} margin={{ top: 12, right: 24, bottom: 12, left: 24 }}>
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "#e6edf3",
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <Radar
            name="Karma"
            dataKey="score"
            stroke="#f0a500"
            fill="#f0a500"
            fillOpacity={0.18}
            strokeWidth={2}
            dot={{ fill: "#f0a500", r: 3 }}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ─── BadgeSection ─────────────────────────────────────────────────────────────

function BadgeSection({ passport }: { passport: KarmaPassport }) {
  const earned = passport.badges.filter((b) => b.earned);
  const locked = passport.badges.filter((b) => !b.earned);

  return (
    <motion.div
      className="border border-gh-border bg-gh-surface p-4 sm:p-6 hover:border-amber/40 transition-colors duration-200"
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="font-mono text-xs text-gh-muted tracking-widest uppercase">
          Earned Badges
        </h2>
        <span className="font-mono text-xs text-gh-muted">
          <span className="text-amber font-semibold">{earned.length}</span>/{passport.badges.length}{" "}
          BADGES EARNED
        </span>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {earned.map((badge, i) => (
            <motion.div
              key={badge.id}
              className="border p-3 text-center cursor-default"
              style={{
                borderColor: `${badge.color ?? "#f0a500"}45`,
                backgroundColor: "#161b22",
                boxShadow: `0 0 14px ${badge.color ?? "#f0a500"}18`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 18,
                delay: 0.1 + i * 0.08,
              }}
              whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
            >
              <div className="text-3xl mb-2 leading-none">{badge.icon}</div>
              <p
                className="font-mono text-xs font-semibold leading-tight"
                style={{ color: badge.color ?? "#f0a500" }}
              >
                {badge.name ?? badge.label}
              </p>
              <p className="font-sans text-xs text-gh-muted mt-1 leading-snug line-clamp-2">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <p className="font-mono text-xs text-gh-muted mb-3 uppercase tracking-wider">Locked</p>
          <div className="grid grid-cols-2 gap-3">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="border border-gh-border bg-gh-bg p-3 text-center opacity-40 cursor-default"
              >
                <div className="text-3xl mb-2 leading-none grayscale">{badge.icon}</div>
                <p className="font-mono text-xs text-gh-muted leading-tight">
                  {badge.name ?? badge.label}
                </p>
                <p className="font-sans text-xs text-gh-muted mt-1 leading-snug line-clamp-2">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── PassportSection ──────────────────────────────────────────────────────────

function PassportSection({ passport }: { passport: KarmaPassport }) {
  const tierLabelText =
    (TIER_LABEL[passport.score.tier] ?? "APPRENTICE").replace(/^\S+\s/, "");

  const tweetText = encodeURIComponent(
    `My open-source Karma Score: ${passport.score.total}/1000 (${tierLabelText}) via @KarmaCommits — https://karma-commits.vercel.app`
  );

  // Load AI score from localStorage if user toggled it on from the AI Review page
  const [aiScore, setAiScore] = useState<{ score: number; grade: string } | undefined>(undefined);
  useEffect(() => {
    try {
      const showAi = localStorage.getItem("kc_ai_on_passport") === "true";
      if (showAi) {
        const raw = localStorage.getItem("kc_ai_score");
        if (raw) setAiScore(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <motion.div
      className="border border-gh-border bg-gh-surface p-4 sm:p-6 hover:border-amber/40 transition-colors duration-200"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
        <h2 className="font-mono text-xs text-gh-muted tracking-widest uppercase">
          Your OSS Passport
        </h2>
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-gh-muted hover:text-amber transition-colors"
        >
          Share on X →
        </a>
      </div>

      {/* Passport Card — 800×460px, horizontally scrollable if needed */}
      <div className="overflow-hidden w-full overflow-x-auto sm:overflow-visible">
        <PassportCard passport={passport} aiScore={aiScore} />
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") ?? null;

  const [passport, setPassport] = useState<KarmaPassport | null>(null);
  const [rawData, setRawData] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);

  // Redirect to home if no username is provided
  useEffect(() => {
    if (!username) {
      router.push("/");
    }
  }, [username, router]);

  const loadData = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError(null);
      setIsRateLimited(false);
      setIsNewAccount(false);
      const url = `/api/github?username=${encodeURIComponent(username)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg: string = body?.error ?? "Failed to load GitHub data";
        // Detect rate limit
        if (
          res.status === 429 ||
          msg.toLowerCase().includes("rate limit") ||
          msg.toLowerCase().includes("rate_limit") ||
          msg.toLowerCase().includes("api rate")
        ) {
          setIsRateLimited(true);
          return;
        }
        throw new Error(msg);
      }
      const data: ContributionData = await res.json();
      // Detect new / sparse account
      const totalActivity =
        data.totalCommits +
        data.totalPRsMerged +
        data.totalPRReviews +
        data.totalIssuesClosed;
      if (totalActivity < 5) {
        setIsNewAccount(true);
        return;
      }
      setRawData(data);
      setPassport(buildPassportFromContribution(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <DashboardSkeleton />;

  if (isRateLimited) {
    return <RateLimitCountdown onRetry={() => { setIsRateLimited(false); loadData(); }} />;
  }

  if (isNewAccount) {
    return <NewAccountNotice username={username ?? "you"} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center">
        <div className="border border-rose/40 bg-rose/5 p-8 max-w-md text-center">
          <p className="font-mono text-xs text-gh-muted mb-2 tracking-widest">DASHBOARD ERROR</p>
          <p className="font-mono text-rose text-sm mb-6">{error}</p>
          <button
            onClick={loadData}
            className="font-mono text-xs px-6 py-2 bg-amber text-gh-bg font-bold hover:bg-amber/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!passport || !rawData) return null;

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text">
      {/* ── Navigation ── */}
      <motion.nav
        className="h-14 border-b border-gh-border bg-gh-surface px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40"
        initial={{ y: -56 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Link
          href="/"
          className="font-mono font-bold text-amber tracking-[0.18em] text-xs sm:text-sm uppercase"
        >
          Karma Commits
          <span className="beta-tag">BETA</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href={username ? `/leaderboard?username=${encodeURIComponent(username)}` : "/leaderboard"}
            className="font-mono text-xs text-gh-muted hover:text-gh-text transition-colors flex items-center gap-1.5"
          >
            <Trophy size={12} />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>

          <button
            onClick={() => username && router.push(`/ai-review?username=${encodeURIComponent(username)}`)}
            className="font-mono text-xs text-amber hover:text-amber/80 transition-colors flex items-center gap-1.5"
          >
            <span>✦ AI Review</span>
          </button>

          <Link
            href="/"
            className="font-mono text-xs text-gh-muted hover:text-gh-text transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </div>
      </motion.nav>

      {/* ── Main content ── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 items-start">
          {/* ── Left column: 100% mobile, 60% desktop ── */}
          <motion.div
            className="col-span-1 lg:col-span-3 space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ScoreHero passport={passport} rawData={rawData} />
            <CategoryBreakdown passport={passport} />
            <StatsGrid passport={passport} rawData={rawData} />
          </motion.div>

          {/* ── Right column: 100% mobile, 40% desktop ── */}
          <motion.div
            className="col-span-1 lg:col-span-2 space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            <RadarSection passport={passport} />
            <BadgeSection passport={passport} />
          </motion.div>
        </div>

        {/* ── Passport Card ── */}
        <PassportSection passport={passport} />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gh-bg text-gh-text" />}>
      <DashboardPageContent />
    </Suspense>
  );
}
