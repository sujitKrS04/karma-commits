"use client";

import React from "react";

// Animated shimmer: #30363d → #161b22 → #30363d
// Matches the exact card layout of the real dashboard.

function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-sm animate-shimmer ${className}`}
      style={{
        background:
          "linear-gradient(90deg, #30363d 0%, #161b22 50%, #30363d 100%)",
        backgroundSize: "200% 100%",
        ...style,
      }}
    />
  );
}

// Single card shell
function SkeletonCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-gh-border bg-gh-surface p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Score Hero skeleton ───────────────────────────────────────────────────────
function ScoreHeroSkeleton() {
  return (
    <SkeletonCard>
      {/* Identity row */}
      <div className="flex items-start gap-4 mb-8">
        <Shimmer className="w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex-1 pt-1 space-y-2">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-3.5 w-24" />
          <Shimmer className="h-3 w-64 mt-2" />
        </div>
      </div>
      {/* Giant score */}
      <Shimmer className="h-24 w-52 mb-3" />
      {/* Rank pill */}
      <Shimmer className="h-6 w-32 mb-8" />
      {/* Stats row */}
      <div className="border-t border-gh-border pt-5 flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 text-center space-y-1.5">
            <Shimmer className="h-5 w-12 mx-auto" />
            <Shimmer className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

// ─── Category Breakdown skeleton ──────────────────────────────────────────────
function CategorySkeleton() {
  return (
    <SkeletonCard>
      <Shimmer className="h-3.5 w-40 mb-5" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-4 w-12" />
            </div>
            <Shimmer className="h-2 w-full" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

// ─── Stats Grid skeleton ───────────────────────────────────────────────────────
function StatsGridSkeleton() {
  return (
    <SkeletonCard>
      <Shimmer className="h-3.5 w-32 mb-5" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-gh-border p-4 space-y-2">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-7 w-16" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

// ─── Radar skeleton ────────────────────────────────────────────────────────────
function RadarSkeleton() {
  return (
    <SkeletonCard>
      <Shimmer className="h-3.5 w-36 mb-5" />
      <Shimmer className="h-56 w-full rounded-full" style={{ borderRadius: "50%" }} />
    </SkeletonCard>
  );
}

// ─── Badge skeleton ────────────────────────────────────────────────────────────
function BadgeSkeleton() {
  return (
    <SkeletonCard>
      <Shimmer className="h-3.5 w-24 mb-5" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-gh-border p-3 space-y-2 text-center">
            <Shimmer className="h-8 w-8 mx-auto rounded" />
            <Shimmer className="h-3 w-full" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gh-bg text-gh-text">
      {/* Nav */}
      <div className="h-14 border-b border-gh-border bg-gh-surface px-6 flex items-center justify-between">
        <Shimmer className="h-4 w-36" />
        <div className="flex items-center gap-4">
          <Shimmer className="h-3.5 w-20" />
          <Shimmer className="w-8 h-8 rounded-full" />
          <Shimmer className="h-3.5 w-16" />
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-5 gap-6 items-start">
          {/* Left col */}
          <div className="col-span-3 space-y-6 max-lg:col-span-5">
            <ScoreHeroSkeleton />
            <CategorySkeleton />
            <StatsGridSkeleton />
          </div>
          {/* Right col */}
          <div className="col-span-2 space-y-6 max-lg:col-span-5">
            <RadarSkeleton />
            <BadgeSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
