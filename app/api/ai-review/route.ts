// ─── /api/ai-review — Phase 7 ─────────────────────────────────────────────────
// GET: Returns an AI-powered code review for the authenticated user (or ?username=xxx)
// Never exposes GROQ_API_KEY to the client.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { fetchCodeSamples } from "@/lib/codeFetcher";
import { generateCodeReview } from "@/lib/aiReviewer";
import { type AIReview } from "@/lib/types";

// ─── In-memory cache (30-min TTL) ─────────────────────────────────────────────
const cache = new Map<string, { data: AIReview; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET(request: Request) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username =
    searchParams.get("username") ??
    session.login ??
    session.user?.name ??
    "";

  if (!username) {
    return NextResponse.json({ error: "NO_USERNAME" }, { status: 400 });
  }

  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "NO_ACCESS_TOKEN" }, { status: 401 });
  }

  // Cache hit?
  const cached = cache.get(username);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ review: cached.data, cached: true });
  }

  try {
    // 1. Fetch code
    const payload = await fetchCodeSamples(username, accessToken);

    if (!payload.repos.length) {
      return NextResponse.json({ error: "NO_REPOS" }, { status: 404 });
    }

    // 2. Run AI review
    let review: AIReview;
    try {
      review = await generateCodeReview(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "UNKNOWN";
      console.error("[AI Review] generateCodeReview failed:", err);
      if (message === "AI_PARSE_FAILED") {
        return NextResponse.json({ error: "AI_PARSE_FAILED" }, { status: 503 });
      }
      return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 503 });
    }

    // 3. Cache and return
    cache.set(username, { data: review, timestamp: Date.now() });
    return NextResponse.json({ review, cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "UNKNOWN";

    if (message === "NO_REPOS") {
      return NextResponse.json({ error: "NO_REPOS" }, { status: 404 });
    }
    if (message === "ONLY_FORKS") {
      return NextResponse.json({ error: "ONLY_FORKS" }, { status: 404 });
    }
    console.error("[AI Review API Error]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
