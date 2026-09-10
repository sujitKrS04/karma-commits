// ─── /api/ai-review — Phase 7 (Chunk 7 update) ────────────────────────────────
// GET: Returns an AI-powered code review for a given username.
// Chunk 7 additions:
//   - checkRateLimit(username) gate before the pipeline (returns 429 if exceeded)
//   - Both Groq calls wrapped in try/catch; 429 errors fall back to llama-3.1-8b-instant
// Never exposes GROQ_API_KEY to the client.

import { NextResponse } from "next/server";
import { fetchCodeSamples } from "@/lib/codeFetcher";
import { generateCodeReview, normalizeAIReview } from "@/lib/aiReviewer";
import { checkRateLimit } from "@/lib/rateLimiter";
import { type AIReview } from "@/lib/types";

// ─── In-memory cache (30-min TTL) ─────────────────────────────────────────────
const cache = new Map<string, { data: AIReview; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

// ─── 429 detection ────────────────────────────────────────────────────────────

function is429(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests");
  }
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json({ error: "NO_USERNAME" }, { status: 400 });
  }

  // ── Rate limit gate (Chunk 7) ────────────────────────────────────────────────
  if (!checkRateLimit(username)) {
    console.warn(`[AI Review] Rate limited: ${username}`);
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests for this user. Please wait before retrying." },
      { status: 429 }
    );
  }

  // ── GitHub token check ───────────────────────────────────────────────────────
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("[AI Review] GITHUB_TOKEN is not set in environment");
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  // ── Cache hit ────────────────────────────────────────────────────────────────
  const cached = cache.get(username);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ review: normalizeAIReview(cached.data), cached: true });
  }

  try {
    // 1. Fetch code
    const payload = await fetchCodeSamples(username, githubToken);

    if (!payload.repos.length) {
      return NextResponse.json({ error: "NO_REPOS" }, { status: 404 });
    }

    // 2. Run two-model AI review (Chunk 7: wrapped in try/catch with 429 fallback)
    let review: AIReview;
    try {
      review = await generateCodeReview(payload);
    } catch (err: unknown) {
      // On a 429 from Groq, surface a clean error to the client
      if (is429(err)) {
        console.warn("[AI Review] Groq 429 — rate limited by upstream");
        return NextResponse.json(
          { error: "AI_RATE_LIMITED", message: "AI provider is rate-limited. Please try again in a moment." },
          { status: 429 }
        );
      }
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
