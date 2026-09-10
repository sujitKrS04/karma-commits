// ─── Code Fetcher — Phase 7 (Chunk 4 unified) ────────────────────────────────
// Fetches real source code from a user's top 2 non-fork repos for AI review.
// Uses fetchTopNonForkRepos (Chunk 3) for repo selection and fetches files
// using the repo's actual default branch (not a hardcoded "HEAD" ref).

import { Octokit } from "@octokit/rest";
import { type CodePayload } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

/** Maximum characters to keep per individual file (hard cap). */
const MAX_CHARS_PER_FILE = 3000;

/** Maximum number of source files to pull per repo. */
const MAX_FILES_PER_REPO = 5;

/** Number of non-fork repos to analyze. */
const REPOS_TO_ANALYZE = 2;

// ─── Extension / exclusion helpers ───────────────────────────────────────────

const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".go", ".rs",
  ".java", ".cpp", ".c", ".cs", ".rb", ".php", ".swift", ".kt",
]);

const EXCLUDE_PATTERNS = [
  "node_modules/", "dist/", "build/", ".min.js",
  ".lock", ".json", ".env",
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => filePath.includes(p));
}

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot === -1 ? "" : filePath.slice(dot);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function truncateLines(text: string, maxLines: number, note: string): string {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join("\n") + `\n${note}`;
}

// ─── Exported file type ───────────────────────────────────────────────────────

export interface RepoCodeFile {
  path: string;
  content: string;
  language: string;
}

// ─── Chunk 4: fetchCodeFromRepo ───────────────────────────────────────────────

/**
 * Fetches source files from a single repo using the repo's actual default branch.
 * - Filters by CODE_EXTENSIONS, excludes EXCLUDE_PATTERNS
 * - Caps content at MAX_CHARS_PER_FILE per file
 * - Returns at most MAX_FILES_PER_REPO files
 * - Never throws — returns [] on failure
 */
export async function fetchCodeFromRepo(
  owner: string,
  repo: string,
  defaultBranch: string,
  accessToken: string
): Promise<RepoCodeFile[]> {
  const octokit = new Octokit({ auth: accessToken });
  const files: RepoCodeFile[] = [];

  // 1. Get file tree using the actual default branch name (e.g. "main" or "master")
  let candidateFiles: Array<{ path: string; size: number }> = [];
  try {
    const { data: tree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "1",
    });

    if (tree.truncated) {
      console.warn(`[CodeFetcher] Tree truncated for ${owner}/${repo} — large repo, using partial tree`);
    }

    candidateFiles = (tree.tree ?? [])
      .filter(
        (f) =>
          f.type === "blob" &&
          f.path &&
          CODE_EXTENSIONS.has(getExtension(f.path)) &&
          !shouldExclude(f.path)
      )
      .map((f) => ({ path: f.path!, size: f.size ?? 0 }))
      // Prefer larger (more substantive) files
      .sort((a, b) => b.size - a.size)
      .slice(0, MAX_FILES_PER_REPO);
  } catch (err) {
    console.warn(`[CodeFetcher] Tree fetch failed for ${owner}/${repo}:`, (err as Error).message);
    return [];
  }

  // 2. Fetch file contents
  for (const file of candidateFiles) {
    await sleep(150);
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path,
      });

      if ("content" in data && data.content) {
        const raw = Buffer.from(data.content, "base64").toString("utf-8");
        const capped =
          raw.length > MAX_CHARS_PER_FILE
            ? raw.slice(0, MAX_CHARS_PER_FILE) + "\n// ... [file capped for review]"
            : raw;

        files.push({
          path: file.path,
          content: capped,
          language: getExtension(file.path).slice(1),
        });
      }
    } catch {
      // Skip silently — binary or deleted file
    }
  }

  return files;
}

// ─── Main export: fetchCodeSamples (Chunk 3+4 unified pipeline) ───────────────

/**
 * Selects the top 2 non-fork repos (sorted by most recently pushed),
 * fetches source code files from each using their actual default branch,
 * and returns a CodePayload for the AI reviewer.
 */
export async function fetchCodeSamples(
  username: string,
  accessToken: string
): Promise<CodePayload> {
  const octokit = new Octokit({ auth: accessToken });

  // ── A) Fetch repos sorted by most recently pushed, filter forks ──────────────
  const { data: allRepos } = await octokit.rest.repos.listForUser({
    username,
    per_page: 50,
    type: "owner",
    sort: "pushed",
    direction: "desc",
  });

  const topRepos = allRepos
    .filter((r) => !r.fork)
    .slice(0, REPOS_TO_ANALYZE);

  if (topRepos.length === 0) {
    throw new Error("NO_REPOS");
  }

  const repos: CodePayload["repos"] = [];

  for (const repo of topRepos) {
    const repoName = repo.name;
    const owner = repo.owner?.login ?? username;
    // Use the actual default branch name — avoids ambiguous "HEAD" ref resolution
    const defaultBranch = repo.default_branch ?? "main";

    console.log(`[CodeFetcher] Scanning ${owner}/${repoName} (branch: ${defaultBranch})`);

    // ── B) Fetch source files ─────────────────────────────────────────────────
    const files = await fetchCodeFromRepo(owner, repoName, defaultBranch, accessToken);

    // ── C) README ─────────────────────────────────────────────────────────────
    let readme = "";
    try {
      const { data } = await octokit.rest.repos.getReadme({
        owner,
        repo: repoName,
      });
      if ("content" in data && data.content) {
        const raw = Buffer.from(data.content, "base64").toString("utf-8");
        readme = truncateLines(raw, 25, "<!-- README truncated -->");
      }
    } catch {
      // No README — fine
    }

    repos.push({
      name: repoName,
      description: repo.description ?? "",
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? "Unknown",
      url: repo.html_url ?? `https://github.com/${owner}/${repoName}`,
      files,
      readme,
    });
  }

  return {
    username,
    totalReposAnalyzed: repos.length,
    repos,
  };
}
