import { NextRequest, NextResponse } from "next/server";
import { fetchContributionData } from "@/lib/githubFetcher";
import { calculateKarma } from "@/lib/karmaEngine";
import { upsertLeaderboardEntry } from "@/lib/leaderboard";
import type { ContributionData } from "@/lib/types";

// ─── In-memory cache (10-minute TTL) ─────────────────────────────────────────

interface CacheEntry {
  data: ContributionData;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(username: string): ContributionData | null {
  const entry = cache.get(username.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(username.toLowerCase());
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: ContributionData): void {
  cache.set(username.toLowerCase(), { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── GET /api/github?username={username} ──────────────────────────────────────
// username is required

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  // Require username parameter
  if (!username) {
    return NextResponse.json({ error: "username parameter is required" }, { status: 400 });
  }

  // Get the GitHub token from environment
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("[API] GITHUB_TOKEN is not set in environment");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Return cached result if available
  const cached = getCached(username);
  if (cached) {
    console.log(`[API] cache hit for ${username}`);
    return NextResponse.json(cached);
  }

  try {
    console.log(`[API] fetching contribution data for ${username}…`);
    const raw = await fetchContributionData(username, githubToken);
    const result = calculateKarma(raw);

    setCache(username, result);

    // Upsert to leaderboard for any username analyzed
    try {
      upsertLeaderboardEntry({
        username: result.username,
        name: result.name ?? result.username,
        avatarUrl: result.avatarUrl,
        karmaScore: result.karmaScore,
        categoryScores: result.categoryScores,
        rank: result.rank as "Apprentice" | "Contributor" | "Veteran" | "Legend",
        badges: result.badges
          .filter((b) => b.earned)
          .map((b) => ({ id: b.id, name: b.name ?? b.id, icon: b.icon, earned: true })),
      });
      console.log(`[API] leaderboard updated for ${username}`);
    } catch (leErr) {
      // Non-fatal — log and continue
      console.warn(`[API] leaderboard upsert failed for ${username}:`, leErr);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = (err as Error).message ?? "Unknown error";
    console.error(`[API] error for ${username}:`, message);

    if (message.toLowerCase().includes("user not found") || message.includes("404")) {
      return NextResponse.json({ error: `GitHub user not found: ${username}` }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to fetch GitHub data", detail: message },
      { status: 500 }
    );
  }
}

