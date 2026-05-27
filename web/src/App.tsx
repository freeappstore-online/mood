import { useCallback, useMemo, useState } from "react";
import type { MoodEntry, Tab, WeeklyReflection } from "./lib/types";
import {
  exportAllData,
  loadEntries,
  loadReflections,
  saveEntries,
  saveReflections,
} from "./lib/storage";
import { computeStats, localDateString } from "./lib/mood";
import CheckIn from "./components/CheckIn";
import CalendarView from "./components/CalendarView";
import Charts from "./components/Charts";
import Insights from "./components/Insights";
import Reflect from "./components/Reflect";
import Settings from "./components/Settings";

export default function App() {
  const [entries, setEntries] = useState<MoodEntry[]>(loadEntries);
  const [reflections, setReflections] =
    useState<WeeklyReflection[]>(loadReflections);
  const [tab, setTab] = useState<Tab>("checkin");

  const stats = useMemo(() => computeStats(entries), [entries]);

  const handleAddEntry = useCallback((entry: MoodEntry) => {
    setEntries((prev) => {
      const next = [...prev, entry];
      saveEntries(next);
      return next;
    });
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveEntries(next);
      return next;
    });
  }, []);

  const handleSaveReflection = useCallback((r: WeeklyReflection) => {
    setReflections((prev) => {
      const idx = prev.findIndex((x) => x.weekStart === r.weekStart);
      const next =
        idx >= 0 ? prev.map((x, i) => (i === idx ? r : x)) : [...prev, r];
      saveReflections(next);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const data = exportAllData(entries, reflections);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mood-tracker-${localDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [entries, reflections]);

  const handleClearAll = useCallback(() => {
    setEntries([]);
    setReflections([]);
    saveEntries([]);
    saveReflections([]);
  }, []);

  const checkedInToday = stats.todayCount > 0;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "checkin", label: "Today", icon: "smile" },
    { key: "calendar", label: "Cal", icon: "calendar" },
    { key: "charts", label: "Charts", icon: "chart" },
    { key: "insights", label: "Insights", icon: "spark" },
    { key: "reflect", label: "Reflect", icon: "book" },
    { key: "settings", label: "More", icon: "more" },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--glass)] px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌈</span>
            <h1 className="display-font text-lg font-bold">Mood Tracker</h1>
          </div>
          {!checkedInToday && tab !== "checkin" && (
            <button
              onClick={() => setTab("checkin")}
              className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Check in
            </button>
          )}
          {checkedInToday && (
            <span className="text-[11px] font-semibold text-[var(--success)]">
              ✓ Today
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
        {tab === "checkin" && (
          <CheckIn
            entries={entries}
            stats={stats}
            onAdd={handleAddEntry}
            onDelete={handleDeleteEntry}
          />
        )}
        {tab === "calendar" && (
          <CalendarView entries={entries} onDelete={handleDeleteEntry} />
        )}
        {tab === "charts" && <Charts entries={entries} />}
        {tab === "insights" && <Insights entries={entries} stats={stats} />}
        {tab === "reflect" && (
          <Reflect
            entries={entries}
            reflections={reflections}
            onSave={handleSaveReflection}
          />
        )}
        {tab === "settings" && (
          <Settings
            stats={stats}
            onExport={handleExport}
            onClearAll={handleClearAll}
          />
        )}
      </main>

      {/* Bottom nav dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--line)] bg-[var(--dock)]">
        <div className="mx-auto flex max-w-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
              style={{
                color: tab === t.key ? "var(--accent)" : "var(--muted)",
              }}
            >
              <TabIcon name={t.icon} active={tab === t.key} />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const strokeWidth = active ? 2.5 : 2;
  const color = active ? "var(--accent)" : "var(--muted)";

  switch (name) {
    case "smile":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "calendar":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "chart":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "spark":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="m16.24 7.76 2.83-2.83" />
        </svg>
      );
    case "book":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "more":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      );
    default:
      return null;
  }
}
