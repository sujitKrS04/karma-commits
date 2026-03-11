# ⚡ Karma Commits

> **Your GitHub OSS Reputation Passport** — Beyond commits. Track reviews, mentoring, docs, and bug triage. Get your open-source reputation score.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://karma-commits.vercel.app)

---

## Preview

> **Tip:** Add a real screenshot at `public/preview.png` and update the path below.

![Karma Commits Preview](public/og-preview.png)

_Dashboard showing Passport Card, Radar Chart, Category Scores, and Badge Shelf._

---

## What is Karma Commits?

Karma Commits analyzes your entire GitHub public activity and condenses it into a shareable **Karma Score** (0–1000) across **5 reputation dimensions**. Unlike GitHub's contribution graph — which only counts commits — Karma Commits rewards the things that actually make open source work: code reviews, mentorship, documentation, bug triage, and long-term consistency.

Sign in with GitHub OAuth → get your score in under a minute → download your Passport Card as a PNG and share it anywhere.

---

## Features

| Feature | Description |
|---|---|
| **GitHub OAuth Sign-In** | Requests only `read:user`, `public_repo`, `read:org` — nothing private, ever |
| **Karma Score (0–1000)** | Composite score across 5 weighted dimensions |
| **Karma Passport Card** | Downloadable PNG card with radar chart, tier badge, and earned badges |
| **Radar Chart** | Interactive Recharts radar visualization of all 5 dimensions |
| **Badge System** | 18+ badges awarded for specific contribution patterns |
| **Karma Tiers** | Six tiers from Seed → Legend based on your total score |
| **Community Leaderboard** | Filterable/sortable leaderboard by Overall, Reviewer, Builder, Mentor, Bug Hunter, Documentor |
| **10-Minute API Cache** | In-memory server-side cache to protect against GitHub rate limits |
| **Rate Limit Handling** | Live countdown UI when GitHub API rate limits are hit |
| **Custom Cursor** | Subtle amber cursor accent matching the dark GitHub-inspired theme |
| **OG / Twitter Cards** | Auto-generated Open Graph metadata for social sharing |
| **Animated Landing Page** | Framer Motion scroll-triggered counters, feature cards, and how-it-works steps |

---

## Karma Score System

### Dimensions

Each dimension is scored **0–100** using weighted GitHub signals, then combined into a total out of **1000**.

| Dimension | Color | Key Signals | Weight |
|---|---|---|---|
| **Code Quality** | `#f0a500` (amber) | PRs merged, stars received, repos contributed | 25% |
| **Collaboration** | `#10b981` (emerald) | PR reviews given, issues closed, discussions | 25% |
| **Mentorship** | `#38bdf8` (sky) | Reviewing others' PRs, guiding issues, follower reach | 20% |
| **Documentation** | `#a78bfa` (violet) | Discussions started, profile completeness, repo contributions | 15% |
| **Consistency** | `#f43f5e` (rose) | Contribution streaks, commit frequency, long-term activity | 15% |

### Tiers

| Tier | Min Score | Display Label |
|---|---|---|
| 🌱 **Seed** | 0 | Apprentice |
| 🌿 **Sprout** | 100 | Apprentice |
| 🌱 **Contributor** | 250 | Contributor |
| ⚙️ **Maintainer** | 450 | Maintainer |
| ⚡ **Luminary** | 650 | Veteran |
| 👑 **Legend** | 800 | Legend |

### Category Scores (Dashboard)

In addition to the 5 dimensions, the dashboard shows **5 category breakdowns** used for leaderboard filtering:

- 🔨 **Builder** — Total commits + PRs merged (raw output)
- 👁️ **Reviewer** — PR reviews given, review-to-commit ratio
- 🐛 **Bug Hunter** — Issues opened and closed, triage activity
- 📖 **Documentor** — Commits touching `README`, `docs/`, and `.md` files
- 🎓 **Mentor** — Good-first-issue comments, cross-repo diversity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 with custom GitHub-dark design tokens |
| Auth | [NextAuth.js v4](https://next-auth.js.org) — GitHub OAuth |
| GitHub API | [@octokit/rest](https://github.com/octokit/rest.js) |
| Charts | [Recharts](https://recharts.org) (Radar chart) |
| Animations | [Framer Motion](https://www.framer.com/motion) |
| Export | [html-to-image](https://github.com/bubkoo/html-to-image) (PNG download) |
| Icons | [Lucide React](https://lucide.dev) |
| Deployment | [Vercel](https://vercel.com) |

---

## File Structure

```
karma-commits/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — metadata, SessionProvider, CustomCursor
│   ├── page.tsx                      # Landing page (animated hero, how-it-works, features)
│   ├── globals.css                   # Global styles & Tailwind base
│   ├── error.tsx                     # App-level error boundary
│   ├── global-error.tsx              # Global error boundary (RSC-compatible)
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard — PassportCard, radar chart, badges, categories
│   ├── leaderboard/
│   │   └── page.tsx                  # Community leaderboard with filter tabs & sort
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts          # NextAuth.js catch-all handler
│       ├── github/
│       │   └── route.ts              # GET /api/github — fetch & score GitHub stats (10-min cache)
│       └── leaderboard/
│           └── route.ts              # GET + POST /api/leaderboard
│
├── components/                       # Reusable UI components
│   ├── PassportCard.tsx              # Downloadable karma passport (PNG export via html-to-image)
│   ├── KarmaScore.tsx                # Score panel with animated dimension progress bars
│   ├── RadarChart.tsx                # Recharts radar chart wrapper
│   ├── BadgeShelf.tsx                # Earned / locked badge grid
│   ├── LeaderboardTable.tsx          # Leaderboard rows with rank medals & category dots
│   ├── DashboardSkeleton.tsx         # Loading skeleton for the dashboard page
│   ├── LeaderboardSkeleton.tsx       # Loading skeleton for the leaderboard page
│   ├── LoadingScreen.tsx             # Full-screen loading overlay
│   ├── ErrorBoundary.tsx             # Client-side error boundary wrapper
│   └── ui/
│       ├── SessionProvider.tsx       # NextAuth SessionProvider (client-side wrapper)
│       └── CustomCursor.tsx          # Ambient amber dot custom cursor
│
├── lib/                              # Core business logic (server-safe)
│   ├── karmaEngine.ts                # Score calculation, badge assignment, tier logic
│   ├── githubFetcher.ts              # Octokit-based GitHub data fetcher
│   ├── leaderboard.ts                # fs-based leaderboard.json reader / writer / upsert
│   ├── authOptions.ts                # NextAuth config (GitHub provider, JWT/session callbacks)
│   └── types.ts                      # All shared TypeScript interfaces and type aliases
│
├── data/
│   └── leaderboard.json              # Persistent JSON leaderboard store
│
├── public/                           # Static assets
│   └── og-preview.png                # Open Graph preview image (1200×630)
│
├── .env.local                        # Local environment variables (not committed)
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # Tailwind config with GitHub-dark design tokens
├── tsconfig.json                     # TypeScript configuration
├── postcss.config.mjs                # PostCSS configuration
├── vercel.json                       # Vercel build configuration
└── package.json                      # Dependencies and npm scripts
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/karma-commits.git
cd karma-commits
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client Secret**

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# NextAuth
NEXTAUTH_SECRET=any_random_32_char_string
NEXTAUTH_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## API Routes

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET / POST | — | NextAuth.js GitHub OAuth flow |
| `/api/github` | GET | ✅ | Fetch & score a user's GitHub stats. `?username=octocat` optional — defaults to signed-in user. Responses cached 10 min. |
| `/api/leaderboard` | GET | — | Return leaderboard sorted by `?sort=karmaScore\|reviewer\|mentor\|builder\|bugHunter\|documentor` |
| `/api/leaderboard` | POST | — | Upsert a user's leaderboard entry (called automatically after scoring) |

---

## Deployment

The app is deployed on **Vercel**. To deploy your own instance:

1. Push the repo to GitHub
2. Import it on [vercel.com/new](https://vercel.com/new)
3. Add the following environment variables in the Vercel project settings:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` ← set to your production URL, e.g. `https://karma-commits.vercel.app`
4. Update your GitHub OAuth App's **Authorization callback URL** to `https://your-domain.vercel.app/api/auth/callback/github`

> **Note on the leaderboard:** The leaderboard uses a file-based `data/leaderboard.json` store. On Vercel's serverless infrastructure, writes are ephemeral and will not persist across deployments. For production persistence, replace `lib/leaderboard.ts` with a database adapter (e.g. Vercel KV, PlanetScale, or Supabase).

---

## Design System

The UI uses a custom **GitHub-dark** color palette defined in `tailwind.config.ts`:

| Token | Hex | Usage |
|---|---|---|
| `gh-bg` | `#0d1117` | Page background |
| `gh-surface` | `#161b22` | Card / panel surface |
| `gh-border` | `#30363d` | Borders & dividers |
| `gh-muted` | `#8b949e` | Secondary / placeholder text |
| `gh-text` | `#e6edf3` | Primary text |
| `amber` | `#f0a500` | Brand accent — scores, CTAs, tier highlights |
| `emerald` | `#10b981` | Collaboration dimension |

---

## License

MIT
