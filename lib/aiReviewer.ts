// ─── AI Reviewer — Dual-Model Pipeline ────────────────────────────────────────
// Model 1 — Gemini 1.5 Flash (primary): full code analysis → structured AIReview JSON
//            Falls back to Groq compound on failure.
// Model 2 — Groq compound (primary): casual personality paragraph
//            Falls back to Gemini on failure.
// Both results are merged into a single AIReview response.
// SERVER ONLY — never import this on the client.

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { type AIReview, type CodePayload } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodeAnalysisResult {
  codeQualityScore: number;
  strengths: string[];
  improvements: string[];
  consistencyNote: string;
  reasoning: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripFences(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}

function safeParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(stripFences(text));
    } catch {
      throw new Error("AI_PARSE_FAILED");
    }
  }
}

// ─── Groq fallback models (verified working on this account) ─────────────────

const GROQ_ANALYSIS_MODELS = [
  "groq/compound",
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
];

const GROQ_PERSONALITY_MODELS = [
  "groq/compound",
  "groq/compound-mini",
];

// ─── Gemini models (verified working on this account) ─────────────────────────
// gemini-flash-lite-latest: 1.5s, clean JSON ✔
// gemini-3.1-flash-lite:    4.5s, clean JSON ✔ (fallback)

const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
];

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildAnalysisPrompt(repoBlock: string): string {
  return `You are a senior software engineer doing a thorough code review. Analyze the code samples from 2 GitHub repositories below.

REPOSITORIES:
${repoBlock}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "overallScore": <0-100>,
  "overallVerdict": "<2-3 sentence honest summary>",
  "developerPersonality": "<one of: Pragmatist|Perfectionist|Experimenter|Architect|Hacker>",
  "developerPersonalityReason": "<one sentence>",
  "codeQualityScore": <0-100>,
  "strengths": ["<specific strength referencing actual code>", "<specific strength>"],
  "improvements": ["<specific improvement>", "<specific improvement>"],
  "consistencyNote": "<observation about consistency between the two repos>",
  "reasoning": "<brief score explanation referencing actual patterns>",
  "topStrengths": ["<s1>", "<s2>", "<s3>"],
  "topImprovements": ["<i1>", "<i2>", "<i3>"],
  "careerInsight": "<1-2 sentences on ideal role>",
  "dimensions": [
    { "id": "codeQuality", "name": "Code Quality", "score": <0-100>, "grade": "<A+|A|B+|B|C+|C|D>", "summary": "<specific observation>", "strengths": ["<s>"], "improvements": ["<i>"] },
    { "id": "readability", "name": "Readability & Naming", "score": <0-100>, "grade": "<grade>", "summary": "<specific observation>", "strengths": ["<s>"], "improvements": ["<i>"] },
    { "id": "architecture", "name": "Architecture & Structure", "score": <0-100>, "grade": "<grade>", "summary": "<specific observation>", "strengths": ["<s>"], "improvements": ["<i>"] },
    { "id": "documentation", "name": "Documentation Quality", "score": <0-100>, "grade": "<grade>", "summary": "<specific observation>", "strengths": ["<s>"], "improvements": ["<i>"] },
    { "id": "bestPractices", "name": "Best Practices & Patterns", "score": <0-100>, "grade": "<grade>", "summary": "<specific observation>", "strengths": ["<s>"], "improvements": ["<i>"] },
    { "id": "consistency", "name": "Consistency & Style", "score": <0-100>, "grade": "<grade>", "summary": "<specific observation>", "strengths": ["<s>"], "improvements": ["<i>"] }
  ],
  "repoHighlights": [{ "repoName": "<name>", "standoutObservation": "<specific>" }]
}
Reference actual patterns from the code — no generic advice.`;
}

function buildPersonalityPrompt(analysisJson: string): string {
  return `Based on this code analysis, write the developer's "personality" — a punchy, casual one-paragraph archetype (Pragmatist, Perfectionist, Architect, Tinkerer, or invent one).

ANALYSIS:
${analysisJson}

Rules: one paragraph, 3-4 sentences max, casual not corporate, reference something specific from the analysis, plain text only.`;
}

// ─── Default dimensions ───────────────────────────────────────────────────────

const DEFAULT_DIMENSIONS: Array<{ id: string; name: string }> = [
  { id: "codeQuality", name: "Code Quality" },
  { id: "readability", name: "Readability & Naming" },
  { id: "architecture", name: "Architecture & Structure" },
  { id: "documentation", name: "Documentation Quality" },
  { id: "bestPractices", name: "Best Practices & Patterns" },
  { id: "consistency", name: "Consistency & Style" },
];

// ─── normalizeAIReview ────────────────────────────────────────────────────────

export function normalizeAIReview(raw: any): AIReview {
  const overallScore =
    typeof raw?.overallScore === "number"
      ? Math.min(100, Math.max(0, Math.round(raw.overallScore)))
      : typeof raw?.codeQualityScore === "number"
        ? Math.min(100, Math.max(0, Math.round(raw.codeQualityScore)))
        : 75;

  const overallVerdict =
    typeof raw?.overallVerdict === "string" && raw.overallVerdict.trim().length > 0
      ? raw.overallVerdict
      : "Demonstrates consistent code patterns and strong potential across multiple repositories.";

  const validPersonalities = [
    "Pragmatist", "Perfectionist", "Experimenter", "Architect", "Hacker",
  ] as const;
  const developerPersonality = validPersonalities.includes(raw?.developerPersonality)
    ? raw.developerPersonality
    : "Pragmatist";

  const developerPersonalityReason =
    typeof raw?.developerPersonalityReason === "string" &&
    raw.developerPersonalityReason.trim().length > 0
      ? raw.developerPersonalityReason
      : "Builds practical solutions with a focus on getting working software into production.";

  const rawDims = Array.isArray(raw?.dimensions) ? raw.dimensions : [];
  const dimensions = DEFAULT_DIMENSIONS.map((defDim) => {
    const found = rawDims.find(
      (d: any) =>
        d?.id === defDim.id ||
        (typeof d?.name === "string" &&
          d.name.toLowerCase() === defDim.name.toLowerCase())
    );

    const score =
      typeof found?.score === "number"
        ? Math.min(100, Math.max(0, Math.round(found.score)))
        : overallScore;

    const grade =
      typeof found?.grade === "string" && found.grade.trim().length > 0
        ? found.grade
        : score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D";

    const summary =
      typeof found?.summary === "string" && found.summary.trim().length > 0
        ? found.summary
        : `${defDim.name} reflects solid engineering fundamentals and clear intent.`;

    const strengths = Array.isArray(found?.strengths)
      ? found.strengths.filter((s: any) => typeof s === "string" && s.trim().length > 0)
      : [];

    const improvements = Array.isArray(found?.improvements)
      ? found.improvements.filter((s: any) => typeof s === "string" && s.trim().length > 0)
      : [];

    return {
      id: defDim.id,
      name: defDim.name,
      score,
      grade,
      summary,
      strengths: strengths.length > 0 ? strengths : [`Good baseline implementation in ${defDim.name}`],
      improvements: improvements.length > 0 ? improvements : [`Expand coverage and documentation in ${defDim.name}`],
    };
  });

  const topStrengths =
    Array.isArray(raw?.topStrengths) && raw.topStrengths.length > 0
      ? raw.topStrengths.filter((s: any) => typeof s === "string" && s.trim().length > 0)
      : dimensions.flatMap((d) => d.strengths).slice(0, 3);

  const topImprovements =
    Array.isArray(raw?.topImprovements) && raw.topImprovements.length > 0
      ? raw.topImprovements.filter((s: any) => typeof s === "string" && s.trim().length > 0)
      : dimensions.flatMap((d) => d.improvements).slice(0, 3);

  const repoHighlights = Array.isArray(raw?.repoHighlights)
    ? raw.repoHighlights
        .filter((r: any) => r && typeof r.repoName === "string")
        .map((r: any) => ({
          repoName: r.repoName,
          standoutObservation:
            typeof r.standoutObservation === "string" &&
            r.standoutObservation.trim().length > 0
              ? r.standoutObservation
              : "Active repository with meaningful code and functionality.",
        }))
    : [];

  const careerInsight =
    typeof raw?.careerInsight === "string" && raw.careerInsight.trim().length > 0
      ? raw.careerInsight
      : "Thrives in fast-paced software development teams delivering real-world product features.";

  return {
    overallScore,
    overallVerdict,
    developerPersonality,
    developerPersonalityReason,
    dimensions,
    topStrengths:
      topStrengths.length > 0
        ? topStrengths
        : ["Clean code organization", "Consistent coding patterns", "Practical problem solving"],
    topImprovements:
      topImprovements.length > 0
        ? topImprovements
        : ["Add automated tests", "Document core interfaces", "Add CI linting rules"],
    repoHighlights,
    careerInsight,
  };
}

// ─── Model 1: Gemini analysis (primary) + Groq fallback ───────────────────────

async function runGeminiAnalysis(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErr: unknown = null;

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      });
      console.log(`[AI Review] Analysis → ${modelId}`);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error("EMPTY_RESPONSE");
      return safeParseJSON(text);
    } catch (err) {
      console.warn(`[AI Review] Gemini ${modelId} failed:`, err instanceof Error ? err.message : err);
      lastErr = err;
    }
  }
  throw lastErr || new Error("GEMINI_UNAVAILABLE");
}

async function runGroqAnalysis(prompt: string, groq: Groq): Promise<any> {
  let lastError: unknown = null;
  for (const model of GROQ_ANALYSIS_MODELS) {
    try {
      console.log(`[AI Review] Analysis fallback → ${model}`);
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
      });
      const text = completion.choices[0]?.message?.content ?? "";
      if (!text) throw new Error("EMPTY_RESPONSE");
      return safeParseJSON(text);
    } catch (err) {
      console.warn(`[AI Review] ${model} failed:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError || new Error("AI_UNAVAILABLE");
}

// ─── Model 2: Groq personality (primary) + Gemini fallback ───────────────────

async function runGroqPersonality(prompt: string, groq: Groq): Promise<string> {
  let lastError: unknown = null;
  for (const model of GROQ_PERSONALITY_MODELS) {
    try {
      console.log(`[AI Review] Personality → ${model}`);
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });
      const text = completion.choices[0]?.message?.content ?? "";
      if (!text) throw new Error("EMPTY_RESPONSE");
      return text.trim();
    } catch (err) {
      console.warn(`[AI Review] Personality ${model} failed:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError || new Error("AI_UNAVAILABLE");
}

async function runGeminiPersonality(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErr: unknown = null;

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      });
      console.log(`[AI Review] Personality fallback → ${modelId}`);
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn(`[AI Review] Gemini personality ${modelId} failed:`, err instanceof Error ? err.message : err);
      lastErr = err;
    }
  }
  throw lastErr || new Error("GEMINI_UNAVAILABLE");
}

// ─── Exported sub-functions (for isolated testing per chunks 2 & 6) ──────────

export async function generateCodeAnalysis(
  repoBlock: string,
  groq: Groq
): Promise<CodeAnalysisResult> {
  const prompt = buildAnalysisPrompt(repoBlock);
  try {
    return await runGeminiAnalysis(prompt) as CodeAnalysisResult;
  } catch (err) {
    console.warn("[AI Review] Gemini analysis failed, trying Groq:", err instanceof Error ? err.message : err);
    return await runGroqAnalysis(prompt, groq) as CodeAnalysisResult;
  }
}

export async function generatePersonality(
  analysisResult: CodeAnalysisResult | null,
  groq: Groq
): Promise<string> {
  const analysisJson = analysisResult
    ? JSON.stringify(analysisResult, null, 2)
    : JSON.stringify(
        {
          codeQualityScore: 75,
          strengths: ["Consistent naming conventions", "Clear module separation"],
          improvements: ["Add error handling", "Improve test coverage"],
          consistencyNote: "Hardcoded test — no real analysis provided.",
          reasoning: "Test stub for isolated model validation.",
        },
        null,
        2
      );

  const prompt = buildPersonalityPrompt(analysisJson);

  try {
    return await runGroqPersonality(prompt, groq);
  } catch {
    console.warn("[AI Review] All Groq personality models failed, trying Gemini fallback");
    try {
      return await runGeminiPersonality(prompt);
    } catch (err) {
      console.warn("[AI Review] Gemini personality fallback also failed:", err instanceof Error ? err.message : err);
      return ""; // Non-fatal — default personality reason will be used
    }
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Dual-model pipeline:
 * 1. Gemini 1.5 Flash  → full structured code analysis JSON (with Groq fallback)
 * 2. Groq compound     → personality paragraph (with Gemini fallback)
 * Merges both outputs into a single normalized AIReview.
 */
export async function generateCodeReview(payload: CodePayload): Promise<AIReview> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Build repoBlock for prompt
  const repoBlock = payload.repos
    .map(
      (repo) =>
        `=== REPO: ${repo.name} (${repo.language} | ⭐${repo.stars}) ===
Description: ${repo.description || "No description"}
URL: ${repo.url}

README:
${repo.readme || "No README found"}

SOURCE FILES:
${repo.files.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n")}`
    )
    .join("\n\n---\n\n");

  const analysisPrompt = buildAnalysisPrompt(repoBlock);

  // ── Call 1: Gemini analysis (primary) → Groq fallback ────────────────────
  let rawReview: any = null;
  try {
    rawReview = await runGeminiAnalysis(analysisPrompt);
    console.log(`[AI Review] Gemini analysis complete — score: ${rawReview?.overallScore}`);
  } catch (geminiErr) {
    console.warn("[AI Review] Gemini failed, trying Groq analysis:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
    try {
      rawReview = await runGroqAnalysis(analysisPrompt, groq);
      console.log(`[AI Review] Groq analysis complete — score: ${rawReview?.overallScore}`);
    } catch (groqErr) {
      throw groqErr || new Error("AI_UNAVAILABLE");
    }
  }

  if (!rawReview) throw new Error("AI_UNAVAILABLE");

  const review = normalizeAIReview(rawReview);

  // ── Call 2: Groq personality (primary) → Gemini fallback ─────────────────
  try {
    const personality = await generatePersonality(
      {
        codeQualityScore: rawReview.codeQualityScore ?? review.overallScore,
        strengths: rawReview.strengths ?? [],
        improvements: rawReview.improvements ?? [],
        consistencyNote: rawReview.consistencyNote ?? "",
        reasoning: rawReview.reasoning ?? "",
      },
      groq
    );
    if (personality) {
      review.developerPersonalityReason = personality;
      console.log("[AI Review] Personality merged into review.");
    }
  } catch (err) {
    console.warn("[AI Review] Personality step failed (non-fatal):", err);
  }

  return review;
}
