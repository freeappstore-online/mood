import type { FactorKey, MoodEntry } from "./types";
import { FACTORS, getMood, lastNDays, timeOfDay } from "./mood";

export interface Insight {
  id: string;
  icon: string;
  text: string;
}

/** Compute average score for entries that include `factor`. */
function avgWithFactor(entries: MoodEntry[], factor: FactorKey): number | null {
  const filtered = entries.filter((e) => e.factors.includes(factor));
  if (filtered.length === 0) return null;
  return (
    filtered.reduce((s, e) => s + getMood(e.mood).score, 0) / filtered.length
  );
}

/** Generate up to ~5 human-readable insights from the user's data. */
export function generateInsights(entries: MoodEntry[]): Insight[] {
  const out: Insight[] = [];
  if (entries.length < 3) {
    out.push({
      id: "starter",
      icon: "✨",
      text: "Log a few more check-ins to unlock personalised insights.",
    });
    return out;
  }

  const recent = lastNDays(entries, 30);
  if (recent.length === 0) {
    out.push({
      id: "no-recent",
      icon: "📅",
      text: "No check-ins in the last 30 days — your patterns will appear once you log again.",
    });
    return out;
  }

  const overallAvg =
    recent.reduce((s, e) => s + getMood(e.mood).score, 0) / recent.length;

  // 1) Best / worst factor
  let bestFactor: { key: FactorKey; avg: number; n: number } | null = null;
  let worstFactor: { key: FactorKey; avg: number; n: number } | null = null;
  for (const f of FACTORS) {
    const filtered = recent.filter((e) => e.factors.includes(f.key));
    if (filtered.length < 3) continue;
    const a = avgWithFactor(recent, f.key);
    if (a === null) continue;
    if (!bestFactor || a > bestFactor.avg) {
      bestFactor = { key: f.key, avg: a, n: filtered.length };
    }
    if (!worstFactor || a < worstFactor.avg) {
      worstFactor = { key: f.key, avg: a, n: filtered.length };
    }
  }

  if (bestFactor && bestFactor.avg > overallAvg + 0.3) {
    const f = FACTORS.find((x) => x.key === bestFactor!.key)!;
    out.push({
      id: `best-${bestFactor.key}`,
      icon: f.emoji,
      text: `Your mood improves on days with ${f.label.toLowerCase()}.`,
    });
  }
  if (worstFactor && worstFactor.avg < overallAvg - 0.3) {
    const f = FACTORS.find((x) => x.key === worstFactor!.key)!;
    out.push({
      id: `worst-${worstFactor.key}`,
      icon: f.emoji,
      text: `${f.label} tends to weigh your mood down — worth noticing.`,
    });
  }

  // 2) Best / worst day of week
  const byDow: Array<{ total: number; count: number }> = Array.from(
    { length: 7 },
    () => ({ total: 0, count: 0 }),
  );
  for (const e of recent) {
    const dow = new Date(`${e.date}T00:00:00`).getDay();
    const slot = byDow[dow]!;
    slot.total += getMood(e.mood).score;
    slot.count += 1;
  }
  const dowNames = [
    "Sundays",
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
    "Saturdays",
  ];
  let bestDow = -1;
  let worstDow = -1;
  let bestDowAvg = -Infinity;
  let worstDowAvg = Infinity;
  byDow.forEach((slot, i) => {
    if (slot.count < 2) return;
    const a = slot.total / slot.count;
    if (a > bestDowAvg) {
      bestDowAvg = a;
      bestDow = i;
    }
    if (a < worstDowAvg) {
      worstDowAvg = a;
      worstDow = i;
    }
  });
  if (worstDow >= 0 && worstDowAvg < overallAvg - 0.4) {
    out.push({
      id: `dow-worst-${worstDow}`,
      icon: "📅",
      text: `${dowNames[worstDow]} tend to be your hardest day.`,
    });
  }
  if (bestDow >= 0 && bestDowAvg > overallAvg + 0.4 && bestDow !== worstDow) {
    out.push({
      id: `dow-best-${bestDow}`,
      icon: "🌟",
      text: `${dowNames[bestDow]} are reliably your best day.`,
    });
  }

  // 3) Time of day pattern
  const tod = { morning: { t: 0, n: 0 }, afternoon: { t: 0, n: 0 }, evening: { t: 0, n: 0 } };
  for (const e of recent) {
    const k = timeOfDay(e.timestamp);
    tod[k].t += getMood(e.mood).score;
    tod[k].n += 1;
  }
  const todAvgs = (Object.keys(tod) as Array<keyof typeof tod>)
    .filter((k) => tod[k].n >= 2)
    .map((k) => ({ k, avg: tod[k].t / tod[k].n }));
  if (todAvgs.length >= 2) {
    const sorted = [...todAvgs].sort((a, b) => b.avg - a.avg);
    const top = sorted[0]!;
    const bottom = sorted[sorted.length - 1]!;
    if (top.avg - bottom.avg >= 0.5) {
      out.push({
        id: `tod-${top.k}`,
        icon: top.k === "morning" ? "🌅" : top.k === "afternoon" ? "🌤️" : "🌙",
        text: `You're noticeably happier in the ${top.k} than the ${bottom.k}.`,
      });
    }
  }

  // 4) Streak encouragement
  if (recent.length >= 14) {
    out.push({
      id: "consistent",
      icon: "🎯",
      text: `You've checked in ${recent.length} times in the last 30 days — that's great self-awareness.`,
    });
  }

  return out.slice(0, 6);
}
