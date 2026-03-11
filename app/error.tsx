"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gh-bg flex items-center justify-center p-6">
      <div className="border border-rose/40 bg-rose/5 p-8 max-w-lg w-full">
        {/* Status dot */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-rose animate-pulse" />
          <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
            Runtime Error
          </span>
          {error.digest && (
            <span className="ml-auto font-mono text-[10px] text-gh-muted">
              digest: {error.digest}
            </span>
          )}
        </div>

        <h2 className="font-mono font-bold text-gh-text text-lg mb-2">
          Something went wrong
        </h2>

        {error.message && (
          <div className="bg-gh-bg border border-gh-border p-4 mb-6 overflow-auto max-h-40">
            <code className="font-mono text-xs text-rose break-all">
              {error.message}
            </code>
          </div>
        )}

        <p className="font-sans text-sm text-gh-muted mb-6 leading-relaxed">
          An unexpected error occurred. Try again — if it persists, check your
          connection or come back in a moment.
        </p>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 btn-amber text-sm px-5 py-2.5"
          >
            <RefreshCw size={13} />
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 font-mono text-xs px-5 py-2.5 border border-gh-border text-gh-muted hover:text-gh-text hover:border-gh-text transition-colors"
          >
            <Home size={13} />
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
