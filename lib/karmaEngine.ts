import type {
  Badge,
  BadgeId,
  CategoryScores,
  ContributionData,
  DimensionScore,
  GitHubStats,
  GitHubUserData,
  KarmaPassport,
  KarmaScore,
  KarmaTier,
} from "./types";

// ─── Tier Thresholds ──────────────────────────────────────────────────────────

const TIERS: { min: number; tier: KarmaTier }[] = [
  { min: 800, tier: "Legend" },
  { min: 650, tier: "Luminary" },
  { min: 450, tier: "Maintainer" },
  { min: 250, tier: "Contributor" },
  { min: 100, tier: "Sprout" },
  { min: 0, tier: "Seed" },
];

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val));
}

// ─── Score Calculation ────────────────────────────────────────────────────────

export function calculateKarmaScore(stats: GitHubStats): KarmaScore {
  // Each dimension is scored 0–100 using weighted signals

  const codeQuality = clamp(
    stats.totalPRs * 2 +
    stats.starsReceived * 0.5 +
    stats.contributedRepos * 1.5
  );

  const collaboration = clamp(
    stats.totalPRReviews * 3 +
    stats.totalIssuesClosed * 2 +
    stats.totalDiscussions * 2
  );

  const mentorship = clamp(
    stats.totalPRReviews * 2 +
    stats.totalIssuesClosed * 1 +
    (stats.user.followers > 50 ? 20 : stats.user.followers * 0.4)
  );

  const documentation = clamp(
    stats.totalDiscussions * 3 +
    stats.contributedRepos * 1.2 +
    (stats.user.bio ? 10 : 0)
  );

  const consistency = clamp(
    stats.currentStreak * 2 +
    stats.longestStreak * 1.5 +
    stats.totalCommits * 0.8
  );

  const dimensions: DimensionScore[] = [
    {
      dimension: "code_quality",
      label: "Code Quality",
      score: Math.round(codeQuality),
      color: "#f0a500",
      description: "PRs merged, stars received, repos contributed to",
    },
    {
      dimension: "collaboration",
      label: "Collaboration",
      score: Math.round(collaboration),
      color: "#10b981",
      description: "PR reviews, issues closed, discussions participated",
    },
    {
      dimension: "mentorship",
      label: "Mentorship",
      score: Math.round(mentorship),
      color: "#38bdf8",
      description: "Reviewing others' work, guiding issues, follower reach",
    },
    {
      dimension: "documentation",
      label: "Documentation",
      score: Math.round(documentation),
      color: "#a78bfa",
      description: "Discussions started, wikis, READMEs, profile completeness",
    },
    {
      dimension: "consistency",
      label: "Consistency",
      score: Math.round(consistency),
      color: "#f43f5e",
      description: "Contribution streaks, commit frequency, long-term activity",
    },
  ];

  const total = Math.round(
    (codeQuality * 0.25 +
      collaboration * 0.25 +
      mentorship * 0.2 +
      documentation * 0.15 +
      consistency * 0.15) *
    10
  );

  const tier = TIERS.find((t) => total >= t.min)?.tier ?? "Seed";

  return {
    total,
    dimensions,
    tier,
    percentile: Math.round((total / 1000) * 100),
  };
}

// ─── Badge Definitions (legacy Phase 1 badges used by buildPassport) ─────────

const BADGE_DEFS: Record<
  string,
  { label: string; description: string; icon: string; color: string; check: (s: GitHubStats) => boolean }
> = {
  prolific_reviewer: {
    label: "Prolific Reviewer",
    description: "Reviewed 50+ pull requests",
    icon: "👁️",
    color: "#10b981",
    check: (s) => s.totalPRReviews >= 50,
  },
  doc_guardian: {
    label: "Doc Guardian",
    description: "Active contributor to documentation",
    icon: "📖",
    color: "#f0a500",
    check: (s) => s.totalDiscussions >= 20,
  },
  issue_closer: {
    label: "Issue Closer",
    description: "Closed 100+ issues",
    icon: "✅",
    color: "#10b981",
    check: (s) => s.totalIssuesClosed >= 100,
  },
  first_responder: {
    label: "First Responder",
    description: "Quick to respond on issues and PRs",
    icon: "⚡",
    color: "#f0a500",
    check: (s) => s.totalIssuesClosed >= 25 && s.totalPRReviews >= 10,
  },
  bug_hunter: {
    label: "Bug Hunter",
    description: "Filed and resolved critical issues",
    icon: "🐛",
    color: "#f43f5e",
    check: (s) => s.totalIssuesClosed >= 50,
  },
  community_builder: {
    label: "Community Builder",
    description: "High engagement with the community",
    icon: "🌐",
    color: "#10b981",
    check: (s) => s.user.followers >= 100,
  },
  open_source_veteran: {
    label: "OSS Veteran",
    description: "3+ years of open source contributions",
    icon: "🏆",
    color: "#f0a500",
    check: (s) => {
      const years =
        (Date.now() - new Date(s.user.created_at).getTime()) /
        (1000 * 60 * 60 * 24 * 365);
      return years >= 3;
    },
  },
  mentor: {
    label: "Mentor",
    description: "Leads by teaching and guidance",
    icon: "🎓",
    color: "#38bdf8",
    check: (s) => s.totalPRReviews >= 100 && s.user.followers >= 50,
  },
  polyglot: {
    label: "Polyglot",
    description: "Contributes across many repositories",
    icon: "🔤",
    color: "#a78bfa",
    check: (s) => s.contributedRepos >= 20,
  },
  night_owl: {
    label: "Night Owl",
    description: "Commits at all hours of the day",
    icon: "🦉",
    color: "#8b949e",
    check: () => false, // Requires granular commit time data
  },
};

export function calculateBadges(stats: GitHubStats): Badge[] {
  return Object.entries(BADGE_DEFS).map(([id, def]) => ({
      id,
      name: def.label,       // satisfy required name field
      label: def.label,
      description: def.description,
      icon: def.icon,
      color: def.color,
      earned: def.check(stats),
    })
  );
}

// ─── Passport Builder ─────────────────────────────────────────────────────────

export function buildPassport(stats: GitHubStats): KarmaPassport {
  return {
    user: stats.user,
    score: calculateKarmaScore(stats),
    badges: calculateBadges(stats),
    stats,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Phase 1 → Phase 2 bridge: convert ContributionData to KarmaPassport ────

export function buildPassportFromContribution(data: ContributionData): KarmaPassport {
  const { karmaScore, categoryScores, badges, rank, accountAgeSince } = data;

  // Map rank → legacy tier
  const tierMap: Record<string, KarmaTier> = {
    Legend: "Legend",
    Veteran: "Luminary",
    Contributor: "Contributor",
    Apprentice: "Sprout",
  };
  const tier: KarmaTier = tierMap[rank] ?? "Seed";

  const dimensions: DimensionScore[] = [
    { dimension: "code_quality",  label: "Builder",     score: Math.round(categoryScores.builder),   color: "#10b981", description: "Commits and pull requests merged" },
    { dimension: "collaboration", label: "Reviewer",    score: Math.round(categoryScores.reviewer),  color: "#f0a500", description: "PR reviews and comment activity" },
    { dimension: "consistency",   label: "Bug Hunter",  score: Math.round(categoryScores.bugHunter), color: "#f43f5e", description: "Issues opened and closed" },
    { dimension: "documentation", label: "Documentor",  score: Math.round(categoryScores.documentor),color: "#06b6d4", description: "Commits touching docs and READMEs" },
    { dimension: "mentorship",    label: "Mentor",      score: Math.round(categoryScores.mentor),    color: "#fb923c", description: "Good-first-issue engagement and diversity" },
  ];

  const score: KarmaScore = {
    total: karmaScore,
    dimensions,
    tier,
    percentile: Math.round(karmaScore / 10),
  };

  const user: GitHubUserData = {
    login:       data.username,
    name:        data.name ?? null,
    avatar_url:  data.avatarUrl,
    bio:         data.bio ?? null,
    public_repos: data.publicRepos,
    followers:   data.followers,
    following:   0,
    created_at:  accountAgeSince,
    html_url:    `https://github.com/${data.username}`,
  };

  // Convert Phase 2 badges so label is always set (PassportCard uses b.label)
  const legacyBadges: Badge[] = badges.map((b) => ({ ...b, label: b.name ?? b.label ?? b.id }));

  return {
    user,
    score,
    badges: legacyBadges,
    stats: {
      user,
      totalCommits: data.totalCommits,
      totalPRs: data.totalPRsMerged,
      totalPRReviews: data.totalPRReviews,
      totalIssuesClosed: data.totalIssuesClosed,
      totalDiscussions: data.totalComments,
      contributedRepos: data.reposContributedTo,
      starsReceived: 0,
      longestStreak: data.contributionStreakMonths,
      currentStreak: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ─── Phase 2: calculateKarma ──────────────────────────────────────────────────

function clampScore(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val)));
}

/** Map a raw count onto a 0-100 curve using breakpoints [[count, score], …] */
function breakpointScale(value: number, points: [number, number][]): number {
  for (let i = points.length - 1; i >= 0; i--) {
    if (value >= points[i][0]) {
      if (i === points.length - 1) return points[i][1];
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const t = (value - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return 0;
}

export function calculateKarma(data: ContributionData): ContributionData {
  // ── Builder score ──────────────────────────────────────────────────────────
  const commitScore = clampScore(
    breakpointScale(data.totalCommits, [[0, 0], [100, 50], [500, 100]])
  );
  const prScore = clampScore(
    breakpointScale(data.totalPRsMerged, [[0, 0], [10, 50], [50, 80], [100, 100]])
  );
  const builder = clampScore(commitScore * 0.5 + prScore * 0.5);

  // ── Reviewer score ─────────────────────────────────────────────────────────
  const reviewScore = clampScore(
    breakpointScale(data.totalPRReviews, [[0, 0], [20, 40], [50, 70], [100, 100]])
  );
  const commentRatio = data.totalComments / (data.totalCommits + 1);
  const commentRatioScore = clampScore(
    breakpointScale(commentRatio, [[0, 0], [0.5, 30], [1, 60], [2, 80], [3, 100]])
  );
  const reviewer = clampScore(reviewScore * 0.7 + commentRatioScore * 0.3);

  // ── Bug hunter score ───────────────────────────────────────────────────────
  const issueOpenedScore = clampScore(
    breakpointScale(data.totalIssuesOpened, [[0, 0], [10, 30], [50, 70], [100, 100]])
  );
  const issueClosedScore = clampScore(
    breakpointScale(data.totalIssuesClosed, [[0, 0], [10, 30], [50, 70], [100, 100]])
  );
  const bugHunter = clampScore(issueOpenedScore * 0.4 + issueClosedScore * 0.6);

  // ── Documentor score ───────────────────────────────────────────────────────
  const documentor = clampScore(
    breakpointScale(data.totalDocCommits, [[0, 0], [5, 30], [20, 70], [50, 100]])
  );

  // ── Mentor score ───────────────────────────────────────────────────────────
  const firstTimerScore = clampScore(
    breakpointScale(data.firstTimerCommentsCount, [[0, 0], [5, 40], [15, 70], [30, 100]])
  );
  const diversityBonus = data.reposContributedTo > 10 ? 20 : 0;
  const mentor = clampScore(firstTimerScore + diversityBonus);

  const categoryScores: CategoryScores = { builder, reviewer, bugHunter, documentor, mentor };

  // ── Base score (0-100) → multiply by 10 ────────────────────────────────────
  const base =
    builder * 0.2 +
    reviewer * 0.3 +
    bugHunter * 0.15 +
    documentor * 0.15 +
    mentor * 0.2;

  // ── Bonuses ────────────────────────────────────────────────────────────────
  const streakBonus = data.contributionStreakMonths > 6 ? 50 : 0;
  const repoDiversityBonus = data.reposContributedTo > 5 ? 50 : 0;

  const karmaScore = Math.min(1000, Math.round(base * 10 + streakBonus + repoDiversityBonus));

  // ── Rank ───────────────────────────────────────────────────────────────────
  const rank =
    karmaScore > 750 ? "Legend" :
    karmaScore > 500 ? "Veteran" :
    karmaScore > 300 ? "Contributor" :
    "Apprentice";

  // ── Phase 2 badges ─────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const makeBadge = (
    id: string,
    name: string,
    description: string,
    icon: string,
    color: string,
    earned: boolean
  ): Badge => ({ id, name, label: name, description, icon, color, earned, ...(earned ? { earnedAt: now } : {}) });

  const badges: Badge[] = [
    makeBadge("eagle_eye",    "Eagle Eye",    "Reviewed a significant number of pull requests",    "🦅", "#10b981", reviewer > 70),
    makeBadge("lore_keeper",  "Lore Keeper",  "Extensive documentation contributor",               "🧙", "#f0a500", documentor > 60),
    makeBadge("seed_planter", "Seed Planter", "Guides beginners through good-first-issues",        "🌱", "#10b981", mentor > 60 || data.firstTimerCommentsCount > 10),
    makeBadge("commit_storm", "Commit Storm", "Over 500 commits pushed",                           "⚡", "#f0a500", data.totalCommits > 500),
    makeBadge("globetrotter", "Globetrotter", "Contributed to more than 10 different repos",       "🌍", "#10b981", data.reposContributedTo > 10),
    makeBadge("bug_slayer",   "Bug Slayer",   "Expert at finding and resolving bugs",              "🔥", "#f43f5e", bugHunter > 70),
    makeBadge("legend",       "Legend",       "Achieved a Karma Score above 800",                  "👑", "#f0a500", karmaScore > 800),
    makeBadge("team_player",  "Team Player",  "Outstanding reviewer and mentor combined",          "🤝", "#10b981", reviewer > 60 && mentor > 60),
  ];

  return {
    ...data,
    karmaScore,
    categoryScores,
    badges,
    rank,
  };
}
