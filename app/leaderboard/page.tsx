"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import type { LeaderboardUser } from "@/lib/types";
import LeaderboardSkeleton from "@/components/LeaderboardSkeleton";

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterTab =
  | "Overall"
  | "Reviewer"
  | "Mentor"
  | "Builder"
  | "Bug Hunter"
  | "Documentor";

type SortKey =
  | "karmaScore"
  | "reviewer"
  | "mentor"
  | "builder"
  | "bugHunter"
  | "documentor";

const TABS: { label: FilterTab; sortKey: SortKey }[] = [
  { label: "Overall", sortKey: "karmaScore" },
  { label: "Reviewer", sortKey: "reviewer" },
  { label: "Mentor", sortKey: "mentor" },
  { label: "Builder", sortKey: "builder" },
  { label: "Bug Hunter", sortKey: "bugHunter" },
  { label: "Documentor", sortKey: "documentor" },
];

const RANK_LEFT_BORDER: Record<number, string> = {
  1: "#f0a500",
  2: "#8b949e",
  3: "#fb923c",
};

const RANK_TINT: Record<number, string> = {
  1: "rgba(240, 165, 0, 0.06)",
  2: "rgba(139, 148, 158, 0.03)",
  3: "rgba(251, 146, 60, 0.05)",
};

const RANK_MEDAL: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const DOT_DEFS: {
  key: keyof LeaderboardUser["categoryScores"];
  color: string;
  label: string;
}[] = [
  { key: "builder", color: "#f0a500", label: "Builder" },
  { key: "reviewer", color: "#10b981", label: "Reviewer" },
  { key: "bugHunter", color: "#f43f5e", label: "Bug Hunter" },
  { key: "documentor", color: "#06b6d4", label: "Documentor" },
  { key: "mentor", color: "#fb923c", label: "Mentor" },
];

const RANK_PILL: Record<string, { label: string; color: string }> = {
  Legend: { label: "LEGEND", color: "#f0a500" },
  Veteran: { label: "VETERAN", color: "#fb923c" },
  Contributor: { label: "CONTRIBUTOR", color: "#10b981" },
  Apprentice: { label: "APPRENTICE", color: "#8b949e" },
};

const CATEGORY_LABELS: Record<
  keyof LeaderboardUser["categoryScores"],
  { label: string; emoji: string }
> = {
  builder: { label: "Builder", emoji: "🔨" },
  reviewer: { label: "Reviewer", emoji: "🦅" },
  bugHunter: { label: "Bug Hunter", emoji: "🐛" },
  documentor: { label: "Documentor", emoji: "📖" },
  mentor: { label: "Mentor", emoji: "🎓" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortEntries(
  entries: LeaderboardUser[],
  key: SortKey
): LeaderboardUser[] {
  return [...entries].sort((a, b) => {
    if (key === "karmaScore") return b.karmaScore - a.karmaScore;
    return (
      (b.categoryScores[key as keyof typeof b.categoryScores] ?? 0) -
      (a.categoryScores[key as keyof typeof a.categoryScores] ?? 0)
    );
  });
}

function getTopCategory(
  user: LeaderboardUser
): keyof LeaderboardUser["categoryScores"] {
  return (
    Object.entries(user.categoryScores) as [
      keyof typeof user.categoryScores,
      number,
    ][]
  ).reduce((best, curr) => (curr[1] > best[1] ? curr : best))[0];
}

function getDisplayScore(entry: LeaderboardUser, sortKey: SortKey): number {
  if (sortKey === "karmaScore") return entry.karmaScore;
  return entry.categoryScores[sortKey as keyof typeof entry.categoryScores] ?? 0;
}

// ─── LeaderboardRow (memoized) ──────────────────────────────────────────────

const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  index,
  rank,
  sortKey,
  isCurrentUser,
  onClick,
}: {
  entry: LeaderboardUser;
  index: number;
  rank: number;
  sortKey: SortKey;
  isCurrentUser: boolean;
  onClick: () => void;
}) {
  const borderColor = RANK_LEFT_BORDER[rank] ?? "#30363d";
  const bgColor = isCurrentUser
    ? "rgba(240, 165, 0, 0.08)"
    : RANK_TINT[rank] ?? "transparent";
  const earnedBadges = entry.badges.filter((b) => b.earned);
  const shown = earnedBadges.slice(0, 3);
  const extra = earnedBadges.length - shown.length;
  const pill = RANK_PILL[entry.rank] ?? RANK_PILL.Apprentice;
  const displayScore = getDisplayScore(entry, sortKey);
  const displayMax = sortKey === "karmaScore" ? 1000 : 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.045, 0.6) }}
      onClick={onClick}
      className="group flex items-center gap-4 px-5 py-3.5 cursor-pointer
                 border-b border-gh-border last:border-b-0
                 hover:brightness-[1.08] transition-all duration-150"
      style={{
        background: bgColor,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      {/* ── Rank ── */}
      <div className="w-9 flex-shrink-0 flex items-center justify-center">
        {rank <= 3 ? (
          <span className="text-xl leading-none select-none">
            {RANK_MEDAL[rank]}
          </span>
        ) : (
          <span
            className="font-mono text-lg font-bold tabular-nums"
            style={{ color: "#8b949e" }}
          >
            {rank}
          </span>
        )}
      </div>

      {/* ── Avatar ── */}
      <div className="flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.avatarUrl}
          alt={entry.username}
          className="w-10 h-10 rounded-full border-2 border-gh-border group-hover:border-amber/50 transition-colors"
          loading="lazy"
        />
      </div>

      {/* ── Identity ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-semibold text-gh-text text-sm leading-none">
            {entry.name || entry.username}
          </span>
          {isCurrentUser && (
            <span
              className="font-mono text-xs font-bold px-1.5 py-0.5"
              style={{ background: "#f0a500", color: "#0d1117" }}
            >
              YOU
            </span>
          )}
          <span
            className="font-mono text-[10px] px-2 py-0.5 border font-bold tracking-widest flex-shrink-0"
            style={{
              color: pill.color,
              borderColor: `${pill.color}40`,
              backgroundColor: `${pill.color}10`,
            }}
          >
            {pill.label}
          </span>
        </div>
        <span className="font-mono text-xs text-gh-muted mt-0.5 block">
          @{entry.username}
        </span>
      </div>

      {/* ── 5 category strength dots ── */}
      <div
        className="hidden sm:flex items-center gap-1.5 flex-shrink-0"
        title="Category strengths (filled = score ≥ 60)"
      >
        {DOT_DEFS.map(({ key, color, label }) => {
          const score = entry.categoryScores[key] ?? 0;
          const filled = score >= 60;
          return (
            <span
              key={key}
              title={`${label}: ${Math.round(score)}`}
              className="w-2.5 h-2.5 rounded-full border transition-all"
              style={{
                backgroundColor: filled ? color : "transparent",
                borderColor: color,
                opacity: filled ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>

      {/* ── Earned badges ── */}
      <div className="hidden md:flex items-center gap-0.5 flex-shrink-0 min-w-[5rem]">
        {shown.map((b) => (
          <span
            key={b.id}
            title={b.name}
            className="text-[17px] leading-none select-none"
          >
            {b.icon}
          </span>
        ))}
        {extra > 0 && (
          <span className="font-mono text-xs text-gh-muted ml-1">+{extra}</span>
        )}
      </div>

      {/* ── Score ── */}
      <div className="flex-shrink-0 text-right">
        <div
          className="font-mono font-bold tabular-nums leading-none"
          style={{ fontSize: "22px", color: "#f0a500" }}
        >
          {displayScore}
        </div>
        <div className="font-mono text-[10px] text-gh-muted mt-0.5">
          /{displayMax}
        </div>
      </div>

      {/* ── Arrow ── */}
      <ChevronRight
        size={14}
        className="flex-shrink-0 text-gh-border group-hover:text-amber transition-colors"
      />
    </motion.div>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function LeaderboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") ?? "";

  const [activeTab, setActiveTab] = useState<FilterTab>("Overall");
  const [sortKey, setSortKey] = useState<SortKey>("karmaScore");
  const [allEntries, setAllEntries] = useState<LeaderboardUser[]>([]);
  const [sorted, setSorted] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [listKey, setListKey] = useState(0);

  // ── Load ──
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data: LeaderboardUser[] = await res.json();
          setAllEntries(data);
          setSorted(data);
        }
      } catch {
        /* non-critical */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Tab switch ──
  const handleTabChange = useCallback(
    (tab: FilterTab, sk: SortKey) => {
      setActiveTab(tab);
      setSortKey(sk);
      setSorted(sortEntries(allEntries, sk));
      setListKey((k) => k + 1);
    },
    [allEntries]
  );

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text">
      {/* ── Navigation ── */}
      <motion.nav
        className="h-14 border-b border-gh-border bg-gh-surface px-6 flex items-center justify-between sticky top-0 z-40"
        initial={{ y: -56 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Link
          href="/"
          className="font-mono font-bold text-amber tracking-[0.18em] text-sm uppercase"
        >
          Karma Commits
          <span className="beta-tag">BETA</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-mono text-xs text-gh-muted hover:text-gh-text transition-colors"
          >
            Back to home
          </Link>
          <Link
            href={username ? `/dashboard?username=${encodeURIComponent(username)}` : "/"}
            className="font-mono text-xs text-amber hover:text-amber/80 transition-colors"
          >
            {username ? "Back to Dashboard" : "Enter dashboard →"}
          </Link>
        </div>
      </motion.nav>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Page header ── */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Trophy size={20} className="text-amber flex-shrink-0" />
            <h1
              className="font-mono font-bold tracking-[0.12em] uppercase text-lg sm:text-[22px]"
            >
              Karma Leaderboard
            </h1>
          </div>
          <p className="font-sans text-sm text-gh-muted leading-relaxed max-w-xl">
            The open source contributors who make communities thrive — not just
            codebases.
          </p>
          {!loading && (
            <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 font-mono text-xs text-gh-muted">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ background: "#10b981" }}
                />
                {allEntries.length} contributors ranked
              </span>
              <span className="hidden sm:block">Scores computed in real-time</span>
            </div>
          )}
        </motion.div>

        {/* ── Filter tabs ── */}
        <motion.div
          className="flex border-b border-gh-border overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          {TABS.map(({ label, sortKey: sk }) => {
            const isActive = activeTab === label;
            return (
              <button
                key={label}
                onClick={() => handleTabChange(label, sk)}
                className={`relative flex-shrink-0 font-mono text-xs px-4 pb-3 pt-2
                            tracking-wide transition-colors duration-150 whitespace-nowrap ${
                              isActive
                                ? "text-gh-text"
                                : "text-gh-muted hover:text-gh-text"
                            }`}
              >
                {label}
                {isActive && (
                  <motion.span
                    layoutId="tab-pip"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "#f0a500" }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Card list ── */}
        <div className="border border-t-0 border-gh-border bg-gh-surface overflow-hidden">
          {loading ? (
            <LeaderboardSkeleton />
          ) : sorted.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-mono text-sm text-gh-muted">
                No entries yet.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout" key={listKey}>
              {sorted.map((entry, index) => {
                const rank = index + 1;
                return (
                  <LeaderboardRow
                    key={entry.username}
                    entry={entry}
                    index={index}
                    rank={rank}
                    sortKey={sortKey}
                    isCurrentUser={false}
                    onClick={() =>
                      router.push(`/dashboard?username=${entry.username}`)
                    }
                  />
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── Dot legend ── */}
        <motion.div
          className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <span className="font-mono text-[10px] text-gh-muted tracking-widest uppercase">
            Category dots:
          </span>
          {DOT_DEFS.map(({ key, color, label }) => (
            <span
              key={key}
              className="flex items-center gap-1.5 font-mono text-[10px] text-gh-muted"
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
          <span className="font-mono text-[10px] text-gh-muted">
            ● filled = score ≥ 60
          </span>
        </motion.div>
      </main>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gh-bg text-gh-text" />}>
      <LeaderboardPageContent />
    </Suspense>
  );
}
