# ⚡ Karma Commits

> **Your GitHub OSS Reputation Passport** — Beyond commits. Track reviews, mentoring, docs, and bug triage. Get your open-source reputation score AND an AI-powered code review.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Powered%20by-Gemini-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Groq](https://img.shields.io/badge/Powered%20by-Groq-orange)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://karma-commits.vercel.app)

---

## Preview

### Dashboard
![Karma Commits Dashboard](./public/dashboard-preview.png)
*Dashboard featuring Karma Score, reputation radar chart, badges, and shareable passport card*

> **Dashboard Highlights:**
> - **Karma Score (0–1000)** — Your overall reputation score with 5 dimension breakdown
> - **Reputation Radar** — Interactive 5D visualization of your contributions
> - **Achievement Badges** — 18+ earned badges based on your contribution patterns
> - **Karma Passport** — Downloadable PNG card to share your score
> - **Account Stats** — Followers, public repos, member since
> - **AI Review Button** — Quick access to get Gemini+Groq AI code feedback

---

## ✨ Features

| Feature | Description |
|---|---|
| **Karma Score (0–1000)** | Composite score across 5 weighted dimensions |
| **5 Reputation Dimensions** | Code Quality, Collaboration, Mentorship, Documentation, Consistency |
| **6 Karma Tiers** | Seed → Sprout → Contributor → Maintainer → Luminary → Legend |
| **Shareable Passport Card** | Downloadable PNG card with radar chart, tier badge, and earned badges |
| **Dual-Model AI Code Review** | Gemini-powered deep code analysis + Groq-powered personality insights |
| **18+ Achievement Badges** | Earn badges for specific contribution patterns (prolific reviewer, doc guardian, mentor, etc.) |
| **Interactive Radar Chart** | 5D visualization of your reputation dimensions |
| **Live Database Leaderboard** | Supabase-backed leaderboard sorted dynamically by Overall, Reviewer, Builder, Mentor, Bug Hunter, Documentor |
| **10-Minute API Cache** | In-memory cache to protect against GitHub API rate limits |
| **AI Rate Limiting** | Built-in token bucket rate limiter to protect AI endpoints |
| **Loading Screens** | Beautiful animated loading screens after entering a username |
| **Custom GitHub-Dark Theme** | Inspired by GitHub's dark UI with amber accent colors |
| **No Login Required** | Analyze any public GitHub profile without authentication |
| **OG / Twitter Cards** | Auto-generated social sharing cards |

---

## 🚀 Recent Updates

- **Supabase Leaderboard:** Completely replaced the file-based `leaderboard.json` with a live PostgreSQL database hosted on Supabase, supporting dynamic category sorting.
- **Dual-Model AI Review:** AI Code Review now uses **Gemini Flash Lite** (1M token window) as the primary engine for deep code analysis without chunk limits, combined with **Groq** for ultra-fast creative personality insights.
- **Rate Limiting:** Added in-memory token bucket rate limiting for the AI API routes to prevent abuse.
- **Scorecard Popup Modal:** A newly designed modal to view your Passport Card, triggered seamlessly from the dashboard navigation via the "👁️ Passport Card" button.
- **Dynamic Social Sharing:** Share your Karma Score directly to X (Twitter) or LinkedIn using dynamically generated share URLs.

---

## 🎯 User Flow

1. **Home Page** → Enter any GitHub username (no login required)
2. **Loading Screen** → App analyzes public contributions (1–5 seconds)
3. **Dashboard** → See your Karma Score, radar chart, badges, and passport card
4. **AI Review** → Click "✦ AI Review" to get Gemini+Groq feedback on your code
5. **Share** → Download passport or share on social media

---

## 📊 Karma Score System

### 5 Dimensions (0–100 each)

| Dimension | Color | Signals | Weight |
|---|---|---|---|
| 🔨 **Code Quality** | Amber | PRs merged, stars, repos contributed | 25% |
| 👥 **Collaboration** | Emerald | PR reviews, issues closed, discussions | 25% |
| 🎓 **Mentorship** | Sky | Reviews given, issue guidance, followers | 20% |
| 📖 **Documentation** | Violet | Discussions, READMEs, docs commits | 15% |
| 📈 **Consistency** | Rose | Contribution streaks, commit frequency | 15% |

**Final Score = (Code Quality × 0.25 + Collaboration × 0.25 + Mentorship × 0.2 + Documentation × 0.15 + Consistency × 0.15) × 10**

### 6 Tiers

| Tier | Score Range | Label |
|---|---|---|
| 🌱 Seed | 0–99 | Apprentice |
| 🌿 Sprout | 100–249 | Apprentice |
| 🪴 Contributor | 250–449 | Contributor |
| ⚙️ Maintainer | 450–649 | Maintainer |
| ⚡ Luminary | 650–799 | Veteran |
| 👑 Legend | 800–1000 | Legend |

### 5 Category Scores (for Leaderboard Filtering)

- 🔨 **Builder** — Raw code output (commits + merged PRs)
- 👁️ **Reviewer** — Review quality & frequency
- 🐛 **Bug Hunter** — Issues opened + closed
- 📖 **Documentor** — Documentation commits
- 🎓 **Mentor** — Mentoring & first-timer help

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org) (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 + custom GitHub-dark tokens |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL) |
| **GitHub API** | [@octokit/rest](https://github.com/octokit/rest.js) |
| **AI (Analysis)**| [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini SDK) |
| **AI (Insights)**| [Groq SDK](https://groq.com) for ultra-fast personality LLM inference |
| **Charts** | [Recharts](https://recharts.org) (Radar chart) |
| **Animations** | [Framer Motion](https://www.framer.com/motion) |
| **Export** | [html-to-image](https://github.com/bubkoo/html-to-image) (PNG download) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 📁 Project Structure

```text
karma-commits/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page with hero & CTA
│   ├── globals.css                   # Global styles & Tailwind base
│   ├── error.tsx & global-error.tsx  # Error boundaries
│   │
│   ├── dashboard/
│   │   └── page.tsx                  # Karma Score dashboard with radar, badges, passport
│   │
│   ├── leaderboard/
│   │   └── page.tsx                  # Community leaderboard (filterable, sortable)
│   │
│   ├── ai-review/
│   │   └── page.tsx                  # AI code review results (Gemini+Groq-powered)
│   │
│   └── api/
│       ├── github/
│       │   └── route.ts              # GET /api/github?username=...
│       │
│       ├── ai-review/
│       │   └── route.ts              # GET /api/ai-review?username=...
│       │
│       └── leaderboard/
│           └── route.ts              # GET + POST /api/leaderboard (Supabase queries)
│
├── components/                       # Reusable UI components
│   ├── PassportCard.tsx              # Downloadable karma passport (PNG export)
│   ├── KarmaScore.tsx                # Score display with dimensions
│   ├── RadarChart.tsx                # 5D radar visualization
│   ├── BadgeShelf.tsx                # Badge grid (earned & locked)
│   ├── LeaderboardTable.tsx          # Leaderboard rows
│   ├── AIReviewError.tsx             # AI review error states
│   ├── LoadingScreen.tsx             # Full-screen loading overlay
│   ├── DashboardSkeleton.tsx         # Dashboard loading skeleton
│   ├── LeaderboardSkeleton.tsx       # Leaderboard loading skeleton
│   ├── ErrorBoundary.tsx             # Error boundary wrapper
│   └── ui/
│       ├── CustomCursor.tsx          # Ambient cursor effect
│       └── ...
│
├── lib/                              # Core business logic
│   ├── karmaEngine.ts                # Score calculation & badges
│   ├── githubFetcher.ts              # GitHub data fetching (Octokit)
│   ├── aiReviewer.ts                 # Dual-model AI review logic (Gemini + Groq)
│   ├── leaderboard.ts                # Supabase database helpers & CRUD
│   ├── rateLimiter.ts                # In-memory token bucket rate limiting
│   └── types.ts                      # TypeScript types & interfaces
│
├── .env.local                        # Environment variables (GitHub, Groq, Gemini, Supabase)
├── next.config.mjs                   # Next.js config
├── tailwind.config.ts                # Tailwind design tokens
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A GitHub account
- A free Supabase Project
- Google Gemini API Key
- Groq API Key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/karma-commits.git
cd karma-commits
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a GitHub Personal Access Token

1. Go to **github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Set expiration to 90 days
4. Select scopes: `public_repo` and `read:user`
5. Click **"Generate token"** and copy it

### 4. Create a Supabase Database Table

In your Supabase project's SQL Editor, run the following to set up the Leaderboard table:

```sql
CREATE TABLE leaderboard (
  username          TEXT PRIMARY KEY,
  name              TEXT DEFAULT '',
  avatar_url        TEXT DEFAULT '',
  karma_score       INTEGER DEFAULT 0,
  score_builder     INTEGER DEFAULT 0,
  score_reviewer    INTEGER DEFAULT 0,
  score_bug_hunter  INTEGER DEFAULT 0,
  score_documentor  INTEGER DEFAULT 0,
  score_mentor      INTEGER DEFAULT 0,
  rank              TEXT DEFAULT 'Apprentice',
  badges            JSONB DEFAULT '[]',
  last_updated      TIMESTAMPTZ DEFAULT NOW()
);

-- Recommended: Create indexes for fast sorting
CREATE INDEX idx_leaderboard_karma      ON leaderboard (karma_score DESC);
CREATE INDEX idx_leaderboard_reviewer   ON leaderboard (score_reviewer DESC);
CREATE INDEX idx_leaderboard_builder    ON leaderboard (score_builder DESC);
CREATE INDEX idx_leaderboard_mentor     ON leaderboard (score_mentor DESC);
CREATE INDEX idx_leaderboard_bug_hunter ON leaderboard (score_bug_hunter DESC);
CREATE INDEX idx_leaderboard_documentor ON leaderboard (score_documentor DESC);
```

### 5. Set up environment variables

Create a `.env.local` file in the project root:

```env
# GitHub API Token (for fetching user data)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AI Review Models
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (Leaderboard Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** You can get a free Groq API key at [console.groq.com](https://console.groq.com), Gemini API key at [aistudio.google.com](https://aistudio.google.com/), and Supabase database at [supabase.com](https://supabase.com/).

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 How to Use

### View Your Karma Score

1. On the home page, enter your GitHub username
2. Click **"Analyze"**
3. Wait for the loading screen (1–5 seconds)
4. See your Karma Score, radar chart, badges, and passport card on the dashboard

### Get an AI Code Review

1. On the dashboard, click **"✦ AI Review"** in the top navigation
2. The app analyzes your top repositories using the dual Gemini+Groq AI engine.
3. Get instant feedback on:
   - Overall code quality score
   - Your developer personality (Pragmatist, Perfectionist, Architect, etc.)
   - Key strengths in your code
   - Actionable improvements
   - Shareable report card

### Check the Leaderboard

Click **"Leaderboard"** to see the top open-source contributors dynamically ranked by:
- Overall Karma Score
- Reviewer (code review focus)
- Builder (code output)
- Mentor (mentoring others)
- Bug Hunter (issue triage)
- Documentor (documentation)

---

## 📡 API Routes

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/github?username=...` | GET | Fetch & score a user's GitHub stats (10-min cache). Automatically upserts DB. |
| `GET /api/ai-review?username=...` | GET | Get Gemini+Groq AI code review feedback. Rate limited. |
| `GET /api/leaderboard?sort=...` | GET | Get leaderboard from Supabase sorted by score type |
| `POST /api/leaderboard` | POST | Upsert a user's leaderboard entry |

---

## 📦 Build & Deploy

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Deploy to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. Add environment variables:
   - `GITHUB_TOKEN`
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

---

## 🎨 Design System

Custom **GitHub-dark** color palette (defined in `tailwind.config.ts`):

| Token | Hex | Usage |
|---|---|---|
| `gh-bg` | `#0d1117` | Page background |
| `gh-surface` | `#161b22` | Cards & panels |
| `gh-border` | `#30363d` | Borders |
| `gh-muted` | `#8b949e` | Secondary text |
| `gh-text` | `#e6edf3` | Primary text |
| `amber` | `#f0a500` | Brand accent (scores, CTAs) |
| `emerald` | `#10b981` | Collaboration |
| `sky` | `#38bdf8` | Mentorship |
| `violet` | `#a78bfa` | Documentation |
| `rose` | `#f43f5e` | Consistency |

---

## 🐛 Troubleshooting

### `Server configuration error` on dashboard

**Cause:** `GITHUB_TOKEN` is not set in `.env.local`

**Fix:** Add your GitHub PAT to `.env.local` and restart the dev server

### `404 (Not Found)` errors

Make sure your GitHub token has the correct scopes: `public_repo` and `read:user`

### AI Review takes too long

The AI review analyzes your top repositories using Gemini's large context window, which can take 10–15 seconds. This is normal.

### Leaderboard not updating

Ensure your Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are correct, and verify you ran the `CREATE TABLE` SQL command in the Supabase dashboard.

---

## 📝 License

[MIT](LICENSE)

---

## 🙏 Contributing

Contributions are welcome! Feel free to:

- Report bugs via GitHub issues
- Submit pull requests for improvements
- Suggest new features or badges
- Improve documentation

---

**Built with ❤️ for the open source community**
