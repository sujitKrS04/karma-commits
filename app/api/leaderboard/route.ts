import { NextRequest, NextResponse } from "next/server";
import {
  readLeaderboard,
  upsertLeaderboardEntry,
  sortLeaderboard,
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

  const entries = readLeaderboard();
  const sorted = sortLeaderboard(entries, sort);
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
    upsertLeaderboardEntry(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
