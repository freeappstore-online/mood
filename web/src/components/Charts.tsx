import { useCallback, useEffect, useRef, useState } from "react";
import type { MoodEntry } from "../lib/types";
import {
  FACTORS,
  MOODS,
  getMood,
  lastNDays,
  localDateString,
  timeOfDay,
} from "../lib/mood";

interface ChartsProps {
  entries: MoodEntry[];
}

type ChartTab = "trend" | "distribution" | "factors" | "timeOfDay";

export default function Charts({ entries }: ChartsProps) {
  const [active, setActive] = useState<ChartTab>("trend");

  const tabs: { key: ChartTab; label: string }[] = [
    { key: "trend", label: "Trend" },
    { key: "distribution", label: "Distribution" },
    { key: "factors", label: "Factors" },
    { key: "timeOfDay", label: "Time of day" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="display-font text-xl font-bold">Charts</h2>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: active === t.key ? "var(--accent)" : "transparent",
              color: active === t.key ? "white" : "var(--muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            Log a few check-ins to see your charts.
          </p>
        ) : (
          <>
            {active === "trend" && <TrendChart entries={entries} />}
            {active === "distribution" && <DistributionChart entries={entries} />}
            {active === "factors" && <FactorsChart entries={entries} />}
            {active === "timeOfDay" && <TimeOfDayChart entries={entries} />}
          </>
        )}
      </div>
    </div>
  );
}

function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  deps: unknown[],
  height = 220,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawCb = useCallback(draw, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth ?? 300;
    const h = height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawCb(ctx, w, h);
  }, [drawCb, height]);

  return ref;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/** Mood trend line — average daily score over last 30 days. */
function TrendChart({ entries }: { entries: MoodEntry[] }) {
  const ref = useCanvas(
    (ctx, w, h) => {
      const ink = cssVar("--ink");
      const muted = cssVar("--muted");
      const accent = cssVar("--accent");
      const line = cssVar("--line");

      const padding = { top: 16, right: 12, bottom: 28, left: 28 };
      const cw = w - padding.left - padding.right;
      const ch = h - padding.top - padding.bottom;

      // Build last 30 days
      const data: { label: string; score: number | null }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = localDateString(d);
        const day = entries.filter((e) => e.date === ds);
        const avg =
          day.length > 0
            ? day.reduce((s, e) => s + getMood(e.mood).score, 0) / day.length
            : null;
        data.push({
          label: String(d.getDate()),
          score: avg,
        });
      }

      // Y axis (1..5)
      for (let s = 1; s <= 5; s++) {
        const y = padding.top + ch - ((s - 1) / 4) * ch;
        ctx.strokeStyle = line;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.fillStyle = muted;
        ctx.font = "10px Manrope, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(String(s), padding.left - 4, y + 3);
      }

      // Plot
      const stepX = cw / Math.max(1, data.length - 1);
      const points: { x: number; y: number }[] = [];
      data.forEach((d, i) => {
        if (d.score === null) return;
        const x = padding.left + i * stepX;
        const y = padding.top + ch - ((d.score - 1) / 4) * ch;
        points.push({ x, y });
      });

      if (points.length > 1) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // area fill
        ctx.lineTo(points[points.length - 1]!.x, padding.top + ch);
        ctx.lineTo(points[0]!.x, padding.top + ch);
        ctx.closePath();
        ctx.fillStyle = accent + "22";
        ctx.fill();
      }

      points.forEach((p) => {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // X labels every 5 days
      ctx.fillStyle = muted;
      ctx.font = "9px Manrope, sans-serif";
      ctx.textAlign = "center";
      data.forEach((d, i) => {
        if (i % 5 === 0 || i === data.length - 1) {
          const x = padding.left + i * stepX;
          ctx.fillText(d.label, x, h - padding.bottom + 12);
        }
      });

      // Title-ish: latest score
      const last = [...data].reverse().find((d) => d.score !== null);
      if (last) {
        ctx.fillStyle = ink;
        ctx.font = "bold 11px Manrope, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(
          `Latest: ${last.score!.toFixed(1)} / 5`,
          padding.left,
          12,
        );
      }
    },
    [entries],
  );

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
        Mood trend — last 30 days
      </p>
      <canvas ref={ref} className="w-full" />
    </div>
  );
}

/** Pie chart of mood distribution this month. */
function DistributionChart({ entries }: { entries: MoodEntry[] }) {
  const monthPrefix = localDateString().slice(0, 7);
  const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));

  const ref = useCanvas(
    (ctx, w, h) => {
      const muted = cssVar("--muted");
      const ink = cssVar("--ink");

      if (monthEntries.length === 0) {
        ctx.fillStyle = muted;
        ctx.font = "12px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No entries this month yet.", w / 2, h / 2);
        return;
      }

      const counts = new Map<string, number>();
      for (const e of monthEntries) {
        counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
      }

      const slices = MOODS.filter((m) => (counts.get(m.key) ?? 0) > 0).map(
        (m) => ({
          label: m.label,
          emoji: m.emoji,
          count: counts.get(m.key) ?? 0,
          color: cssVar(scoreToVar(m.score)),
        }),
      );

      const total = monthEntries.length;
      const cx = w / 2;
      const cy = h / 2 - 6;
      const radius = Math.min(cx, cy) - 30;

      let startAngle = -Math.PI / 2;
      slices.forEach((s) => {
        const angle = (s.count / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();

        // label on slice
        const mid = startAngle + angle / 2;
        const pct = Math.round((s.count / total) * 100);
        const lr = radius * 0.65;
        const lx = cx + Math.cos(mid) * lr;
        const ly = cy + Math.sin(mid) * lr;
        if (pct >= 8) {
          ctx.fillStyle = "white";
          ctx.font = "bold 11px Manrope, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${pct}%`, lx, ly);
        }
        startAngle += angle;
      });

      // Centre count
      ctx.fillStyle = ink;
      ctx.font = "bold 18px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(total), cx, cy);
    },
    [entries],
    240,
  );

  // Legend grid below canvas
  const counts = new Map<string, number>();
  for (const e of monthEntries) {
    counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  }
  const legendItems = MOODS.filter((m) => (counts.get(m.key) ?? 0) > 0);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
        Mood distribution — this month
      </p>
      <canvas ref={ref} className="w-full" />
      {legendItems.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          {legendItems.map((m) => (
            <div key={m.key} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ background: `var(${scoreToVar(m.score)})` }}
              />
              <span>{m.emoji}</span>
              <span className="text-[var(--ink)]">{m.label}</span>
              <span className="text-[var(--muted)]">
                · {counts.get(m.key)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Factor correlation — average mood score per factor. */
function FactorsChart({ entries }: { entries: MoodEntry[] }) {
  const recent = lastNDays(entries, 60);

  const ref = useCanvas(
    (ctx, w, h) => {
      const muted = cssVar("--muted");
      const ink = cssVar("--ink");
      const line = cssVar("--line");

      const rows = FACTORS.map((f) => {
        const matches = recent.filter((e) => e.factors.includes(f.key));
        const avg =
          matches.length > 0
            ? matches.reduce((s, e) => s + getMood(e.mood).score, 0) /
              matches.length
            : 0;
        return {
          key: f.key,
          label: f.label,
          emoji: f.emoji,
          avg,
          n: matches.length,
        };
      }).filter((r) => r.n > 0);

      if (rows.length === 0) {
        ctx.fillStyle = muted;
        ctx.font = "12px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Tag check-ins with factors to see this chart.",
          w / 2,
          h / 2,
        );
        return;
      }

      rows.sort((a, b) => b.avg - a.avg);

      const padding = { top: 8, right: 32, bottom: 12, left: 96 };
      const cw = w - padding.left - padding.right;
      const rowH = (h - padding.top - padding.bottom) / rows.length;

      rows.forEach((r, i) => {
        const y = padding.top + i * rowH;
        const cy = y + rowH / 2;
        const barH = Math.max(10, rowH - 8);
        const barY = cy - barH / 2;

        // Label
        ctx.fillStyle = ink;
        ctx.font = "11px Manrope, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(`${r.emoji} ${r.label}`, padding.left - 6, cy);

        // Track
        ctx.fillStyle = line;
        roundRect(ctx, padding.left, barY, cw, barH, 4);
        ctx.fill();

        // Bar (1..5 maps to 0..cw)
        const pct = (r.avg - 1) / 4;
        const bw = Math.max(2, pct * cw);
        ctx.fillStyle = cssVar(scoreToVar(r.avg));
        roundRect(ctx, padding.left, barY, bw, barH, 4);
        ctx.fill();

        // Value label
        ctx.fillStyle = ink;
        ctx.font = "bold 10px Manrope, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(
          `${r.avg.toFixed(1)} · ${r.n}`,
          padding.left + cw + 4,
          cy,
        );
      });
    },
    [entries],
    Math.min(260, 36 * FACTORS.length + 16),
  );

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
        Average mood by factor — last 60 days
      </p>
      <canvas ref={ref} className="w-full" />
    </div>
  );
}

/** Time-of-day pattern bars: morning / afternoon / evening averages. */
function TimeOfDayChart({ entries }: { entries: MoodEntry[] }) {
  const recent = lastNDays(entries, 60);

  const ref = useCanvas(
    (ctx, w, h) => {
      const muted = cssVar("--muted");
      const ink = cssVar("--ink");
      const line = cssVar("--line");

      const buckets: Record<
        "morning" | "afternoon" | "evening",
        { total: number; n: number }
      > = {
        morning: { total: 0, n: 0 },
        afternoon: { total: 0, n: 0 },
        evening: { total: 0, n: 0 },
      };

      for (const e of recent) {
        const b = buckets[timeOfDay(e.timestamp)];
        b.total += getMood(e.mood).score;
        b.n += 1;
      }

      const data = (
        [
          { key: "morning" as const, label: "Morning", emoji: "🌅" },
          { key: "afternoon" as const, label: "Afternoon", emoji: "🌤️" },
          { key: "evening" as const, label: "Evening", emoji: "🌙" },
        ]
      ).map((p) => ({
        ...p,
        avg: buckets[p.key].n > 0 ? buckets[p.key].total / buckets[p.key].n : 0,
        n: buckets[p.key].n,
      }));

      const padding = { top: 24, right: 16, bottom: 38, left: 28 };
      const cw = w - padding.left - padding.right;
      const ch = h - padding.top - padding.bottom;

      // Y grid 1..5
      for (let s = 1; s <= 5; s++) {
        const y = padding.top + ch - ((s - 1) / 4) * ch;
        ctx.strokeStyle = line;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.fillStyle = muted;
        ctx.font = "10px Manrope, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(String(s), padding.left - 4, y + 3);
      }

      const barW = cw / data.length - 24;
      data.forEach((d, i) => {
        const x = padding.left + i * (cw / data.length) + 12;
        const pct = d.n > 0 ? (d.avg - 1) / 4 : 0;
        const bh = pct * ch;
        const y = padding.top + ch - bh;
        const color = d.n > 0 ? cssVar(scoreToVar(d.avg)) : line;

        ctx.fillStyle = color;
        roundRect(ctx, x, y, barW, bh, 6);
        ctx.fill();

        // value
        if (d.n > 0) {
          ctx.fillStyle = ink;
          ctx.font = "bold 11px Manrope, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(d.avg.toFixed(1), x + barW / 2, y - 6);
        } else {
          ctx.fillStyle = muted;
          ctx.font = "10px Manrope, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("—", x + barW / 2, padding.top + ch - 4);
        }

        // label
        ctx.fillStyle = ink;
        ctx.font = "bold 11px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `${d.emoji} ${d.label}`,
          x + barW / 2,
          h - padding.bottom + 14,
        );
        ctx.fillStyle = muted;
        ctx.font = "9px Manrope, sans-serif";
        ctx.fillText(
          `n=${d.n}`,
          x + barW / 2,
          h - padding.bottom + 26,
        );
      });
    },
    [entries],
    260,
  );

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
        Average mood by time of day — last 60 days
      </p>
      <canvas ref={ref} className="w-full" />
    </div>
  );
}

function scoreToVar(score: number): string {
  if (score >= 4.5) return "--mood-great";
  if (score >= 3.5) return "--mood-good";
  if (score >= 2.5) return "--mood-okay";
  if (score >= 1.5) return "--mood-meh";
  return "--mood-bad";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (h <= 0 || w <= 0) return;
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
