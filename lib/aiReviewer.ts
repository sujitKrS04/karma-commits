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

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateCodeReview(payload: CodePayload): Promise<AIReview> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildPrompt(payload);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  let text = completion.choices[0]?.message?.content ?? "";

  let review: AIReview;
  try {
    review = JSON.parse(text);
  } catch {
    // Strip possible markdown fences
    text = text.replace(/```json|```/g, "").trim();
    try {
      review = JSON.parse(text);
    } catch {
      throw new Error("AI_PARSE_FAILED");
    }
  }

  return review;
}
