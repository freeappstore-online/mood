import type { MoodEntry, WeeklyReflection } from "./types";

const ENTRIES_KEY = "mood-tracker-entries";
const REFLECTIONS_KEY = "mood-tracker-reflections";

export function loadEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MoodEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: MoodEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function loadReflections(): WeeklyReflection[] {
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeeklyReflection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReflections(reflections: WeeklyReflection[]): void {
  localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections));
}

export function exportAllData(
  entries: MoodEntry[],
  reflections: WeeklyReflection[],
): string {
  return JSON.stringify(
    {
      app: "freemoodapp",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
      reflections,
    },
    null,
    2,
  );
}
