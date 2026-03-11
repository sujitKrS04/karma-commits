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
    <div className="border border-gh-border bg-gh-surface p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
            Karma Score
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <motion.span
              className="font-mono font-bold text-5xl"
              style={{ color: tierColor }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {score.total}
            </motion.span>
            <span className="font-mono text-gh-muted text-lg">/ 1000</span>
          </div>
        </div>
        <div className="text-right">
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
      <div className="space-y-4">
        {score.dimensions.map((dim, i) => (
          <div key={dim.dimension}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dim.color }}
                />
                <span className="font-mono text-sm text-gh-text">{dim.label}</span>
              </div>
              <span className="font-mono text-sm" style={{ color: dim.color }}>
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
