import { useEffect, useMemo, useState } from "react";
import type { MoodEntry, WeeklyReflection } from "../lib/types";
import {
  avgScore,
  getMood,
  isoWeekStart,
  localDateString,
  makeId,
} from "../lib/mood";

interface ReflectProps {
  entries: MoodEntry[];
  reflections: WeeklyReflection[];
  onSave: (r: WeeklyReflection) => void;
}

export default function Reflect({
  entries,
  reflections,
  onSave,
}: ReflectProps) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - weekOffset * 7);
    return isoWeekStart(d);
  }, [weekOffset]);

  const weekEntries = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = localDateString(start);
    const endStr = localDateString(end);
    return entries.filter((e) => e.date >= startStr && e.date <= endStr);
  }, [entries, weekStart]);

  const existing = useMemo(
    () => reflections.find((r) => r.weekStart === weekStart),
    [reflections, weekStart],
  );

  const [wentWell, setWentWell] = useState(existing?.wentWell ?? "");
  const [challenging, setChallenging] = useState(existing?.challenging ?? "");
  const [nextWeek, setNextWeek] = useState(existing?.nextWeek ?? "");
  const [savedFlash, setSavedFlash] = useState(false);

  // Reset fields when the week changes
  useEffect(() => {
    setWentWell(existing?.wentWell ?? "");
    setChallenging(existing?.challenging ?? "");
    setNextWeek(existing?.nextWeek ?? "");
    setSavedFlash(false);
  }, [existing, weekStart]);

  const weekEnd = new Date(`${weekStart}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const rangeLabel = `${formatRange(weekStart)} – ${formatRange(localDateString(weekEnd))}`;

  const avg = avgScore(weekEntries);
  const topMood = topMoodLabel(weekEntries);

  function handleSave() {
    const r: WeeklyReflection = {
      id: existing?.id ?? makeId(),
      weekStart,
      wentWell: wentWell.trim(),
      challenging: challenging.trim(),
      nextWeek: nextWeek.trim(),
      updatedAt: new Date().toISOString(),
    };
    onSave(r);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="display-font text-xl font-bold">Weekly reflection</h2>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            className="rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--ink)]"
            aria-label="Previous week"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--ink)] disabled:opacity-40"
            aria-label="Next week"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-xs">
        <div className="font-semibold text-[var(--ink)]">{rangeLabel}</div>
        <div className="mt-1 text-[var(--muted)]">
          {weekEntries.length} check-in{weekEntries.length === 1 ? "" : "s"}
          {avg !== null && (
            <>
              {" "}· avg {avg.toFixed(1)} / 5
            </>
          )}
          {topMood && (
            <>
              {" "}· mostly {topMood}
            </>
          )}
        </div>
      </div>

      <Prompt
        label="What went well?"
        emoji="✨"
        value={wentWell}
        onChange={setWentWell}
        placeholder="Wins, small or big…"
      />
      <Prompt
        label="What was challenging?"
        emoji="🌧️"
        value={challenging}
        onChange={setChallenging}
        placeholder="What weighed on you this week?"
      />
      <Prompt
        label="One thing for next week"
        emoji="🌱"
        value={nextWeek}
        onChange={setNextWeek}
        placeholder="One small intention…"
      />

      <button
        type="button"
        onClick={handleSave}
        className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
      >
        {existing ? "Update reflection" : "Save reflection"}
      </button>

      {savedFlash && (
        <div
          role="status"
          className="rounded-xl border border-[var(--success)] bg-[var(--panel)] px-3 py-2 text-center text-sm font-semibold text-[var(--success)]"
        >
          ✓ Saved
        </div>
      )}
    </div>
  );
}

function Prompt({
  label,
  emoji,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  emoji: string;
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
        <span aria-hidden>{emoji}</span>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
      />
    </div>
  );
}

function formatRange(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function topMoodLabel(entries: MoodEntry[]): string | null {
  if (entries.length === 0) return null;
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  let bestKey: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      bestN = n;
      bestKey = k;
    }
  }
  if (!bestKey) return null;
  const m = getMood(bestKey as MoodEntry["mood"]);
  return `${m.emoji} ${m.label.toLowerCase()}`;
}
