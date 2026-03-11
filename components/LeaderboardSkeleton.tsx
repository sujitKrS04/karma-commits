"use client";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-sm animate-shimmer ${className}`}
      style={{
        background:
          "linear-gradient(90deg, #30363d 0%, #161b22 50%, #30363d 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-gh-border"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Rank */}
      <Shimmer className="h-5 w-7 flex-shrink-0" />

      {/* Avatar */}
      <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />

      {/* Name / handle */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <Shimmer className="h-4 w-36" />
        <Shimmer className="h-3 w-24" />
      </div>

      {/* Rank pill */}
      <Shimmer className="h-5 w-20 hidden md:block" />

      {/* 5 category dots */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <Shimmer key={i} className="w-2.5 h-2.5 rounded-full" />
        ))}
      </div>

      {/* Badges */}
      <div className="hidden md:flex gap-0.5 flex-shrink-0">
        {[1, 2, 3].map((i) => (
          <Shimmer key={i} className="w-5 h-5" />
        ))}
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-right space-y-1">
        <Shimmer className="h-6 w-12 ml-auto" />
        <Shimmer className="h-2.5 w-8 ml-auto" />
      </div>

      {/* Arrow */}
      <Shimmer className="w-3.5 h-3.5 flex-shrink-0" />
    </div>
  );
}

export default function LeaderboardSkeleton() {
  return (
    <div className="border border-t-0 border-gh-border bg-gh-surface overflow-hidden">
      {Array.from({ length: 10 }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}
