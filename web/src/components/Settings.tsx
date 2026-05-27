import { useState } from "react";
import type { MoodStats } from "../lib/types";

interface SettingsProps {
  stats: MoodStats;
  onExport: () => void;
  onClearAll: () => void;
}

export default function Settings({
  stats,
  onExport,
  onClearAll,
}: SettingsProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="display-font text-xl font-bold">More</h2>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          Your history
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {stats.totalEntries} check-in
          {stats.totalEntries === 1 ? "" : "s"} · current streak{" "}
          {stats.currentStreak} day{stats.currentStreak === 1 ? "" : "s"} ·
          longest {stats.longestStreak} day
          {stats.longestStreak === 1 ? "" : "s"}.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold">Export your data</h3>
        <p className="text-xs text-[var(--muted)]">
          Download every check-in and weekly reflection as a JSON file you
          control. Nothing leaves this device until you save it.
        </p>
        <button
          type="button"
          onClick={onExport}
          className="self-start rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Download JSON
        </button>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold">Reminders</h3>
        <p className="text-xs text-[var(--muted)]">
          We don't send push notifications. Instead, the header shows a gentle
          “Check in” nudge whenever you haven't logged today's mood yet.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-[var(--error)] bg-[var(--panel)] p-4">
        <h3 className="text-sm font-semibold text-[var(--error)]">
          Danger zone
        </h3>
        <p className="text-xs text-[var(--muted)]">
          Remove every check-in and reflection from this device. Can't be
          undone — export first if you want a copy.
        </p>
        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="self-start rounded-lg border border-[var(--error)] px-3 py-1.5 text-xs font-semibold text-[var(--error)] transition-colors hover:bg-[var(--error)] hover:text-white"
          >
            Clear all data
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                setConfirmClear(false);
              }}
              className="rounded-lg bg-[var(--error)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Yes, delete everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      <p className="text-[11px] text-[var(--muted)]">
        Mood Tracker · open source on{" "}
        <a
          href="https://github.com/freeappstore-online/mood"
          className="underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
        </a>
        . Part of FreeAppStore.
      </p>
    </div>
  );
}
