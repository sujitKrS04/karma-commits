// ─── Core Dimension Types ──────────────────────────────────────────────────────

export type KarmaDimension =
  | "code_quality"
  | "collaboration"
  | "mentorship"
  | "documentation"
  | "consistency";

export interface DimensionScore {
  dimension: KarmaDimension;
  label: string;
  score: number; // 0–100
  color: string;
  description: string;
}

export interface KarmaScore {
  total: number; // composite 0–1000
  dimensions: DimensionScore[];
  tier: KarmaTier;
  percentile: number;
}

export type KarmaTier =
  | "Seed"
  | "Sprout"
  | "Contributor"
  | "Maintainer"
  | "Luminary"
  | "Legend";

// ─── Badge Types ──────────────────────────────────────────────────────────────

export type BadgeId =
  | "prolific_reviewer"
  | "doc_guardian"
  | "issue_closer"
  | "first_responder"
  | "bug_hunter"
  | "community_builder"
  | "open_source_veteran"
  | "mentor"
  | "polyglot"
  | "night_owl"
  // Phase 2 badge ids
  | "eagle_eye"
  | "lore_keeper"
  | "seed_planter"
  | "commit_storm"
  | "globetrotter"
  | "bug_slayer"
  | "legend"
  | "team_player";

export interface Badge {
  id: string;           // BadgeId or any string
  name: string;         // primary display name (Phase 2)
  label?: string;       // legacy alias used by BadgeShelf
  description: string;
  icon: string;
  color?: string;       // optional tint colour for existing components
  earned: boolean;
  earnedAt?: string;
}

// ─── Phase 2 Types ────────────────────────────────────────────────────────────

export interface CategoryScores {
  builder: number;      // 0-100
  reviewer: number;     // 0-100
  bugHunter: number;    // 0-100
  documentor: number;   // 0-100
  mentor: number;       // 0-100
}

export interface ContributionData {
  username: string;
  avatarUrl: string;
  name: string;
  bio: string;
  followers: number;
  publicRepos: number;
  accountAgeSince: string;

  // Raw counts
  totalCommits: number;
  totalPRsMerged: number;
  totalPRReviews: number;
  totalIssuesOpened: number;
  totalIssuesClosed: number;
  totalDocCommits: number;          // commits touching README / docs/ / .md
  totalComments: number;
  firstTimerCommentsCount: number;  // comments on good-first-issue threads
  reposContributedTo: number;
  contributionStreakMonths: number;

  // Calculated
  karmaScore: number;               // 0-1000
  categoryScores: CategoryScores;
  badges: Badge[];
  rank: string;                     // "Apprentice" | "Contributor" | "Veteran" | "Legend"
}

// ─── GitHub Raw Data ──────────────────────────────────────────────────────────

export interface GitHubUserData {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

export interface GitHubStats {
  user: GitHubUserData;
  totalCommits: number;
  totalPRs: number;
  totalPRReviews: number;
  totalIssuesClosed: number;
  totalDiscussions: number;
  contributedRepos: number;
  starsReceived: number;
  longestStreak: number;
  currentStreak: number;
}

// ─── Passport / Profile ───────────────────────────────────────────────────────

export interface KarmaPassport {
  user: GitHubUserData;
  score: KarmaScore;
  badges: Badge[];
  stats: GitHubStats;
  generatedAt: string;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user: GitHubUserData;
  score: KarmaScore;
  badges: Badge[];
  isCurrentUser?: boolean;
}

/** Flat storage format used by /data/leaderboard.json and the leaderboard API */
export interface LeaderboardUser {
  username: string;
  name: string;
  avatarUrl: string;
  karmaScore: number;
  categoryScores: {
    builder: number;
    reviewer: number;
    bugHunter: number;
    documentor: number;
    mentor: number;
  };
  rank: "Apprentice" | "Contributor" | "Veteran" | "Legend";
  badges: Array<{ id: string; name: string; icon: string; earned: boolean }>;
  updatedAt: string;
}

// ─── AI Review Types (Phase 7) ────────────────────────────────────────────────

export interface AIReviewDimension {
  id: string
  name: string
  score: number
  grade: string
  summary: string
  strengths: string[]
  improvements: string[]
}

export interface AIReview {
  overallScore: number
  overallVerdict: string
  developerPersonality: 'Pragmatist' | 'Perfectionist' | 'Experimenter' | 'Architect' | 'Hacker'
  developerPersonalityReason: string
  dimensions: AIReviewDimension[]
  topStrengths: string[]
  topImprovements: string[]
  repoHighlights: Array<{ repoName: string; standoutObservation: string }>
  careerInsight: string
}

export interface CodePayload {
  username: string
  totalReposAnalyzed: number
  repos: Array<{
    name: string
    description: string
    stars: number
    language: string
    url: string
    files: Array<{ path: string; content: string; language: string }>
    readme: string
  }>
}

// ─── NextAuth Session Extension ───────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    login?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    login?: string;
  }
}
