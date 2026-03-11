import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
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
// username is optional — falls back to the authenticated user's login

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let username = searchParams.get("username")?.trim();

  // Fall back to the authenticated user when no username is provided
  if (!username) {
    // Prefer the login stored in the session token (set during OAuth sign-in)
    if (session.login) {
      username = session.login;
    } else {
      // Last resort: ask GitHub API
      try {
        const res = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/vnd.github+json",
          },
        });
        if (!res.ok) throw new Error("Could not resolve authenticated user");
        const me = await res.json() as { login: string };
        username = me.login;
      } catch {
        return NextResponse.json({ error: "Could not determine GitHub username" }, { status: 400 });
      }
    }
  }

  // Return cached result if available
  const cached = getCached(username);
  if (cached) {
    console.log(`[API] cache hit for ${username}`);
    return NextResponse.json(cached);
  }

  try {
    console.log(`[API] fetching contribution data for ${username}…`);
    const raw = await fetchContributionData(username, session.accessToken);
    const result = calculateKarma(raw);

    setCache(username, result);

    // Persist to leaderboard whenever we compute a fresh score for
    // the authenticated user (not when viewing other profiles read-only)
    const authedLogin = session.login ?? "";
    if (!authedLogin || authedLogin.toLowerCase() === username.toLowerCase()) {
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

