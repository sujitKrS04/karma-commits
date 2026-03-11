"use client";

import { useRef, useState, memo } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { Radar, RadarChart, PolarGrid } from "recharts";
import { type KarmaPassport } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  Legend:      "👑 LEGEND",
  Luminary:    "⚡ VETERAN",
  Maintainer:  "⚙️ MAINTAINER",
  Contributor: "🌱 CONTRIBUTOR",
  Sprout:      "🌿 APPRENTICE",
  Seed:        "🌱 APPRENTICE",
};

const TIER_COLOR: Record<string, string> = {
  Legend:      "#f43f5e",
  Luminary:    "#f0a500",
  Maintainer:  "#10b981",
  Contributor: "#10b981",
  Sprout:      "#8b949e",
  Seed:        "#8b949e",
};

// ─── Noise texture (SVG feTurbulence encoded as data URL) ─────────────────────

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

// ─── Component ────────────────────────────────────────────────────────────────

interface PassportCardProps {
  passport: KarmaPassport;
}

function PassportCard({ passport }: PassportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const tierColor = TIER_COLOR[passport.score.tier] ?? "#8b949e";
  const tierLabel = TIER_LABEL[passport.score.tier] ?? "🌱 APPRENTICE";
  const memberYear = new Date(passport.user.created_at).getFullYear();

  const radarData = passport.score.dimensions.map((d) => ({
    subject: d.label,
    value: d.score,
    fullMark: 100,
  }));

  const earnedBadges = passport.badges.filter((b) => b.earned);

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#161b22",
      });
      const link = document.createElement("a");
      link.download = `karma-commits-${passport.user.login}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes kc-holo-drift {
          0%   { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(380%)  skewX(-12deg); }
        }
        .kc-holo { animation: kc-holo-drift 30s linear infinite; }
      `}</style>

      {/* ═══════════════════ EXPORTABLE CARD 800×460 ═══════════════════ */}
      <div
        ref={cardRef}
        style={{
          width: "800px",
          height: "460px",
          backgroundColor: "#161b22",
          border: "2px solid #f0a500",
          borderRadius: 0,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'JetBrains Mono', Consolas, monospace",
        }}
      >
        {/* Noise texture overlay — 3% opacity for depth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: NOISE_SVG,
            backgroundRepeat: "repeat",
            opacity: 0.03,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        {/* Holographic shimmer — slow amber light sweep */}
        <div
          className="kc-holo"
          style={{
            position: "absolute",
            top: "-20%",
            left: 0,
            width: "30%",
            height: "140%",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(240,165,0,0.04) 50%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 11,
          }}
        />

        {/* ── Body: LEFT + DIVIDER + RIGHT ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* ══════════ LEFT SECTION — 280px ══════════ */}
          <div
            style={{
              width: "280px",
              flexShrink: 0,
              padding: "22px 20px 16px 22px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* "KARMA COMMITS" wordmark */}
            <div
              style={{
                fontSize: "9px",
                color: "#f0a500",
                letterSpacing: "0.3em",
                fontWeight: 700,
                marginBottom: "14px",
              }}
            >
              KARMA COMMITS
            </div>

            {/* Avatar — 96×96, circular, amber ring */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={passport.user.avatar_url}
              alt={passport.user.login}
              crossOrigin="anonymous"
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                border: "3px solid #f0a500",
                display: "block",
                marginBottom: "14px",
              }}
            />

            {/* Full name */}
            <div
              style={{
                fontSize: "17px",
                color: "#e6edf3",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "3px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {passport.user.name ?? passport.user.login}
            </div>

            {/* @username */}
            <div style={{ fontSize: "13px", color: "#8b949e", marginBottom: "5px" }}>
              @{passport.user.login}
            </div>

            {/* Bio — single truncated line */}
            {passport.user.bio && (
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "10px",
                  color: "#8b949e",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: "8px",
                  lineHeight: 1.4,
                }}
              >
                {passport.user.bio}
              </div>
            )}

            {/* Amber horizontal divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "#f0a500",
                opacity: 0.35,
                margin: "8px 0 12px",
              }}
            />

            {/* Rank badge — pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                border: `1px solid ${tierColor}80`,
                backgroundColor: `${tierColor}15`,
                fontSize: "10px",
                color: tierColor,
                fontWeight: 700,
                letterSpacing: "0.12em",
                borderRadius: "999px",
                marginBottom: "10px",
                width: "fit-content",
              }}
            >
              {tierLabel}
            </div>

            {/* Member since */}
            <div style={{ fontSize: "11px", color: "#8b949e" }}>
              Member since {memberYear}
            </div>
          </div>

          {/* ══════════ VERTICAL DIVIDER ══════════ */}
          <div
            style={{
              width: "1px",
              backgroundColor: "#30363d",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Amber dot — top */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#f0a500",
              }}
            />
            {/* Amber dot — bottom */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#f0a500",
              }}
            />
          </div>

          {/* ══════════ RIGHT SECTION ══════════ */}
          <div
            style={{
              flex: 1,
              padding: "22px 22px 16px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minWidth: 0,
            }}
          >
            {/* TOP ROW: Giant score + mini radar */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ flexShrink: 0 }}>
                {/* "KARMA SCORE" label */}
                <div
                  style={{
                    fontSize: "8px",
                    color: "#f0a500",
                    letterSpacing: "0.22em",
                    fontWeight: 600,
                    marginBottom: "2px",
                  }}
                >
                  KARMA SCORE
                </div>
                {/* Score number — 80px */}
                <div
                  style={{
                    fontSize: "80px",
                    color: "#f0a500",
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-3px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {passport.score.total}
                </div>
              </div>

              {/* Mini radar — 120×120, no labels, amber fill */}
              <div style={{ flexShrink: 0, lineHeight: 0 }}>
                <RadarChart
                  width={120}
                  height={120}
                  data={radarData}
                  margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <PolarGrid stroke="#30363d" strokeOpacity={0.9} />
                  <Radar
                    name="score"
                    dataKey="value"
                    fill="#f0a500"
                    fillOpacity={0.22}
                    stroke="#f0a500"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </RadarChart>
              </div>
            </div>

            {/* CATEGORY MINI BARS — 5 rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {passport.score.dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {/* Colored dot */}
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: dim.color,
                      flexShrink: 0,
                    }}
                  />
                  {/* Label */}
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#8b949e",
                      width: "82px",
                      flexShrink: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dim.label}
                  </span>
                  {/* Track */}
                  <div
                    style={{
                      flex: 1,
                      height: "3px",
                      backgroundColor: "#21262d",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${dim.score}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                  </div>
                  {/* Score */}
                  <span
                    style={{
                      fontSize: "10px",
                      color: dim.color,
                      width: "22px",
                      textAlign: "right",
                      flexShrink: 0,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {dim.score}
                  </span>
                </div>
              ))}
            </div>

            {/* BADGE ROW — earned emoji badges */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {earnedBadges.length > 0 ? (
                earnedBadges.map((badge) => (
                  <span
                    key={badge.id}
                    title={badge.name ?? badge.label ?? ""}
                    style={{ fontSize: "22px", lineHeight: 1 }}
                  >
                    {badge.icon}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: "11px", color: "#8b949e", fontStyle: "italic" }}>
                  No badges yet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ BOTTOM STRIP — 40px ══════════ */}
        <div
          style={{
            height: "40px",
            backgroundColor: "#0d1117",
            borderTop: "1px solid #f0a500",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            flexShrink: 0,
          }}
        >
          {/* Left: github handle */}
          <span style={{ fontSize: "11px", color: "#8b949e", letterSpacing: "0.04em" }}>
            github.com/{passport.user.login}
          </span>

          {/* Center: QR placeholder */}
          <div
            style={{
              width: "32px",
              height: "28px",
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "6px",
              color: "#f0a500",
              letterSpacing: "2px",
              lineHeight: 1,
            }}
          >
            ▪▪▪
          </div>

          {/* Right: site */}
          <span style={{ fontSize: "11px", color: "#f0a500", letterSpacing: "0.06em" }}>
            karma.commits.dev
          </span>
        </div>
      </div>

      {/* ═══════════════════ DOWNLOAD BUTTON ═══════════════════ */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        onMouseEnter={(e) => {
          if (!downloading)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d49200";
        }}
        onMouseLeave={(e) => {
          if (!downloading)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0a500";
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "800px",
          padding: "11px 0",
          backgroundColor: downloading ? "#21262d" : "#f0a500",
          color: downloading ? "#8b949e" : "#0d1117",
          border: "none",
          borderRadius: 0,
          fontFamily: "'JetBrains Mono', Consolas, monospace",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          cursor: downloading ? "not-allowed" : "pointer",
          transition: "background-color 0.15s, color 0.15s",
        }}
      >
        <Download size={13} />
        {downloading ? "Downloading..." : "Download PNG"}
      </button>
    </div>
  );
}

export default memo(PassportCard);
