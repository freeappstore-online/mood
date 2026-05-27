export type MoodKey =
  | "great"
  | "good"
  | "okay"
  | "meh"
  | "sad"
  | "angry"
  | "anxious"
  | "tired"
  | "excited";

export interface MoodOption {
  key: MoodKey;
  emoji: string;
  label: string;
  /** 1 (bad) – 5 (great); used for heat map + trend */
  score: number;
}

export type FactorKey =
  | "work"
  | "family"
  | "exercise"
  | "sleep"
  | "food"
  | "weather"
  | "social"
  | "health";

export interface FactorOption {
  key: FactorKey;
  emoji: string;
  label: string;
}

export interface MoodEntry {
  id: string;
  /** ISO timestamp the entry was logged at */
  timestamp: string;
  /** YYYY-MM-DD for the local date the entry belongs to */
  date: string;
  mood: MoodKey;
  factors: FactorKey[];
  note: string;
}

export interface WeeklyReflection {
  id: string;
  /** ISO week start date (Monday) YYYY-MM-DD */
  weekStart: string;
  wentWell: string;
  challenging: string;
  nextWeek: string;
  /** ISO timestamp */
  updatedAt: string;
}

export type Tab =
  | "checkin"
  | "calendar"
  | "charts"
  | "insights"
  | "reflect"
  | "settings";

export interface MoodStats {
  todayCount: number;
  todayAvgScore: number | null;
  weekAvgScore: number | null;
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
}
