"use client";

import { Trophy } from "lucide-react";

// Placeholder leaderboard data — will be replaced with real API data in Phase 2
const PLACEHOLDER_ENTRIES = [
  { rank: 1, login: "torvalds", name: "Linus Torvalds", score: 987, tier: "Legend", badges: 9 },
  { rank: 2, login: "gaearon", name: "Dan Abramov", score: 912, tier: "Legend", badges: 8 },
  { rank: 3, login: "addyosmani", name: "Addy Osmani", score: 878, tier: "Luminary", badges: 7 },
  { rank: 4, login: "sindresorhus", name: "Sindre Sorhus", score: 841, tier: "Luminary", badges: 7 },
  { rank: 5, login: "nicolo-ribaudo", name: "Nicolo Ribaudo", score: 802, tier: "Luminary", badges: 6 },
  { rank: 6, login: "ljharb", name: "Jordan Harband", score: 768, tier: "Luminary", badges: 6 },
  { rank: 7, login: "antfu", name: "Anthony Fu", score: 741, tier: "Maintainer", badges: 5 },
  { rank: 8, login: "jaredpalmer", name: "Jared Palmer", score: 719, tier: "Maintainer", badges: 5 },
  { rank: 9, login: "Rich-Harris", name: "Rich Harris", score: 695, tier: "Maintainer", badges: 5 },
  { rank: 10, login: "yyx990803", name: "Evan You", score: 671, tier: "Maintainer", badges: 4 },
];

const TIER_COLORS: Record<string, string> = {
  Legend: "#f0a500",
  Luminary: "#f0a500",
  Maintainer: "#10b981",
  Contributor: "#38bdf8",
  Sprout: "#a78bfa",
  Seed: "#8b949e",
};

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function LeaderboardTable() {
  return (
    <div className="border border-gh-border bg-gh-surface overflow-x-auto">
      {/* Note banner */}
      <div className="border-b border-gh-border bg-amber/5 px-4 py-2.5 flex items-center gap-2">
        <Trophy size={13} className="text-amber flex-shrink-0" />
        <span className="font-mono text-xs text-amber truncate">
          Global leaderboard — Phase 2 will populate with live data
        </span>
      </div>

      {/* Mobile: Card layout, Desktop: Table layout */}
      <div className="block sm:hidden">
        {/* Mobile view */}
        <div className="divide-y divide-gh-border">
          {PLACEHOLDER_ENTRIES.map((entry) => {
            const tierColor = TIER_COLORS[entry.tier] ?? "#8b949e";
            return (
              <div
                key={entry.rank}
                className="px-4 py-4 space-y-3 transition-colors hover:bg-gh-bg"
              >
                {/* Rank + Name */}
                <div className="flex items-start gap-3">
                  <span className="font-mono text-lg font-bold flex-shrink-0">
                    {RANK_ICONS[entry.rank] ?? `#${entry.rank}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-gh-text truncate">
                      {entry.name}
                    </p>
                    <p className="font-mono text-xs text-gh-muted">@{entry.login}</p>
                  </div>
                </div>
                
                {/* Score and Tier on same line */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-gh-muted block mb-0.5">Score</span>
                    <span
                      className="font-mono text-base font-bold"
                      style={{ color: tierColor }}
                    >
                      {entry.score}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-gh-muted block mb-0.5">Tier</span>
                    <span
                      className="font-mono text-xs font-bold px-2 py-1 border"
                      style={{ color: tierColor, borderColor: `${tierColor}40` }}
                    >
                      {entry.tier}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-gh-muted block mb-0.5">Badges</span>
                    <span className="font-mono text-base font-bold text-gh-text">
                      {entry.badges}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Traditional table */}
      <div className="hidden sm:block overflow-x-auto min-w-full">
        {/* Table header */}
        <div className="grid grid-cols-[3rem_1fr_8rem_6rem_5rem] gap-4 px-5 py-3 border-b border-gh-border sticky top-0 bg-gh-surface">
          {["Rank", "Developer", "Score", "Tier", "Badges"].map((h) => (
            <span key={h} className="font-mono text-xs text-gh-muted uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gh-border">
          {PLACEHOLDER_ENTRIES.map((entry) => {
            const tierColor = TIER_COLORS[entry.tier] ?? "#8b949e";

            return (
              <div
                key={entry.rank}
                className="grid grid-cols-[3rem_1fr_8rem_6rem_5rem] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-gh-bg"
              >
                {/* Rank */}
                <span className="font-mono text-sm text-gh-muted text-center">
                  {RANK_ICONS[entry.rank] ?? (
                    <span className="text-gh-border">#{entry.rank}</span>
                  )}
                </span>

                {/* Developer */}
                <div className="min-w-0">
                  <p className="font-mono text-sm text-gh-text truncate">
                    {entry.name}
                  </p>
                  <p className="font-mono text-xs text-gh-muted">@{entry.login}</p>
                </div>

                {/* Score */}
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: tierColor }}
                >
                  {entry.score}
                  <span className="text-gh-muted font-normal text-xs">/1000</span>
                </span>

                {/* Tier */}
                <span
                  className="font-mono text-xs px-2 py-0.5 border w-fit"
                  style={{ color: tierColor, borderColor: `${tierColor}40` }}
                >
                  {entry.tier}
                </span>

                {/* Badges */}
                <span className="font-mono text-xs text-gh-muted text-center">
                  {entry.badges}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
