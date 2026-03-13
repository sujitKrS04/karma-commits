"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Github, ArrowRight, GitPullRequest, Users, FileText, Cpu, Share2 } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="font-mono text-3xl font-bold text-amber">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Dimension Dots ──────────────────────────────────────────────────────────

const dimensions = [
  { label: "Code Quality", color: "#f0a500" },
  { label: "Collaboration", color: "#10b981" },
  { label: "Mentorship", color: "#38bdf8" },
  { label: "Documentation", color: "#a78bfa" },
  { label: "Consistency", color: "#f43f5e" },
];

// ─── How It Works Cards ───────────────────────────────────────────────────────

const howItWorksCards = [
  {
    icon: <Github size={28} className="text-amber" />,
    title: "Connect",
    step: "01",
    content: (
      <p className="text-gh-muted text-sm leading-relaxed font-sans">
        Sign in with GitHub OAuth. We request{" "}
        <span className="text-gh-text font-mono text-xs bg-gh-bg px-1 py-0.5 border border-gh-border">
          read:user
        </span>
        ,{" "}
        <span className="text-gh-text font-mono text-xs bg-gh-bg px-1 py-0.5 border border-gh-border">
          public_repo
        </span>
        , and{" "}
        <span className="text-gh-text font-mono text-xs bg-gh-bg px-1 py-0.5 border border-gh-border">
          read:org
        </span>{" "}
        scopes — nothing private, ever.
      </p>
    ),
  },
  {
    icon: <Cpu size={28} className="text-emerald" />,
    title: "Analyze",
    step: "02",
    content: (
      <div className="space-y-2">
        <p className="text-gh-muted text-sm leading-relaxed font-sans mb-3">
          We score across 5 reputation dimensions:
        </p>
        {dimensions.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gh-text text-sm font-mono">{d.label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <Share2 size={28} className="text-rose" />,
    title: "Share",
    step: "03",
    content: (
      <div className="space-y-3">
        <p className="text-gh-muted text-sm leading-relaxed font-sans">
          Export your Karma Passport as a shareable card. Drop it in your README,
          CV, portfolio, or anywhere you want your work recognized.
        </p>
        {/* Mini passport preview thumbnail */}
        <div className="border border-gh-border bg-gh-bg p-3 font-mono text-xs text-gh-muted space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gh-border" />
            <span className="text-amber">@you</span>
            <span className="ml-auto text-emerald">MAINTAINER</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[82, 74, 91, 67, 78].map((v, i) => (
              <div key={i} className="flex-1">
                <div
                  className="h-8 bg-gh-border"
                  style={{ height: `${v * 0.32}px`, background: dimensions[i].color, opacity: 0.7 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const handleSignIn = () => {
    setIsAuthenticating(true);
    signIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text overflow-x-hidden">
      <AnimatePresence>
        {isAuthenticating && (
          <LoadingScreen message="Connecting to GitHub..." />
        )}
      </AnimatePresence>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-gh-border bg-gh-bg/90 backdrop-blur-sm">
        <span className="font-mono font-bold text-amber tracking-tight text-lg">
          karma<span className="text-gh-text">commits</span>
          <span className="beta-tag">BETA</span>
        </span>
        <button
          onClick={handleSignIn}
          className="flex items-center gap-2 text-sm font-mono text-gh-muted hover:text-gh-text transition-colors border border-gh-border px-3 py-1.5 hover:border-gh-muted"
        >
          <Github size={14} />
          Sign in
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="grid-bg relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        {/* Radial vignette over grid */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #0d1117 100%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-amber/30 bg-amber/5 text-amber font-mono text-xs px-3 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              Open Source Reputation Protocol
            </div>

            {/* Headline */}
            <h1 className="font-mono font-bold leading-tight mb-4">
              <span className="block text-4xl sm:text-5xl md:text-6xl text-gh-text">
                Your GitHub profile shows what you built.
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl text-amber mt-2">
                Karma Commits shows who you are.
              </span>
            </h1>

            {/* Subtext */}
            <p className="font-sans text-gh-muted text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              The invisible labor of open source —{" "}
              <span className="text-gh-text">reviews, mentoring, docs, triage</span>{" "}
              — finally gets the credit it deserves.
            </p>

            {/* CTA */}
            <motion.button
              onClick={handleSignIn}
              className="btn-amber group"
              whileTap={{ scale: 0.97 }}
            >
              <Github size={18} className="relative z-10" />
              <span className="relative z-10">Connect GitHub</span>
              <ArrowRight
                size={18}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
            </motion.button>

            <p className="mt-4 text-gh-muted text-xs font-mono">
              read:user · public_repo · read:org — no private access, ever
            </p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <span className="text-gh-muted text-xs font-mono">scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-gh-muted to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <motion.section
        className="w-full bg-gh-surface border-t border-gh-border"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: 2400000, suffix: "+", label: "contributions analyzed" },
            { value: 5, suffix: "", label: "reputation dimensions" },
            { value: 1, suffix: "", label: "shareable passport" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <span className="text-gh-muted text-sm font-sans">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="font-mono text-amber text-xs tracking-widest uppercase">
            How it works
          </span>
          <h2 className="font-mono font-bold text-2xl sm:text-3xl mt-3 text-gh-text">
            Three steps to your open source passport
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorksCards.map((card, i) => (
            <motion.div
              key={i}
              className="card-hover border border-gh-border bg-gh-surface p-6 relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              {/* Step number */}
              <span className="absolute top-4 right-5 font-mono text-5xl font-bold text-gh-border select-none">
                {card.step}
              </span>

              <div className="mb-4">{card.icon}</div>
              <h3 className="font-mono font-bold text-lg text-gh-text mb-4">
                {card.title}
              </h3>
              {card.content}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DIMENSION BREAKDOWN TEASER ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          className="border border-gh-border bg-gh-surface p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <span className="font-mono text-amber text-xs tracking-widest uppercase">
                Reputation Engine
              </span>
              <h2 className="font-mono font-bold text-xl text-gh-text mt-2">
                5 dimensions. 1000 points. Zero vanity metrics.
              </h2>
            </div>
            <button
              onClick={handleSignIn}
              className="btn-amber text-sm whitespace-nowrap"
            >
              <Github size={15} />
              See your score →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {dimensions.map((d, i) => (
              <motion.div
                key={d.label}
                className="border border-gh-border bg-gh-bg p-4 text-center"
                initial={{ opacity: 0, scaleY: 0.8 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-mono text-xs text-gh-text">{d.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-gh-border bg-gh-surface">
        <motion.div
          className="max-w-3xl mx-auto px-6 py-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-mono font-bold text-3xl sm:text-4xl text-gh-text mb-4">
            Your contributions are{" "}
            <span className="text-amber">worth more</span>
            <br />
            than your star count.
          </h2>
          <p className="text-gh-muted font-sans mb-10 max-w-md mx-auto">
            Join thousands of open source contributors who&apos;ve already claimed
            their Karma Passport.
          </p>
          <button onClick={handleSignIn} className="btn-amber">
            <Github size={18} />
            Connect GitHub →
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gh-border bg-gh-bg">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-sm text-gh-muted">
            karma<span className="text-amber">commits</span>{" "}
            <span className="text-gh-border">©</span> 2026. Built for open source.
          </span>
          <div className="flex items-center gap-6 text-xs font-mono text-gh-muted">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gh-text transition-colors flex items-center gap-1">
              <Github size={13} /> GitHub
            </a>
            <span className="text-gh-border">·</span>
            <span>Privacy: we store nothing.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
