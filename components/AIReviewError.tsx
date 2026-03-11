"use client";

import Link from "next/link";

// ─── AIReviewError — Phase 7 ──────────────────────────────────────────────────

type ErrorCode = "NO_REPOS" | "ONLY_FORKS" | "AI_UNAVAILABLE" | "AI_PARSE_FAILED" | string;

const ERROR_CONFIG: Record<
  string,
  { icon: string; title: string; message: string; cta: "back" | "retry" }
> = {
  NO_REPOS: {
    icon: "📭",
    title: "No public repositories found",
    message: "Push some code to GitHub first, then come back!",
    cta: "back",
  },
  ONLY_FORKS: {
    icon: "🍴",
    title: "Only forked repos found",
    message:
      "We only analyze original work, not forks. Build something of your own!",
    cta: "back",
  },
  AI_UNAVAILABLE: {
    icon: "⚡",
    title: "Groq is taking a break",
    message:
      "AI review is temporarily unavailable. Your Karma Score is unaffected.",
    cta: "retry",
  },
  AI_PARSE_FAILED: {
    icon: "🔧",
    title: "Couldn't parse AI response",
    message: "Something went wrong analyzing the results.",
    cta: "retry",
  },
  default: {
    icon: "⚠️",
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    cta: "retry",
  },
};

interface AIReviewErrorProps {
  code: ErrorCode;
  onRetry?: () => void;
}

export default function AIReviewError({ code, onRetry }: AIReviewErrorProps) {
  const config = ERROR_CONFIG[code] ?? ERROR_CONFIG.default;

  return (
    <div className="min-h-screen bg-gh-bg flex items-center justify-center p-6">
      <div
        className="border border-gh-border bg-gh-surface p-10 max-w-md w-full text-center"
        style={{ boxShadow: "0 0 40px rgba(0,0,0,0.4)" }}
      >
        <div className="text-6xl mb-5">{config.icon}</div>

        <h2 className="font-mono font-bold text-gh-text text-lg mb-3 leading-tight">
          {config.title}
        </h2>

        <p className="font-sans text-sm text-gh-muted leading-relaxed mb-8">
          {config.message}
        </p>

        {config.cta === "back" ? (
          <Link
            href="/dashboard"
            className="inline-block font-mono text-xs px-6 py-2.5 border border-gh-border text-amber hover:border-amber/60 transition-all"
          >
            ← Back to Dashboard
          </Link>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={onRetry}
              className="font-mono text-xs px-6 py-2.5 bg-amber text-gh-bg font-bold hover:bg-amber/90 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="font-mono text-xs text-gh-muted hover:text-gh-text transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
