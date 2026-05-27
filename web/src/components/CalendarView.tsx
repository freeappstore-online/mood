import { useMemo, useState } from "react";
import type { MoodEntry } from "../lib/types";
import {
  avgScore,
  friendlyDate,
  getMood,
  groupByDate,
  localDateString,
  moodColorVar,
  sortByNewest,
} from "../lib/mood";

interface CalendarViewProps {
  entries: MoodEntry[];
  onDelete: (id: string) => void;
}

export default function CalendarView({ entries, onDelete }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0..11
  const [selected, setSelected] = useState<string | null>(localDateString());

  const byDate = useMemo(() => groupByDate(entries), [entries]);

  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid (6 weeks × 7 days, Mon..Sun)
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0=Mon..6=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<{ date: string | null; inMonth: boolean }> = [];
    for (let i = 0; i < firstWeekday; i++) out.push({ date: null, inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      out.push({ date: ds, inMonth: true });
    }
    while (out.length % 7 !== 0) out.push({ date: null, inMonth: false });
    return out;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const selectedEntries = selected ? sortByNewest(byDate.get(selected) ?? []) : [];

  const todayStr = localDateString();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="display-font text-xl font-bold">Calendar</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--ink)]"
            aria-label="Previous month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold">
            {monthName}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--ink)]"
            aria-label="Next month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </header>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-[var(--muted)]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Heat-map grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.date) {
            return <div key={`pad-${i}`} className="aspect-square" />;
          }
          const dayEntries = byDate.get(c.date) ?? [];
          const score = avgScore(dayEntries);
          const moodKey =
            dayEntries.length > 0
              ? // pick the mood with the median-ish score for color
                pickRepresentativeMood(dayEntries)
              : null;
          const bg =
            moodKey !== null
              ? `var(${moodColorVar(moodKey)})`
              : "var(--panel)";
          const dayNum = Number(c.date.slice(-2));
          const isToday = c.date === todayStr;
          const isSelected = c.date === selected;
          const empty = dayEntries.length === 0;
          return (
            <button
              key={c.date}
              type="button"
              onClick={() => setSelected(c.date)}
              className="heat-cell aspect-square rounded-lg text-[11px] font-semibold"
              style={{
                background: bg,
                color: empty ? "var(--muted)" : "white",
                outline: isSelected
                  ? "2px solid var(--accent)"
                  : isToday
                    ? "1px solid var(--accent)"
                    : "none",
                outlineOffset: isSelected ? "1px" : undefined,
                border: empty ? "1px solid var(--line)" : "none",
              }}
              aria-label={`${c.date}, ${dayEntries.length} entries${score !== null ? `, avg ${score.toFixed(1)}` : ""}`}
            >
              <div className="flex h-full flex-col items-center justify-center">
                <span>{dayNum}</span>
                {dayEntries.length > 0 && (
                  <span className="text-[8px] opacity-80">
                    {dayEntries.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[10px] text-[var(--muted)]">
        <span>Low mood</span>
        <div className="flex items-center gap-1">
          {(["bad", "meh", "okay", "good", "great"] as const).map((k) => (
            <div
              key={k}
              className="h-3 w-5 rounded-sm"
              style={{ background: `var(--mood-${k})` }}
            />
          ))}
        </div>
        <span>High mood</span>
      </div>

      {/* Day detail */}
      {selected && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            {friendlyDate(selected)}{" "}
            <span className="font-normal text-[var(--muted)]">
              · {selectedEntries.length} entr
              {selectedEntries.length === 1 ? "y" : "ies"}
            </span>
          </h3>
          {selectedEntries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--panel)] p-4 text-center text-xs text-[var(--muted)]">
              No check-ins on this day.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedEntries.map((e) => {
                const mood = getMood(e.mood);
                const color = `var(${moodColorVar(e.mood)})`;
                const time = new Date(e.timestamp).toLocaleTimeString(
                  undefined,
                  { hour: "numeric", minute: "2-digit" },
                );
                return (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ background: color }}
                      aria-hidden
                    >
                      {mood.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {mood.label}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          {time}
                        </span>
                      </div>
                      {e.factors.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {e.factors.map((f) => (
                            <span
                              key={f}
                              className="text-[10px] text-[var(--muted)]"
                            >
                              #{f}
                            </span>
                          ))}
                        </div>
                      )}
                      {e.note && (
                        <p className="mt-1 text-xs text-[var(--ink)]">
                          {e.note}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(e.id)}
                      className="flex-shrink-0 rounded-md p-1 text-[var(--muted)] transition-colors hover:text-[var(--error)]"
                      aria-label="Delete entry"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14H7L5 6" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/** Pick a mood key whose score is closest to the day's average score. */
function pickRepresentativeMood(
  entries: MoodEntry[],
): MoodEntry["mood"] | null {
  if (entries.length === 0) return null;
  const avg = entries.reduce((s, e) => s + getMood(e.mood).score, 0) / entries.length;
  let best = entries[0]!;
  let bestDiff = Math.abs(getMood(best.mood).score - avg);
  for (const e of entries) {
    const diff = Math.abs(getMood(e.mood).score - avg);
    if (diff < bestDiff) {
      best = e;
      bestDiff = diff;
    }
  }
  return best.mood;
}
