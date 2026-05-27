import { useMemo } from "react";
import type { MoodEntry, MoodStats } from "../lib/types";
import { generateInsights } from "../lib/insights";

interface InsightsProps {
  entries: MoodEntry[];
  stats: MoodStats;
}

export default function Insights({ entries, stats }: InsightsProps) {
  const insights = useMemo(() => generateInsights(entries), [entries]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="display-font text-xl font-bold">Insights</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="Today" value={
          stats.todayAvgScore !== null ? stats.todayAvgScore.toFixed(1) : "—"
        } sub={`${stats.todayCount} entr${stats.todayCount === 1 ? "y" : "ies"}`} />
        <StatCard label="This week" value={
          stats.weekAvgScore !== null ? stats.weekAvgScore.toFixed(1) : "—"
        } sub="avg / 5" />
        <StatCard label="Streak" value={`${stats.currentStreak}d`} sub={`longest ${stats.longestStreak}d`} />
        <StatCard label="All-time" value={String(stats.totalEntries)} sub="check-ins" />
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Patterns we noticed</h3>
        <ul className="flex flex-col gap-2">
          {insights.map((i) => (
            <li
              key={i.id}
              className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3"
            >
              <span className="text-2xl leading-none" aria-hidden>
                {i.icon}
              </span>
              <p className="text-sm leading-snug text-[var(--ink)]">{i.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[11px] text-[var(--muted)]">
        Insights are generated locally from your check-ins. Nothing is sent
        anywhere — your data stays on this device.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className="display-font mt-0.5 text-2xl font-bold text-[var(--ink)]">
        {value}
      </div>
      <div className="text-[10px] text-[var(--muted)]">{sub}</div>
    </div>
  );
}
