import { useState } from "react";
import type { FactorKey, MoodEntry, MoodKey, MoodStats } from "../lib/types";
import {
  FACTORS,
  MOODS,
  friendlyDate,
  getMood,
  localDateString,
  makeId,
  moodColorVar,
  sortByNewest,
  timeOfDay,
} from "../lib/mood";

interface CheckInProps {
  entries: MoodEntry[];
  stats: MoodStats;
  onAdd: (entry: MoodEntry) => void;
  onDelete: (id: string) => void;
}

export default function CheckIn({
  entries,
  stats,
  onAdd,
  onDelete,
}: CheckInProps) {
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<FactorKey[]>([]);
  const [note, setNote] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const today = localDateString();
  const todays = entries.filter((e) => e.date === today);
  const recent = sortByNewest(entries).slice(0, 5);

  const period = timeOfDay(new Date().toISOString());

  const greeting =
    period === "morning"
      ? "Good morning"
      : period === "afternoon"
        ? "Good afternoon"
        : "Good evening";

  function toggleFactor(f: FactorKey) {
    setSelectedFactors((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }

  function reset() {
    setSelectedMood(null);
    setSelectedFactors([]);
    setNote("");
  }

  function handleSave() {
    if (!selectedMood) return;
    const entry: MoodEntry = {
      id: makeId(),
      timestamp: new Date().toISOString(),
      date: today,
      mood: selectedMood,
      factors: selectedFactors,
      note: note.trim(),
    };
    onAdd(entry);
    reset();
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + streak */}
      <section className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {greeting}
        </p>
        <h2 className="display-font text-2xl font-bold leading-tight">
          How are you feeling{todays.length > 0 ? " now?" : "?"}
        </h2>
        {(stats.currentStreak > 0 || stats.totalEntries > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
            {stats.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--panel)] px-2 py-1 font-semibold text-[var(--ink)]">
                🔥 {stats.currentStreak}-day streak
              </span>
            )}
            <span className="text-[var(--muted)]">
              {stats.totalEntries} check-in{stats.totalEntries === 1 ? "" : "s"}{" "}
              all-time
            </span>
          </div>
        )}
      </section>

      {/* Mood grid */}
      <section
        aria-label="Choose your mood"
        className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
      >
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {MOODS.map((m) => {
            const active = selectedMood === m.key;
            const color = `var(${moodColorVar(m.key)})`;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMood(m.key)}
                className="mood-btn flex flex-col items-center gap-1 rounded-2xl px-2 py-3"
                style={{
                  background: active ? color : "var(--paper)",
                  outline: active ? `2px solid ${color}` : "none",
                  outlineOffset: active ? "2px" : undefined,
                }}
                aria-pressed={active}
              >
                <span className="text-4xl leading-none">{m.emoji}</span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: active ? "white" : "var(--ink)" }}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Factors */}
      {selectedMood && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            What's influencing it?{" "}
            <span className="font-normal text-[var(--muted)]">
              (optional, tap any)
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {FACTORS.map((f) => {
              const active = selectedFactors.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFactor(f.key)}
                  className="factor-chip inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: active ? "var(--accent)" : "var(--paper)",
                    color: active ? "white" : "var(--ink)",
                    borderColor: active
                      ? "var(--accent)"
                      : "var(--line-strong)",
                  }}
                  aria-pressed={active}
                >
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Note */}
      {selectedMood && (
        <section className="flex flex-col gap-2">
          <label
            htmlFor="note"
            className="text-sm font-semibold text-[var(--ink)]"
          >
            One-line note{" "}
            <span className="font-normal text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={140}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
        </section>
      )}

      {/* Save */}
      {selectedMood && (
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
        >
          Log this check-in
        </button>
      )}

      {savedFlash && (
        <div
          role="status"
          className="rounded-xl border border-[var(--success)] bg-[var(--panel)] px-3 py-2 text-center text-sm font-semibold text-[var(--success)]"
        >
          ✓ Logged — nice work
        </div>
      )}

      {/* Today's entries */}
      {todays.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Today ({todays.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {sortByNewest(todays).map((e) => (
              <EntryRow key={e.id} entry={e} onDelete={onDelete} />
            ))}
          </ul>
        </section>
      )}

      {/* Recent timeline */}
      {recent.length > 0 && todays.length === 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Recent</h3>
          <ul className="flex flex-col gap-2">
            {recent.map((e) => (
              <EntryRow key={e.id} entry={e} onDelete={onDelete} />
            ))}
          </ul>
        </section>
      )}

      {/* Empty state */}
      {entries.length === 0 && !selectedMood && (
        <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--panel)] p-5 text-center text-sm text-[var(--muted)]">
          Tap a face above to log your first check-in.
          <br />
          Insights, charts, and streaks unlock with a bit of history.
        </section>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  onDelete,
}: {
  entry: MoodEntry;
  onDelete: (id: string) => void;
}) {
  const mood = getMood(entry.mood);
  const color = `var(${moodColorVar(entry.mood)})`;
  const time = new Date(entry.timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const day = friendlyDate(entry.date);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl"
        style={{ background: color }}
        aria-hidden
      >
        {mood.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">{mood.label}</span>
          <span className="text-[11px] text-[var(--muted)]">
            {day} · {time}
          </span>
        </div>
        {entry.factors.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.factors.map((f) => (
              <span
                key={f}
                className="text-[10px] text-[var(--muted)]"
              >
                #{f}
              </span>
            ))}
          </div>
        )}
        {entry.note && (
          <p className="mt-1 truncate text-xs text-[var(--ink)]">
            {entry.note}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        className="flex-shrink-0 rounded-md p-1 text-[var(--muted)] transition-colors hover:text-[var(--error)]"
        aria-label="Delete entry"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14H7L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </li>
  );
}
