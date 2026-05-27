import type {
  FactorKey,
  FactorOption,
  MoodEntry,
  MoodKey,
  MoodOption,
  MoodStats,
} from "./types";

export const MOODS: MoodOption[] = [
  { key: "great", emoji: "😄", label: "Great", score: 5 },
  { key: "excited", emoji: "🤩", label: "Excited", score: 5 },
  { key: "good", emoji: "🙂", label: "Good", score: 4 },
  { key: "okay", emoji: "😐", label: "Okay", score: 3 },
  { key: "tired", emoji: "😴", label: "Tired", score: 3 },
  { key: "meh", emoji: "😕", label: "Meh", score: 2 },
  { key: "anxious", emoji: "😰", label: "Anxious", score: 2 },
  { key: "sad", emoji: "😢", label: "Sad", score: 1 },
  { key: "angry", emoji: "😡", label: "Angry", score: 1 },
];

export const FACTORS: FactorOption[] = [
  { key: "work", emoji: "💼", label: "Work" },
  { key: "family", emoji: "👨‍👩‍👧", label: "Family" },
  { key: "exercise", emoji: "🏃", label: "Exercise" },
  { key: "sleep", emoji: "🛌", label: "Sleep" },
  { key: "food", emoji: "🍎", label: "Food" },
  { key: "weather", emoji: "🌤️", label: "Weather" },
  { key: "social", emoji: "🫂", label: "Social" },
  { key: "health", emoji: "💊", label: "Health" },
];

export function getMood(key: MoodKey): MoodOption {
  // MOODS is exhaustive over MoodKey, but use a guarded lookup for noUncheckedIndexedAccess
  const found = MOODS.find((m) => m.key === key);
  return found ?? MOODS[3]!; // okay
}

export function getFactor(key: FactorKey): FactorOption {
  const found = FACTORS.find((f) => f.key === key);
  return found ?? FACTORS[0]!;
}

/** Local YYYY-MM-DD (no UTC shift). */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the ISO week containing `d`. */
export function isoWeekStart(d: Date = new Date()): string {
  const x = new Date(d);
  const day = x.getDay(); // 0..6, Sun..Sat
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  x.setDate(x.getDate() + diff);
  return localDateString(x);
}

/** Period of the day for a timestamp string. */
export function timeOfDay(ts: string): "morning" | "afternoon" | "evening" {
  const h = new Date(ts).getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/** Color for a mood (CSS var name). */
export function moodColorVar(key: MoodKey): string {
  const s = getMood(key).score;
  if (s >= 5) return "--mood-great";
  if (s >= 4) return "--mood-good";
  if (s >= 3) return "--mood-okay";
  if (s >= 2) return "--mood-meh";
  return "--mood-bad";
}

/** Average mood score for a set of entries, or null if empty. */
export function avgScore(entries: MoodEntry[]): number | null {
  if (entries.length === 0) return null;
  const total = entries.reduce((s, e) => s + getMood(e.mood).score, 0);
  return total / entries.length;
}

/** Group entries by date string. */
export function groupByDate(entries: MoodEntry[]): Map<string, MoodEntry[]> {
  const m = new Map<string, MoodEntry[]>();
  for (const e of entries) {
    const list = m.get(e.date);
    if (list) list.push(e);
    else m.set(e.date, [e]);
  }
  return m;
}

/** Sort entries by timestamp descending (newest first). */
export function sortByNewest(entries: MoodEntry[]): MoodEntry[] {
  return [...entries].sort((a, b) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
  );
}

/** Get entries within the last N days (inclusive of today). */
export function lastNDays(entries: MoodEntry[], n: number): MoodEntry[] {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (n - 1));
  const cutoffStr = localDateString(cutoff);
  return entries.filter((e) => e.date >= cutoffStr);
}

/** Compute current and longest streak of consecutive days with at least one check-in. */
export function computeStreaks(entries: MoodEntry[]): {
  current: number;
  longest: number;
} {
  if (entries.length === 0) return { current: 0, longest: 0 };

  const dates = new Set(entries.map((e) => e.date));
  const sorted = [...dates].sort();

  // longest run
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const ds of sorted) {
    const d = new Date(`${ds}T00:00:00`);
    if (prev) {
      const diffDays = Math.round(
        (d.getTime() - prev.getTime()) / 86_400_000,
      );
      if (diffDays === 1) run += 1;
      else run = 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  // current streak: walk back from today; allow today to be missing (still counts from yesterday)
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateString(today);
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  let cursor = dates.has(todayStr) ? today : yest;
  while (dates.has(localDateString(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}

export function computeStats(entries: MoodEntry[]): MoodStats {
  const today = localDateString();
  const todays = entries.filter((e) => e.date === today);
  const week = lastNDays(entries, 7);
  const { current, longest } = computeStreaks(entries);
  return {
    todayCount: todays.length,
    todayAvgScore: avgScore(todays),
    weekAvgScore: avgScore(week),
    currentStreak: current,
    longestStreak: longest,
    totalEntries: entries.length,
  };
}

export function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Human label for a date like "Today" / "Yesterday" / "Mon, 12 May". */
export function friendlyDate(dateStr: string): string {
  const today = localDateString();
  if (dateStr === today) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateStr === localDateString(y)) return "Yesterday";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
