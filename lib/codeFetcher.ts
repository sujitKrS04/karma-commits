// ─── Code Fetcher — Phase 7 ───────────────────────────────────────────────────
// Fetches real source code from a user's top GitHub repos for AI review.

import { Octokit } from "@octokit/rest";
import { type CodePayload } from "@/lib/types";

// Extensions we care about for code review
const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".go", ".rs",
  ".java", ".cpp", ".c", ".cs", ".rb", ".php", ".swift", ".kt",
]);

// Paths to exclude
const EXCLUDE_PATTERNS = [
  "node_modules/", "dist/", "build/", ".min.js",
  ".lock", ".json", ".env",
];

function shouldExclude(path: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => path.includes(p));
}

function getExtension(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function truncateLines(text: string, maxLines: number, note: string): string {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join("\n") + `\n${note}`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function fetchCodeSamples(
  username: string,
  accessToken: string
): Promise<CodePayload> {
  const octokit = new Octokit({ auth: accessToken });

  // ── A) Top 3 non-fork repos by stars ────────────────────────────────────────
  const { data: allRepos } = await octokit.rest.repos.listForUser({
    username,
    per_page: 30,
    type: "owner",
    sort: "pushed",
  });

  const topRepos = allRepos
    .filter((r) => !r.fork)
    .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
    .slice(0, 2);

  if (topRepos.length === 0) {
    throw new Error("NO_REPOS");
  }

  const repos: CodePayload["repos"] = [];

  for (const repo of topRepos) {
    const repoName = repo.name;
    const owner = repo.owner?.login ?? username;

    // ── B-i) File tree ─────────────────────────────────────────────────────────
    let candidateFiles: Array<{ path: string; size: number }> = [];
    try {
      const { data: tree } = await octokit.rest.git.getTree({
        owner,
        repo: repoName,
        tree_sha: "HEAD",
        recursive: "1",
      });

      candidateFiles = (tree.tree ?? [])
        .filter(
          (f) =>
            f.type === "blob" &&
            f.path &&
            CODE_EXTENSIONS.has(getExtension(f.path)) &&
            !shouldExclude(f.path)
        )
        .map((f) => ({ path: f.path!, size: f.size ?? 0 }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 3);
    } catch {
      // Tree fetch failed — skip file fetching for this repo
    }

    // ── B-ii) Fetch file contents ──────────────────────────────────────────────
    const files: CodePayload["repos"][number]["files"] = [];
    for (const file of candidateFiles) {
      await sleep(200);
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo: repoName,
          path: file.path,
        });

        if ("content" in data && data.content) {
          const raw = Buffer.from(data.content, "base64").toString("utf-8");
          const truncated = truncateLines(
            raw,
            80,
            "// ... [file truncated at 80 lines]"
          );
          files.push({
            path: file.path,
            content: truncated,
            language: getExtension(file.path).slice(1),
          });
        }
      } catch {
        // Skip silently
      }
    }

    // ── B-iii) README ──────────────────────────────────────────────────────────
    let readme = "";
    try {
      const { data } = await octokit.rest.repos.getReadme({
        owner,
        repo: repoName,
      });
      if ("content" in data && data.content) {
        const raw = Buffer.from(data.content, "base64").toString("utf-8");
        readme = truncateLines(raw, 60, "<!-- README truncated at 60 lines -->");
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
