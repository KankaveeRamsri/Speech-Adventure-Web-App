"use client";

import { useId } from "react";
import type { TrendPoint } from "@/lib/teacher/studentAnalytics";
import { thaiDate } from "@/lib/teacher/format";

interface Props {
  points: TrendPoint[];
  mode: "attempts" | "weekly";
}

/**
 * Lightweight inline-SVG score trend — no chart library.
 * Y axis fixed 0–100 (the score scale). Each point carries a visible value
 * label and a dot marker, so it is readable without relying on colour.
 * Responsive: the SVG scales to its container via viewBox + width 100%.
 */
export default function ScoreTrendChart({ points, mode }: Props) {
  const clipId = useId();

  if (points.length === 0) return null;

  // Single point → show it centered as a lone marker.
  const W = 320;
  const H = 140;
  const padL = 30;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const n = points.length;
  const x = (i: number) => (n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const y = (score: number) => padT + (1 - Math.max(0, Math.min(100, score)) / 100) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`)
    .join(" ");

  const gridScores = [0, 50, 100];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          mode === "weekly"
            ? `กราฟคะแนนเฉลี่ยรายสัปดาห์ ${n} สัปดาห์`
            : `กราฟคะแนน ${n} ครั้งล่าสุด`
        }
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={padL} y={padT} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* gridlines + y labels */}
        {gridScores.map((s) => (
          <g key={s}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(s)}
              y2={y(s)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y(s) + 3}
              textAnchor="end"
              className="fill-text-muted"
              fontSize={9}
            >
              {s}
            </text>
          </g>
        ))}

        {/* line */}
        {n > 1 && (
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* points + value labels */}
        {points.map((p, i) => (
          <g key={p.iso + i}>
            <circle cx={x(i)} cy={y(p.score)} r={3.5} className="fill-primary" />
            <text
              x={x(i)}
              y={y(p.score) - 7}
              textAnchor="middle"
              className="fill-text"
              fontSize={9}
              fontWeight={600}
            >
              {p.score}
            </text>
          </g>
        ))}

        {/* x labels — first, middle, last only, to stay readable on mobile */}
        {[0, Math.floor((n - 1) / 2), n - 1]
          .filter((v, idx, arr) => arr.indexOf(v) === idx)
          .map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="fill-text-muted"
              fontSize={8.5}
            >
              {thaiDate(points[i].iso)}
            </text>
          ))}
      </svg>
      <figcaption className="mt-1 text-[11px] text-text-muted text-center">
        {mode === "weekly" ? "คะแนนเฉลี่ยรายสัปดาห์" : "คะแนนรายครั้ง (เรียงตามเวลา)"}
      </figcaption>
    </figure>
  );
}
