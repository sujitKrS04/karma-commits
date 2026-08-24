// ─── AI Reviewer — Phase 7 ────────────────────────────────────────────────────
// Sends code payload to Groq (llama-3.3-70b-versatile) and returns a structured AIReview.
// SERVER ONLY — never import this on the client.

import Groq from "groq-sdk";
import { type AIReview, type CodePayload } from "@/lib/types";

function buildPrompt(payload: CodePayload): string {
  return `You are an expert senior software engineer conducting a portfolio code review.
Analyze the following GitHub repositories and produce an honest, specific, 
constructive code quality report. Reference actual file names and patterns 
you observe. Do not inflate scores. Be direct.

DEVELOPER: ${payload.username}
REPOS ANALYZED: ${payload.totalReposAnalyzed}

${payload.repos
  .map(
    (repo) => `
========================================
REPO: ${repo.name} (${repo.language} | ⭐${repo.stars})
Description: ${repo.description || "No description"}
URL: ${repo.url}

README:
${repo.readme || "No README found"}

SOURCE FILES:
${repo.files
  .map(
    (f) => `
--- ${f.path} ---
${f.content}
`
  )
  .join("\n")}
`
  )
  .join("\n")}

========================================

Respond with ONLY this JSON structure, no other text:
{
  "overallScore": <integer 0-100>,
  "overallVerdict": "<2-3 sentence honest executive summary>",
  "developerPersonality": "<exactly one of: Pragmatist | Perfectionist | Experimenter | Architect | Hacker>",
  "developerPersonalityReason": "<one sentence explaining why>",
  "dimensions": [
    {
      "id": "codeQuality",
      "name": "Code Quality",
      "score": <0-100>,
      "grade": "<A+|A|B+|B|C+|C|D>",
      "summary": "<2-3 specific sentences referencing actual code observed>",
      "strengths": ["<specific strength with file/pattern reference>", "<strength 2>"],
      "improvements": ["<specific actionable improvement>", "<improvement 2>"]
    },
    {
      "id": "readability",
      "name": "Readability & Naming",
      "score": <0-100>,
      "grade": "<grade>",
      "summary": "<specific observation>",
      "strengths": ["<strength>", "<strength>"],
      "improvements": ["<improvement>", "<improvement>"]
    },
    {
      "id": "architecture",
      "name": "Architecture & Structure",
      "score": <0-100>,
      "grade": "<grade>",
      "summary": "<specific observation>",
      "strengths": ["<strength>", "<strength>"],
      "improvements": ["<improvement>", "<improvement>"]
    },
    {
      "id": "documentation",
      "name": "Documentation Quality",
      "score": <0-100>,
      "grade": "<grade>",
      "summary": "<specific observation about README and code comments>",
      "strengths": ["<strength>", "<strength>"],
      "improvements": ["<improvement>", "<improvement>"]
    },
    {
      "id": "bestPractices",
      "name": "Best Practices & Patterns",
      "score": <0-100>,
      "grade": "<grade>",
      "summary": "<specific observation>",
      "strengths": ["<strength>", "<strength>"],
      "improvements": ["<improvement>", "<improvement>"]
    },
    {
      "id": "consistency",
      "name": "Consistency & Style",
      "score": <0-100>,
      "grade": "<grade>",
      "summary": "<specific observation>",
      "strengths": ["<strength>", "<strength>"],
      "improvements": ["<improvement>", "<improvement>"]
    }
  ],
  "topStrengths": ["<overall strength 1>", "<strength 2>", "<strength 3>"],
  "topImprovements": ["<priority improvement 1>", "<improvement 2>", "<improvement 3>"],
  "repoHighlights": [
    {
      "repoName": "<exact repo name>",
      "standoutObservation": "<one specific thing that stood out — good or bad>"
    }
  ],
  "careerInsight": "<1-2 sentences: what role/team/company type would this developer thrive in>"
}`;
}

const DEFAULT_DIMENSIONS: Array<{ id: string; name: string }> = [
  { id: "codeQuality", name: "Code Quality" },
  { id: "readability", name: "Readability & Naming" },
  { id: "architecture", name: "Architecture & Structure" },
  { id: "documentation", name: "Documentation Quality" },
  { id: "bestPractices", name: "Best Practices & Patterns" },
  { id: "consistency", name: "Consistency & Style" },
];

export function normalizeAIReview(raw: any): AIReview {
  const overallScore = typeof raw?.overallScore === "number"
    ? Math.min(100, Math.max(0, Math.round(raw.overallScore)))
    : 75;

  const overallVerdict = typeof raw?.overallVerdict === "string" && raw.overallVerdict.trim().length > 0
    ? raw.overallVerdict
    : "Demonstrates consistent code patterns and strong potential across multiple repositories.";

  const validPersonalities = ["Pragmatist", "Perfectionist", "Experimenter", "Architect", "Hacker"] as const;
  const developerPersonality = validPersonalities.includes(raw?.developerPersonality)
    ? raw.developerPersonality
    : "Pragmatist";

  const developerPersonalityReason = typeof raw?.developerPersonalityReason === "string" && raw.developerPersonalityReason.trim().length > 0
    ? raw.developerPersonalityReason
    : "Builds practical solutions with a focus on getting working software into production.";

  const rawDims = Array.isArray(raw?.dimensions) ? raw.dimensions : [];
  const dimensions = DEFAULT_DIMENSIONS.map((defDim) => {
    const found = rawDims.find(
      (d: any) =>
        d?.id === defDim.id ||
        (typeof d?.name === "string" && d.name.toLowerCase() === defDim.name.toLowerCase())
    );

    const score = typeof found?.score === "number"
      ? Math.min(100, Math.max(0, Math.round(found.score)))
      : overallScore;

    const grade = typeof found?.grade === "string" && found.grade.trim().length > 0
      ? found.grade
      : (score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D");

    const summary = typeof found?.summary === "string" && found.summary.trim().length > 0
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

  const topStrengths = Array.isArray(raw?.topStrengths) && raw.topStrengths.length > 0
    ? raw.topStrengths.filter((s: any) => typeof s === "string" && s.trim().length > 0)
    : dimensions.flatMap((d) => d.strengths).slice(0, 3);

  const topImprovements = Array.isArray(raw?.topImprovements) && raw.topImprovements.length > 0
    ? raw.topImprovements.filter((s: any) => typeof s === "string" && s.trim().length > 0)
    : dimensions.flatMap((d) => d.improvements).slice(0, 3);

  const repoHighlights = Array.isArray(raw?.repoHighlights)
    ? raw.repoHighlights
        .filter((r: any) => r && typeof r.repoName === "string")
        .map((r: any) => ({
          repoName: r.repoName,
          standoutObservation:
            typeof r.standoutObservation === "string" && r.standoutObservation.trim().length > 0
              ? r.standoutObservation
              : "Active repository with meaningful code and functionality.",
        }))
    : [];

  const careerInsight = typeof raw?.careerInsight === "string" && raw.careerInsight.trim().length > 0
    ? raw.careerInsight
    : "Thrives in fast-paced software development teams delivering real-world product features.";

  return {
    overallScore,
    overallVerdict,
    developerPersonality,
    developerPersonalityReason,
    dimensions,
    topStrengths: topStrengths.length > 0 ? topStrengths : ["Clean code organization", "Consistent coding patterns", "Practical problem solving"],
    topImprovements: topImprovements.length > 0 ? topImprovements : ["Add automated tests", "Document core interfaces", "Add CI linting rules"],
    repoHighlights,
    careerInsight,
  };
}

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "groq/compound",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
].filter(Boolean) as string[];

export async function generateCodeReview(payload: CodePayload): Promise<AIReview> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = buildPrompt(payload);

  let lastError: unknown = null;
  let text = "";

  for (const model of CANDIDATE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      text = completion.choices[0]?.message?.content ?? "";
      if (text) {
        break;
      }
    } catch (err: unknown) {
      console.warn(`[AI Review] Model ${model} failed, trying fallback:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  if (!text) {
    throw lastError || new Error("AI_UNAVAILABLE");
  }

  let rawReview: any;
  try {
    rawReview = JSON.parse(text);
  } catch {
    // Strip possible markdown fences
    text = text.replace(/```json|```/g, "").trim();
    try {
      rawReview = JSON.parse(text);
    } catch {
      throw new Error("AI_PARSE_FAILED");
    }
  }

  return normalizeAIReview(rawReview);
}
