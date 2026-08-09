"use client";

import { useEffect, useState } from "react";
import { formatDateId, relativeTime } from "@/lib/dates";
import type { TaskHistoryEntry } from "@/lib/types";
import { cx } from "@/lib/ui";

/** Ubah satu entri riwayat jadi baris-baris kalimat yang enak dibaca. */
function describe(entry: TaskHistoryEntry): string[] {
  if (entry.kind === "dibuat") return ["Tugas dibuat"];

  const lines: string[] = [];
  if (entry.progressFrom !== null || entry.progressTo !== null) {
    lines.push(`Progress ${entry.progressFrom}% → ${entry.progressTo}%`);
  }
  if (entry.statusFrom !== null || entry.statusTo !== null) {
    lines.push(`Status ${entry.statusFrom} → ${entry.statusTo}`);
  }
  if (entry.dueDateFrom !== null || entry.dueDateTo !== null) {
    lines.push(
      `Due date ${formatDateId(entry.dueDateFrom!)} → ${formatDateId(entry.dueDateTo!)}`,
    );
  }
  return lines;
}

export default function TaskHistory({ taskId }: { taskId: number }) {
  const [entries, setEntries] = useState<TaskHistoryEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/tasks/${taskId}/history`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Gagal memuat riwayat.");
          return;
        }
        setEntries(data.history as TaskHistoryEntry[]);
      } catch {
        if (!cancelled) setError("Tidak bisa memuat riwayat.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  return (
    <section className="border-t border-slate-100 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Riwayat perubahan
      </h3>

      {error && <p className="text-sm text-slate-500">{error}</p>}

      {!error && entries === null && (
        <p className="text-sm text-slate-400">Memuat…</p>
      )}

      {!error && entries !== null && entries.length === 0 && (
        <p className="text-sm text-slate-400">
          Belum ada perubahan yang tercatat.
        </p>
      )}

      {!error && entries !== null && entries.length > 0 && (
        <ol className="space-y-0">
          {entries.map((entry, index) => {
            const lines = describe(entry);
            const isLast = index === entries.length - 1;

            return (
              <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={cx(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      entry.kind === "dibuat" ? "bg-slate-300" : "bg-blue-500",
                    )}
                  />
                  {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                </div>

                <div className="min-w-0 flex-1">
                  {lines.map((line) => (
                    <p key={line} className="text-sm text-slate-800">
                      {line}
                    </p>
                  ))}
                  <p
                    className="mt-0.5 text-xs text-slate-400"
                    suppressHydrationWarning
                  >
                    {entry.byName} · {relativeTime(entry.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
