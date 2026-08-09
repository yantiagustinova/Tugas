"use client";

import { useState } from "react";
import { daysUntil, dueLabel, relativeTime } from "@/lib/dates";
import {
  PROGRESS_STEPS,
  STATUS_OPTIONS,
  deriveState,
  type Status,
  type Task,
} from "@/lib/types";
import { CARD, STATE_META, avatarColor, cx, initials } from "@/lib/ui";

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
  const done = state === "selesai";

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
    <article className={cx(CARD, "transition", busy && "opacity-60")}>
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="block w-full rounded-t-card px-4 pt-4 pb-3 text-left transition hover:bg-slate-50/60"
      >
        <div className="flex items-start gap-2.5">
          <span
            className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h3
              className={cx(
                "text-[15px] leading-snug font-semibold tracking-tight text-slate-900",
                done && "text-slate-500 line-through decoration-slate-300",
              )}
            >
              {task.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className={cx(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                    avatarColor(task.ownerName),
                  )}
                >
                  {initials(task.ownerName)}
                </span>
                {task.ownerName}
              </span>

              <span className="text-slate-300">·</span>

              <span
                className={cx(
                  "rounded-md px-1.5 py-0.5 text-xs font-medium",
                  meta.chip,
                )}
              >
                {done ? "Selesai" : dueLabel(task.dueDate, today)}
              </span>

              {task.target && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="truncate text-xs text-slate-500">
                    {task.target}
                  </span>
                </>
              )}
            </div>
          </div>

          <span className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums">
            {task.progress}%
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cx("h-full rounded-full transition-all", meta.bar)}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </button>

      {isOwner && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex gap-1">
            {PROGRESS_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                disabled={busy}
                onClick={() => patch({ progress: step })}
                className={cx(
                  "h-9 flex-1 rounded-lg text-xs font-semibold transition",
                  task.progress === step
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
                )}
              >
                {step}%
              </button>
            ))}
          </div>

          <div className="mt-1.5 flex gap-1">
            {STATUS_OPTIONS.map((option: Status) => (
              <button
                key={option}
                type="button"
                disabled={busy}
                onClick={() => patch({ status: option })}
                className={cx(
                  "h-9 flex-1 rounded-lg text-xs font-semibold transition",
                  task.status === option
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <p className="mt-2.5 text-[11px] text-slate-400" suppressHydrationWarning>
            Diupdate {relativeTime(task.updatedAt)}
          </p>

          {error && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </div>
      )}

      {!isOwner && (
        <p
          className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400"
          suppressHydrationWarning
        >
          Diupdate {relativeTime(task.updatedAt)}
        </p>
      )}
    </article>
  );
}
