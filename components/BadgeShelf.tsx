"use client";

import { motion } from "framer-motion";
import { type Badge } from "@/lib/types";

interface BadgeShelfProps {
  badges: Badge[];
}

export default function BadgeShelf({ badges }: BadgeShelfProps) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="border border-gh-border bg-gh-surface p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
            Badges
          </span>
          <p className="font-mono text-sm text-gh-text mt-0.5">
            {earned.length}{" "}
            <span className="text-amber">earned</span> ·{" "}
            {locked.length} locked
          </p>
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {earned.map((badge, i) => (
              <motion.div
                key={badge.id}
                className="border border-gh-border bg-gh-bg p-3 text-center group cursor-default relative"
                style={{
                  borderColor: `${badge.color ?? "#f0a500"}40`,
                  boxShadow: `0 0 12px ${badge.color ?? "#f0a500"}15`,
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                whileHover={{ scale: 1.04 }}
              >
                <div className="text-2xl mb-1.5">{badge.icon}</div>
                <p
                  className="font-mono text-xs font-semibold"
                  style={{ color: badge.color ?? "#f0a500" }}
                >
                  {badge.name ?? badge.label}
                </p>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-gh-surface border border-gh-border p-2 text-xs font-sans text-gh-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {badge.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <p className="font-mono text-xs text-gh-muted mb-3 uppercase tracking-wider">
            Locked
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="border border-gh-border bg-gh-bg p-3 text-center opacity-30 cursor-default"
              >
                <div className="text-2xl mb-1.5 grayscale">{badge.icon}</div>
                <p className="font-mono text-xs text-gh-muted">{badge.name ?? badge.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
