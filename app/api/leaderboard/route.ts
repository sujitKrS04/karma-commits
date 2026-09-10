// ─── /api/leaderboard — Chunk 11 (Supabase-backed) ───────────────────────────
// GET /api/leaderboard?sort=karmaScore
//   sort options: karmaScore | reviewer | mentor | builder | bugHunter | documentor
// POST /api/leaderboard  (body: LeaderboardUser without updatedAt)

import { NextRequest, NextResponse } from "next/server";
import {
  readLeaderboardSorted,
  upsertLeaderboardEntry,
} from "@/lib/leaderboard";
import type { LeaderboardUser } from "@/lib/types";

// ─── GET /api/leaderboard?sort=karmaScore ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = (searchParams.get("sort") ?? "karmaScore") as
    | "karmaScore"
    | "reviewer"
    | "mentor"
    | "builder"
    | "bugHunter"
    | "documentor";

  // Validate sort key
  const validSorts = ["karmaScore", "reviewer", "mentor", "builder", "bugHunter", "documentor"];
  const safeSortKey = validSorts.includes(sort)
    ? (sort as "karmaScore" | "reviewer" | "mentor" | "builder" | "bugHunter" | "documentor")
    : "karmaScore";

  // Chunk 11: query Supabase sorted server-side by the requested column
  const sorted = await readLeaderboardSorted(safeSortKey);
  return NextResponse.json(sorted);
}

// ─── POST /api/leaderboard ────────────────────────────────────────────────────
// Body: LeaderboardUser (without updatedAt)

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Omit<LeaderboardUser, "updatedAt">;
    if (!body.username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }
    await upsertLeaderboardEntry(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
