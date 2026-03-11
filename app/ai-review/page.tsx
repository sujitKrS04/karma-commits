"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AIReviewError from "@/components/AIReviewError";
import { type AIReview } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MESSAGES = [
  "Cloning repository structure...",
  "Reading source files...",
  "Analyzing code patterns...",
  "Evaluating naming conventions...",
  "Checking architectural decisions...",
  "Reviewing documentation quality...",
  "Assessing best practices...",
  "Forming final verdict...",
  "Almost done...",
];

const PERSONALITY_ICON: Record<string, string> = {
  Pragmatist: "⚙️",
  Perfectionist: "💎",
  Experimenter: "🧪",
  Architect: "🏛️",
  Hacker: "⚡",
};

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return "#10b981";
  if (grade === "B+" || grade === "B") return "#f0a500";
  if (grade === "C+" || grade === "C") return "#fb923c";
  return "#f43f5e";
}

function scoreBarColor(score: number): string {
  if (score <= 40) return "#f43f5e";
  if (score <= 65) return "#f0a500";
  if (score <= 80) return "#10b981";
  return "#34d399";
}

function overallGradeFromScore(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 85) return "A";
  if (score >= 78) return "B+";
  if (score >= 70) return "B";
  if (score >= 63) return "C+";
  if (score >= 55) return "C";
  return "D";
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen({ done }: { done: boolean }) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Fake progress: 0 → 85 over 15s
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fake = Math.min(85, (elapsed / 15000) * 85);
      setProgress(Math.round(fake));
    }, 100);

    statusRef.current = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusRef.current) clearInterval(statusRef.current);
    };
  }, []);

  useEffect(() => {
    if (done) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusRef.current) clearInterval(statusRef.current);
      setProgress(100);
    }
  }, [done]);

  return (
    <div className="min-h-screen bg-gh-bg flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <h1
          className="font-mono font-bold text-amber mb-2"
          style={{ fontSize: "28px", letterSpacing: "0.12em" }}
        >
          ANALYZING YOUR CODE
        </h1>
        <p className="font-sans text-gh-muted text-sm mb-10">
          Powered by Groq
        </p>

        {/* Progress bar */}
        <div
          className="w-full mb-6"
          style={{
            height: "4px",
            backgroundColor: "#30363d",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "#f0a500",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Progress percentage */}
        <p className="font-mono text-amber text-xs mb-8">{progress}%</p>

        {/* Rotating status messages */}
        <div style={{ height: "24px" }} className="overflow-hidden mb-12">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIdx}
              className="font-mono text-sm text-gh-muted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {STATUS_MESSAGES[statusIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Footer notes */}
        <p className="font-sans text-xs text-gh-muted opacity-60 mb-1">
          Analyzing up to 6 files across your top 2 public repositories
        </p>
        <p className="font-sans text-xs text-gh-muted opacity-60">
          This takes 10–15 seconds
        </p>
      </motion.div>
    </div>
  );
}

// ─── Dimension Card ───────────────────────────────────────────────────────────

function DimensionCard({
  dim,
  delay,
}: {
  dim: AIReview["dimensions"][number];
  delay: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const barColor = scoreBarColor(dim.score);
  const gColor = gradeColor(dim.grade);

  return (
    <motion.div
      className="border border-gh-border bg-gh-surface p-5"
      style={{ transition: "box-shadow 200ms, border-color 200ms" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 0 1px #f0a50040";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#f0a50040";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#30363d";
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm font-bold text-gh-text">
          {dim.name}
        </span>
        <span
          className="font-mono text-xs font-bold px-2 py-0.5"
          style={{ backgroundColor: gColor + "22", color: gColor, border: `1px solid ${gColor}40` }}
        >
          {dim.grade}
        </span>
      </div>

      {/* Score row */}
      <div className="flex items-baseline justify-end mb-1.5">
        <span
          className="font-mono font-bold"
          style={{ fontSize: "28px", color: barColor, lineHeight: 1 }}
        >
          {dim.score}
        </span>
        <span className="font-mono text-gh-muted text-xs ml-1">/ 100</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full mb-4"
        style={{ height: "3px", backgroundColor: "#21262d" }}
      >
        <div
          style={{
            height: "100%",
            width: animated ? `${dim.score}%` : "0%",
            backgroundColor: barColor,
            transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Summary */}
      <p className="font-sans text-xs text-gh-muted mb-4 leading-relaxed">
        {dim.summary}
      </p>

      {/* Strengths */}
      <div className="mb-3">
        <p
          className="font-mono mb-1.5"
          style={{
            fontSize: "10px",
            color: "#10b981",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          ✓ STRENGTHS
        </p>
        <ul className="space-y-1">
          {dim.strengths.map((s, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <span style={{ color: "#10b981", fontSize: "10px", marginTop: "2px" }}>●</span>
              <span className="font-sans text-xs text-gh-muted">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      <div>
        <p
          className="font-mono mb-1.5"
          style={{
            fontSize: "10px",
            color: "#f0a500",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          → TO IMPROVE
        </p>
        <ul className="space-y-1">
          {dim.improvements.map((imp, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <span style={{ color: "#f0a500", fontSize: "10px", marginTop: "2px" }}>→</span>
              <span className="font-sans text-xs text-gh-muted">{imp}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [review, setReview] = useState<AIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadDone, setLoadDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiScoreOnPassport, setAiScoreOnPassport] = useState(false);

  const username =
    (session as { login?: string })?.login ??
    session?.user?.name ??
    session?.user?.email?.split("@")[0] ??
    "";

  const fetchReview = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setLoadDone(false);
    setError(null);
    setReview(null);

    try {
      const res = await fetch(
        `/api/ai-review?username=${encodeURIComponent(username)}`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "UNKNOWN");
        return;
      }

      setReview(json.review);
      // Persist to localStorage for PassportCard integration
      if (json.review) {
        try {
          const grade = overallGradeFromScore(json.review.overallScore);
          localStorage.setItem(
            "kc_ai_score",
            JSON.stringify({ score: json.review.overallScore, grade })
          );
        } catch {
          // localStorage not available
        }
      }
    } catch {
      setError("AI_UNAVAILABLE");
    } finally {
      setLoadDone(true);
      setTimeout(() => setLoading(false), 400);
    }
  }, [username]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Fetch on mount once session is ready
  useEffect(() => {
    if (status === "authenticated" && username) {
      fetchReview();
    }
  }, [status, username, fetchReview]);

  // Load saved passport toggle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kc_ai_on_passport");
      if (saved === "true") setAiScoreOnPassport(true);
    } catch {
      // ignore
    }
  }, []);

  const handleTogglePassport = (val: boolean) => {
    setAiScoreOnPassport(val);
    try {
      localStorage.setItem("kc_ai_on_passport", val ? "true" : "false");
    } catch {
      // ignore
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (status === "loading" || (loading && !error)) {
    return <LoadingScreen done={loadDone} />;
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <AIReviewError
        code={error}
        onRetry={() => fetchReview()}
      />
    );
  }

  if (!review) return null;

  const grade = overallGradeFromScore(review.overallScore);
  const gradeBg = gradeColor(grade);
  const personalityIcon = PERSONALITY_ICON[review.developerPersonality] ?? "⚙️";

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text pb-20">
      {/* ══════ NAV ══════ */}
      <nav className="h-14 border-b border-gh-border bg-gh-surface px-6 flex items-center justify-between sticky top-0 z-40">
        <Link
          href="/"
          className="font-mono font-bold text-amber tracking-[0.18em] text-sm uppercase"
        >
          Karma Commits
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/leaderboard"
            className="font-mono text-xs text-gh-muted hover:text-gh-text transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/ai-review"
            className="font-mono text-xs text-amber transition-colors"
          >
            ✦ AI Review
          </Link>
          <Link
            href="/dashboard"
            className="font-mono text-xs text-gh-muted hover:text-gh-text transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">

        {/* ══════ HEADER CARD ══════ */}
        <motion.div
          className="border border-gh-border bg-gh-surface"
          style={{ borderBottom: "1px solid #30363d" }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-3 gap-0 divide-x divide-gh-border">

            {/* LEFT: Identity */}
            <div className="p-6 flex items-center gap-4">
              {session?.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={username}
                  className="w-16 h-16 rounded-full flex-shrink-0"
                  style={{ outline: "2px solid #f0a500", outlineOffset: "3px" }}
                />
              )}
              <div>
                <p className="font-mono font-bold text-gh-text text-base leading-tight">
                  {session?.user?.name ?? username}
                </p>
                <p className="font-mono text-gh-muted text-xs mb-1">
                  @{username}
                </p>
                <p
                  className="font-mono text-xs"
                  style={{ color: "#f0a500", letterSpacing: "0.1em", fontSize: "10px" }}
                >
                  CODE REVIEW REPORT
                </p>
                <p className="font-sans text-xs text-gh-muted mt-0.5">
                  Analyzed March 2026
                </p>
              </div>
            </div>

            {/* CENTER: Score */}
            <div className="p-6 flex flex-col items-center justify-center gap-2">
              <p
                className="font-mono"
                style={{ fontSize: "10px", color: "#f0a500", letterSpacing: "0.15em", fontWeight: 700 }}
              >
                OVERALL SCORE
              </p>
              <ScoreDisplay score={review.overallScore} />
              <span
                className="font-mono text-sm font-bold px-4 py-1"
                style={{
                  backgroundColor: gradeBg + "22",
                  color: gradeBg,
                  border: `1px solid ${gradeBg}60`,
                  fontSize: "18px",
                }}
              >
                {grade}
              </span>
              <p
                className="font-sans text-xs text-gh-muted italic text-center leading-relaxed"
                style={{ maxWidth: "340px" }}
              >
                {review.overallVerdict}
              </p>
            </div>

            {/* RIGHT: Personality */}
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <p
                className="font-mono"
                style={{ fontSize: "10px", color: "#f0a500", letterSpacing: "0.15em", fontWeight: 700 }}
              >
                DEVELOPER PERSONALITY
              </p>
              <span style={{ fontSize: "52px", lineHeight: 1 }}>{personalityIcon}</span>
              <p className="font-mono font-bold text-amber text-lg">
                {review.developerPersonality}
              </p>
              <p className="font-sans text-xs text-gh-muted italic leading-relaxed" style={{ maxWidth: "220px" }}>
                {review.developerPersonalityReason}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══════ 6 DIMENSION CARDS ══════ */}
        <div>
          <h2 className="font-mono text-xs text-gh-muted tracking-widest uppercase mb-4">
            Dimension Breakdown
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {review.dimensions.map((dim, i) => (
              <DimensionCard key={dim.id} dim={dim} delay={i * 150} />
            ))}
          </div>
        </div>

        {/* ══════ STRENGTHS vs IMPROVEMENTS ══════ */}
        <div className="grid grid-cols-2 gap-4">
          {/* Superpowers */}
          <motion.div
            className="p-6"
            style={{
              backgroundColor: "#0a1f14",
              border: "1px solid #10b981",
            }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3
              className="font-mono font-bold mb-5"
              style={{ color: "#10b981", letterSpacing: "0.1em" }}
            >
              YOUR SUPERPOWERS ✦
            </h3>
            <ul className="space-y-3">
              {review.topStrengths.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span style={{ color: "#10b981", flexShrink: 0 }}>✦</span>
                  <span className="font-sans text-sm text-gh-text">{s}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Level Up */}
          <motion.div
            className="p-6"
            style={{
              backgroundColor: "#1f150a",
              border: "1px solid #f0a500",
            }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3
              className="font-mono font-bold mb-5"
              style={{ color: "#f0a500", letterSpacing: "0.1em" }}
            >
              LEVEL UP HERE →
            </h3>
            <ul className="space-y-3">
              {review.topImprovements.map((imp, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span style={{ color: "#f0a500", flexShrink: 0 }}>→</span>
                  <span className="font-sans text-sm text-gh-text">{imp}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ══════ REPO HIGHLIGHTS ══════ */}
        {review.repoHighlights.length > 0 && (
          <div>
            <h2 className="font-mono text-xs text-gh-muted tracking-widest uppercase mb-4">
              Repo Highlights
            </h2>
            <div className="flex gap-4 flex-wrap">
              {review.repoHighlights.map((rh, i) => {
                return (
                  <motion.div
                    key={i}
                    className="border border-gh-border bg-gh-surface p-5 flex-1 min-w-[240px]"
                    style={{ borderLeft: "3px solid #f0a500" }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * i }}
                  >
                    <p className="font-mono font-bold text-gh-text text-sm mb-2">
                      {rh.repoName}
                    </p>
                    <p className="font-sans text-xs text-gh-muted italic leading-relaxed mb-3">
                      {rh.standoutObservation}
                    </p>
                    <a
                      href={`https://github.com/${username}/${rh.repoName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-amber hover:underline"
                    >
                      View on GitHub →
                    </a>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════ CAREER INSIGHT ══════ */}
        <motion.div
          className="border border-gh-border bg-gh-surface p-8 text-center relative overflow-hidden"
          style={{ borderLeft: "6px solid #f0a500" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {/* Subtle amber glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(240,165,0,0.05) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <p
            className="font-mono mb-4 relative"
            style={{ fontSize: "11px", color: "#f0a500", letterSpacing: "0.15em", fontWeight: 700 }}
          >
            🎯 CAREER INSIGHT
          </p>
          <p
            className="font-sans text-gh-text italic relative"
            style={{ fontSize: "18px", maxWidth: "700px", margin: "0 auto", lineHeight: 1.6 }}
          >
            {review.careerInsight}
          </p>
        </motion.div>
      </main>

      {/* ══════ STICKY BOTTOM ACTION BAR ══════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center px-6"
        style={{
          height: "52px",
          backgroundColor: "#161b22",
          borderTop: "1px solid #30363d",
        }}
      >
        {/* Left: Groq branding */}
        <div className="flex items-center gap-2 flex-1">
          <span
            className="font-mono font-bold text-sm"
            style={{
              color: "#f0a500",
              border: "1px solid #f0a50040",
              padding: "1px 6px",
              fontSize: "11px",
            }}
          >
            GQ
          </span>
          <span className="font-sans text-xs text-gh-muted">
            Powered by Groq
          </span>
        </div>

        {/* Center: Toggle */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <span className="font-mono text-xs text-gh-muted">
            Show AI Score on Passport Card
          </span>
          <button
            onClick={() => handleTogglePassport(!aiScoreOnPassport)}
            className="relative flex-shrink-0"
            style={{
              width: "36px",
              height: "20px",
              backgroundColor: aiScoreOnPassport ? "#f0a500" : "#30363d",
              borderRadius: "10px",
              transition: "background-color 200ms",
              cursor: "pointer",
              border: "none",
              padding: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "3px",
                left: aiScoreOnPassport ? "19px" : "3px",
                width: "14px",
                height: "14px",
                backgroundColor: aiScoreOnPassport ? "#0d1117" : "#8b949e",
                borderRadius: "50%",
                transition: "left 200ms",
              }}
            />
          </button>
          {aiScoreOnPassport && (
            <span className="font-mono text-xs text-amber">ON</span>
          )}
        </div>

        {/* Right: Back link */}
        <div className="flex-1 flex justify-end">
          <Link
            href="/dashboard"
            className="font-mono text-xs text-amber hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Score Display with count-up ──────────────────────────────────────────────

function ScoreDisplay({ score }: { score: number }) {
  const displayed = useCountUp(score);
  return (
    <span
      className="font-mono font-bold text-amber"
      style={{ fontSize: "72px", lineHeight: 1, letterSpacing: "-2px" }}
    >
      {displayed}
    </span>
  );
}
