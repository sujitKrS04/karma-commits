"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { type DimensionScore } from "@/lib/types";

interface RadarChartProps {
  dimensions: DimensionScore[];
}

export default function RadarChart({ dimensions }: RadarChartProps) {
  const data = dimensions.map((d) => ({
    subject: d.label,
    score: d.score,
    fullMark: 100,
  }));

  return (
    <div className="border border-gh-border bg-gh-surface p-6">
      <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
        Radar View
      </span>
      <ResponsiveContainer width="100%" height={300} className="mt-4">
        <RechartsRadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#8b949e", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
          />
          <Radar
            name="Karma"
            dataKey="score"
            stroke="#f0a500"
            fill="#f0a500"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: "#f0a500", r: 3 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
