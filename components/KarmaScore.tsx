"use client";

import { motion } from "framer-motion";
import { type KarmaScore as KarmaScoreType } from "@/lib/types";

const TIER_COLORS: Record<string, string> = {
  Legend: "#f0a500",
  Luminary: "#f0a500",
  Maintainer: "#10b981",
  Contributor: "#38bdf8",
  Sprout: "#a78bfa",
  Seed: "#8b949e",
};

interface KarmaScoreProps {
  score: KarmaScoreType;
}

export default function KarmaScore({ score }: KarmaScoreProps) {
  const tierColor = TIER_COLORS[score.tier] ?? "#8b949e";

  return (
    <div className="border border-gh-border bg-gh-surface p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
        <div className="flex-1">
          <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
            Karma Score
          </span>
          <div className="flex items-baseline gap-2 sm:gap-3 mt-1">
            <motion.span
              className="font-mono font-bold text-4xl sm:text-5xl"
              style={{ color: tierColor }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {score.total}
            </motion.span>
            <span className="font-mono text-gh-muted text-base sm:text-lg">/ 1000</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span
            className="font-mono text-xs px-2 py-1 border"
            style={{ color: tierColor, borderColor: `${tierColor}40` }}
          >
            {score.tier.toUpperCase()}
          </span>
          <p className="font-mono text-xs text-gh-muted mt-2">
            Top {100 - score.percentile}% globally
          </p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3 sm:space-y-4">
        {score.dimensions.map((dim, i) => (
          <div key={dim.dimension}>
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dim.color }}
                />
                <span className="font-mono text-xs sm:text-sm text-gh-text truncate">{dim.label}</span>
              </div>
              <span className="font-mono text-xs sm:text-sm flex-shrink-0 ml-2" style={{ color: dim.color }}>
                {dim.score}
              </span>
            </div>
            {/* Track */}
            <div className="h-1.5 bg-gh-bg border border-gh-border overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: dim.color }}
                initial={{ width: 0 }}
                animate={{ width: `${dim.score}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>
            <p className="font-sans text-xs text-gh-muted mt-1">{dim.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
