"use client";

import { useState } from "react";
import { daysUntil, dueLabel, formatDateId, relativeTime } from "@/lib/dates";
import {
  PROGRESS_STEPS,
  STATUS_OPTIONS,
  deriveState,
  type Status,
  type Task,
} from "@/lib/types";
import {
  STATE_META,
  STATUS_CHIP,
  avatarColor,
  cx,
  progressBarColor,
} from "@/lib/ui";

type Props = {
  task: Task;
  isOwner: boolean;
  today: string;
  onChanged: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export default function TaskCard({
  task,
  isOwner,
  today,
  onChanged,
  onEdit,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const left = daysUntil(task.dueDate, today);
  const state = deriveState(task, left);
  const meta = STATE_META[state];

  async function patch(body: Partial<Pick<Task, "progress" | "status">>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      onChanged(data.task as Task);
    } catch {
      setError("Tidak bisa terhubung. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={cx(
        "relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition",
        busy && "opacity-60",
      )}
    >
      <span className={cx("absolute inset-y-0 left-0 w-1.5", meta.accent)} />

      <div className="py-4 pr-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base leading-snug font-semibold text-slate-900">
              {task.title}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <span
                className={cx(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                  avatarColor(task.ownerName),
                )}
              >
                {task.ownerName}
              </span>
              {task.target && (
                <span className="truncate">Target: {task.target}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Detail
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              meta.chip,
            )}
          >
            <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {state === "selesai"
              ? `Selesai · ${formatDateId(task.dueDate)}`
              : `${dueLabel(task.dueDate, today)} · ${formatDateId(task.dueDate)}`}
          </span>
          <span
            className={cx(
              "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              STATUS_CHIP[task.status],
            )}
          >
            {task.status}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cx("h-full rounded-full transition-all", progressBarColor(state))}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="w-11 text-right text-sm font-semibold text-slate-700 tabular-nums">
            {task.progress}%
          </span>
        </div>

        <p
          className="mt-2 text-xs text-slate-400"
          suppressHydrationWarning
        >
          Diupdate {relativeTime(task.updatedAt)}
        </p>

        {isOwner && (
          <div className="mt-3.5 space-y-2.5 border-t border-slate-100 pt-3.5">
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs font-medium text-slate-400">
                Progress
              </span>
              <div className="flex flex-1 gap-1.5">
                {PROGRESS_STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    disabled={busy}
                    onClick={() => patch({ progress: step })}
                    className={cx(
                      "h-9 flex-1 rounded-lg text-xs font-semibold transition",
                      task.progress === step
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {step}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs font-medium text-slate-400">
                Status
              </span>
              <div className="flex flex-1 gap-1.5">
                {STATUS_OPTIONS.map((option: Status) => (
                  <button
                    key={option}
                    type="button"
                    disabled={busy}
                    onClick={() => patch({ status: option })}
                    className={cx(
                      "h-9 flex-1 rounded-lg text-xs font-semibold transition",
                      task.status === option
                        ? "bg-slate-800 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
