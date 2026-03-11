import { Octokit } from "@octokit/rest";
import type { ContributionData, GitHubStats, GitHubUserData } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function searchCount(
  octokit: Octokit,
  endpoint: "issues" | "commits",
  query: string,
  label: string
): Promise<number> {
  await delay(300);
  try {
    console.log(`[GH] fetching ${label}…`);
    if (endpoint === "commits") {
      const res = await octokit.request("GET /search/commits", {
        q: query,
        per_page: 1,
        headers: { Accept: "application/vnd.github.cloak-preview+json" },
      });
      return (res.data as { total_count: number }).total_count ?? 0;
    } else {
      const res = await octokit.request("GET /search/issues", {
        q: query,
        per_page: 1,
      });
      return (res.data as { total_count: number }).total_count ?? 0;
    }
  } catch (err) {
    console.warn(`[GH] ${label} failed:`, (err as Error).message);
    return 0;
  }
}

// ─── Phase 2: fetchContributionData ──────────────────────────────────────────

export async function fetchContributionData(
  username: string,
  accessToken: string
): Promise<ContributionData> {
  const octokit = new Octokit({ auth: accessToken });

  // ── a) Basic profile ────────────────────────────────────────────────────────
  console.log(`[GH] fetching profile for ${username}…`);
  let profile: {
    name: string | null;
    avatar_url: string;
    bio: string | null;
    followers: number;
    public_repos: number;
    created_at: string;
  };
  try {
    const { data } = await octokit.request("GET /users/{username}", { username });
    profile = data;
  } catch (err) {
    throw new Error(`User not found: ${username} — ${(err as Error).message}`);
  }

  const accountAgeSince = profile.created_at ?? new Date().toISOString();

  // ── b) Total commits ────────────────────────────────────────────────────────
  const totalCommits = await searchCount(
    octokit,
    "commits",
    `author:${username}`,
    "total commits"
  );

  // ── c) PRs merged ───────────────────────────────────────────────────────────
  const totalPRsMerged = await searchCount(
    octokit,
    "issues",
    `author:${username} type:pr is:merged`,
    "PRs merged"
  );

  // ── d) PR reviews given ─────────────────────────────────────────────────────
  const totalPRReviews = await searchCount(
    octokit,
    "issues",
    `reviewed-by:${username} type:pr`,
    "PR reviews"
  );

  // ── e) Issues opened ────────────────────────────────────────────────────────
  const totalIssuesOpened = await searchCount(
    octokit,
    "issues",
    `author:${username} type:issue`,
    "issues opened"
  );

  // ── f) Issues closed by them ────────────────────────────────────────────────
  const totalIssuesClosed = await searchCount(
    octokit,
    "issues",
    `assignee:${username} is:closed`,
    "issues closed"
  );

  // ── g) Repos contributed to (not owned) ────────────────────────────────────
  await delay(300);
  let reposContributedTo = 0;
  try {
    console.log("[GH] fetching repos contributed to…");
    const res = await octokit.request("GET /search/commits", {
      q: `author:${username} NOT user:${username}`,
      per_page: 1,
      headers: { Accept: "application/vnd.github.cloak-preview+json" },
    });
    const nonOwnedCommits = (res.data as { total_count: number }).total_count ?? 0;
    reposContributedTo =
      nonOwnedCommits > 0 ? Math.max(1, Math.floor(nonOwnedCommits / 20)) : 0;
  } catch (err) {
    console.warn("[GH] repos contributed to failed:", (err as Error).message);
    reposContributedTo = Math.max(0, Math.floor(profile.public_repos / 3));
  }

  // ── h) Doc commits (README + docs/ + .md) ──────────────────────────────────
  const docReadme = await searchCount(
    octokit,
    "commits",
    `author:${username} path:README`,
    "README commits"
  );
  const docDocs = await searchCount(
    octokit,
    "commits",
    `author:${username} path:docs`,
    "docs/ commits"
  );
  const docMd = await searchCount(
    octokit,
    "commits",
    `author:${username} path:.md`,
    ".md commits"
  );
  const totalDocCommits = docReadme + docDocs + Math.floor(docMd * 0.5);

  // ── i) First-timer mentoring comments ──────────────────────────────────────
  const firstTimerCommentsCount = await searchCount(
    octokit,
    "issues",
    `commenter:${username} label:good-first-issue`,
    "good-first-issue comments"
  );

  // ── j) Total comments ───────────────────────────────────────────────────────
  const totalComments = await searchCount(
    octokit,
    "issues",
    `commenter:${username}`,
    "total comments"
  );

  // ── Streak: count distinct active months from recent public events ───────────
  await delay(300);
  let contributionStreakMonths = 0;
  try {
    console.log("[GH] estimating contribution streak…");
    const { data: events } = await octokit.request(
      "GET /users/{username}/events/public",
      { username, per_page: 100 }
    );
    const months = new Set<string>();
    for (const ev of events) {
      if (ev.created_at) months.add(ev.created_at.slice(0, 7));
    }
    contributionStreakMonths = months.size;
  } catch (err) {
    console.warn("[GH] streak estimation failed:", (err as Error).message);
    const accountAgeMonths =
      (Date.now() - new Date(accountAgeSince).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    contributionStreakMonths = Math.min(
      Math.round(accountAgeMonths),
      totalCommits > 500 ? 24 : totalCommits > 100 ? 12 : 3
    );
  }

  console.log(`[GH] fetch complete for ${username}`);

  return {
    username,
    avatarUrl: profile.avatar_url,
    name: profile.name ?? username,
    bio: profile.bio ?? "",
    followers: profile.followers,
    publicRepos: profile.public_repos,
    accountAgeSince,

    totalCommits,
    totalPRsMerged,
    totalPRReviews,
    totalIssuesOpened,
    totalIssuesClosed,
    totalDocCommits,
    totalComments,
    firstTimerCommentsCount,
    reposContributedTo,
    contributionStreakMonths,

    karmaScore: 0,
    categoryScores: { builder: 0, reviewer: 0, bugHunter: 0, documentor: 0, mentor: 0 },
    badges: [],
    rank: "Apprentice",
  };
}

// ─── Legacy Phase 1: fetchGitHubData (dashboard compatibility) ────────────────

export async function fetchGitHubData(accessToken: string): Promise<GitHubStats> {
  const octokit = new Octokit({ auth: accessToken });

  // Fetch authenticated user
  const { data: user } = await octokit.rest.users.getAuthenticated();

  // Fetch repos for star count
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "updated",
    type: "owner",
  });

  const starsReceived = repos.reduce(
    (acc, repo) => acc + (repo.stargazers_count ?? 0),
    0
  );

  // Approximate contribution counts via events (public API limit-friendly)
  const { data: events } = await octokit.rest.activity.listEventsForAuthenticatedUser({
    username: user.login,
    per_page: 100,
  });

  let totalPRs = 0;
  let totalPRReviews = 0;
  let totalIssuesClosed = 0;
  let totalCommits = 0;

  for (const event of events) {
    switch (event.type) {
      case "PushEvent":
        if ("payload" in event && event.payload) {
          const payload = event.payload as { commits?: unknown[] };
          totalCommits += payload.commits?.length ?? 0;
        }
        break;
      case "PullRequestEvent":
        totalPRs++;
        break;
      case "PullRequestReviewEvent":
        totalPRReviews++;
        break;
      case "IssuesEvent":
        if ("payload" in event && event.payload) {
          const payload = event.payload as { action?: string };
          if (payload.action === "closed") totalIssuesClosed++;
        }
        break;
    }
  }

  const userData: GitHubUserData = {
    login: user.login,
    name: user.name ?? null,
    avatar_url: user.avatar_url,
    bio: user.bio ?? null,
    public_repos: user.public_repos,
    followers: user.followers,
    following: user.following,
    created_at: user.created_at ?? new Date().toISOString(),
    html_url: user.html_url,
  };

  return {
    user: userData,
    totalCommits,
    totalPRs,
    totalPRReviews,
    totalIssuesClosed,
    totalDiscussions: 0,
    contributedRepos: repos.length,
    starsReceived,
    longestStreak: 0,
    currentStreak: 0,
  };
}
