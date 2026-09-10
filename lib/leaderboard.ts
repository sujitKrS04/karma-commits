/**
 * lib/leaderboard.ts — Supabase-backed leaderboard (PR 2, Chunk 9)
 * Replaces the previous file-based /data/leaderboard.json implementation.
 * Uses SUPABASE_SERVICE_ROLE_KEY for server-side writes (bypasses RLS).
 * Uses NEXT_PUBLIC_SUPABASE_URL for the project URL.
 * SERVER ONLY — never import this on the client.
 */

import { createClient } from "@supabase/supabase-js";
import type { LeaderboardUser } from "./types";

// ─── Supabase client (service role — full read/write) ─────────────────────────

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase now calls this the "publishable" key (formerly anon key)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[leaderboard] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Column mapping ───────────────────────────────────────────────────────────
// DB column names → LeaderboardUser field names

type SortKey =
  | "karmaScore"
  | "reviewer"
  | "mentor"
  | "builder"
  | "bugHunter"
  | "documentor";

const SORT_COLUMN: Record<SortKey, string> = {
  karmaScore: "karma_score",
  reviewer: "score_reviewer",
  mentor: "score_mentor",
  builder: "score_builder",
  bugHunter: "score_bug_hunter",
  documentor: "score_documentor",
};

// ─── Row → LeaderboardUser ────────────────────────────────────────────────────

function rowToUser(row: Record<string, any>): LeaderboardUser {
  return {
    username: row.username,
    name: row.name ?? row.username,
    avatarUrl: row.avatar_url ?? "",
    karmaScore: row.karma_score ?? 0,
    categoryScores: {
      builder: row.score_builder ?? 0,
      reviewer: row.score_reviewer ?? 0,
      bugHunter: row.score_bug_hunter ?? 0,
      documentor: row.score_documentor ?? 0,
      mentor: row.score_mentor ?? 0,
    },
    rank: (row.rank as LeaderboardUser["rank"]) ?? "Apprentice",
    badges: Array.isArray(row.badges) ? row.badges : [],
    updatedAt: row.last_updated ?? new Date().toISOString(),
  };
}

// ─── Readers ──────────────────────────────────────────────────────────────────

/**
 * Fetches all leaderboard rows sorted by karma_score descending.
 * Matches the legacy readLeaderboard() signature.
 */
export async function readLeaderboard(): Promise<LeaderboardUser[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("karma_score", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[leaderboard] readLeaderboard error:", error.message);
      return [];
    }

    return (data ?? []).map(rowToUser);
  } catch (err) {
    console.error("[leaderboard] readLeaderboard failed:", (err as Error).message);
    return [];
  }
}

// ─── Writers ──────────────────────────────────────────────────────────────────

/**
 * Upserts a leaderboard entry.
 * If the username already exists, updates scores + last_updated.
 * If not, inserts a new row.
 * Matches the legacy upsertLeaderboardEntry() signature.
 */
export async function upsertLeaderboardEntry(
  entry: Omit<LeaderboardUser, "updatedAt">
): Promise<void> {
  const supabase = getClient();

  const row = {
    username: entry.username.toLowerCase(),
    name: entry.name,
    avatar_url: entry.avatarUrl,
    karma_score: entry.karmaScore,
    score_builder: entry.categoryScores.builder,
    score_reviewer: entry.categoryScores.reviewer,
    score_bug_hunter: entry.categoryScores.bugHunter,
    score_documentor: entry.categoryScores.documentor,
    score_mentor: entry.categoryScores.mentor,
    rank: entry.rank,
    badges: entry.badges,
    last_updated: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("leaderboard")
    .upsert(row, { onConflict: "username" });

  if (error) {
    throw new Error(`[leaderboard] upsert failed for ${entry.username}: ${error.message}`);
  }

  console.log(`[leaderboard] upserted: ${entry.username} (score: ${entry.karmaScore})`);
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches leaderboard rows sorted by the given key.
 * Used by the leaderboard API route (Chunk 11).
 */
export async function readLeaderboardSorted(sortKey: SortKey): Promise<LeaderboardUser[]> {
  try {
    const supabase = getClient();
    const column = SORT_COLUMN[sortKey] ?? "karma_score";

    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order(column, { ascending: false })
      .limit(200);

    if (error) {
      console.error("[leaderboard] readLeaderboardSorted error:", error.message);
      return [];
    }

    return (data ?? []).map(rowToUser);
  } catch (err) {
    console.error("[leaderboard] readLeaderboardSorted failed:", (err as Error).message);
    return [];
  }
}

/**
 * In-memory sort fallback (kept for compatibility — prefer readLeaderboardSorted).
 */
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
