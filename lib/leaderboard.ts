/**
 * Server-only utility for reading and writing /data/leaderboard.json.
 * Do NOT import this file in client components — it uses Node `fs`.
 */

import fs from "fs";
import path from "path";
import type { LeaderboardUser } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADERBOARD_PATH = path.join(DATA_DIR, "leaderboard.json");

// ─── Readers ──────────────────────────────────────────────────────────────────

export function readLeaderboard(): LeaderboardUser[] {
  try {
    if (!fs.existsSync(LEADERBOARD_PATH)) return [];
    const raw = fs.readFileSync(LEADERBOARD_PATH, "utf-8");
    return JSON.parse(raw) as LeaderboardUser[];
  } catch {
    console.error("[leaderboard] Failed to read leaderboard.json");
    return [];
  }
}

// ─── Writers ──────────────────────────────────────────────────────────────────

export function writeLeaderboard(entries: LeaderboardUser[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export function upsertLeaderboardEntry(
  entry: Omit<LeaderboardUser, "updatedAt">
): void {
  const entries = readLeaderboard();
  const idx = entries.findIndex(
    (e) => e.username.toLowerCase() === entry.username.toLowerCase()
  );
  const updated: LeaderboardUser = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    entries[idx] = updated;
  } else {
    entries.push(updated);
  }
  writeLeaderboard(entries);
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = "karmaScore" | "reviewer" | "mentor" | "builder" | "bugHunter" | "documentor";

export function sortLeaderboard(
  entries: LeaderboardUser[],
  sortKey: SortKey
): LeaderboardUser[] {
  return [...entries].sort((a, b) => {
    if (sortKey === "karmaScore") return b.karmaScore - a.karmaScore;
    const aVal = a.categoryScores[sortKey as keyof typeof a.categoryScores] ?? 0;
    const bVal = b.categoryScores[sortKey as keyof typeof b.categoryScores] ?? 0;
    return bVal - aVal;
  });
}
