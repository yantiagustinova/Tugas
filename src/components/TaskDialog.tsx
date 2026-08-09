"use client";

import { useState } from "react";
import { Field } from "./NewTaskDialog";
import Sheet from "./Sheet";
import TaskHistory from "./TaskHistory";
import { formatDateId } from "@/lib/dates";
import { STATUS_OPTIONS, type Status, type Task } from "@/lib/types";
import { BTN_PRIMARY, INPUT, cx } from "@/lib/ui";

type Props = {
  task: Task;
  isOwner: boolean;
  onClose: () => void;
  onChanged: (task: Task) => void;
  onDeleted: (id: number) => void;
};

export default function TaskDialog({
  task,
  isOwner,
  onClose,
  onChanged,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [target, setTarget] = useState(task.target);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState<Status>(task.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, target, dueDate, progress, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      onChanged(data.task as Task);
      onClose();
    } catch {
      setError("Tidak bisa terhubung. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menghapus.");
        return;
      }
      onDeleted(task.id);
      onClose();
    } catch {
      setError("Tidak bisa terhubung. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={isOwner ? "Ubah tugas" : "Detail tugas"}
      description={`Pemilik: ${task.ownerName}`}
      onClose={onClose}
      footer={
        isOwner ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className={cx(BTN_PRIMARY, "flex-1")}
            >
              {busy ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
              disabled={busy}
              className={cx(
                "rounded-control px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
                confirmDelete
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50",
              )}
            >
              {confirmDelete ? "Yakin hapus?" : "Hapus"}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-5 pb-4">
        {!isOwner ? (
          <>
            <dl className="divide-y divide-slate-100 overflow-hidden rounded-card ring-1 ring-slate-200">
              <Row label="Nama tugas" value={task.title} />
              <Row label="Target" value={task.target || "—"} />
              <Row label="Due date" value={formatDateId(task.dueDate)} />
              <Row label="Progress" value={`${task.progress}%`} />
              <Row label="Status terakhir" value={task.status} />
            </dl>
            <p className="rounded-control bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              Hanya pemilik tugas yang bisa mengubah data ini.
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <Field label="Nama tugas">
              <input
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                className={INPUT}
              />
            </Field>

            <Field label="Target" hint="opsional">
              <input
                value={target}
                maxLength={200}
                placeholder="mis. 20 pengiriman / Rp 50 juta"
                onChange={(event) => setTarget(event.target.value)}
                className={INPUT}
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={INPUT}
              />
            </Field>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Progress
                </span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {progress}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                className="w-full"
                aria-label="Progress"
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Status terakhir
              </span>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={cx(
                      "h-10 flex-1 rounded-control text-sm font-semibold transition",
                      status === option
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-control bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                {error}
              </p>
            )}
          </div>
        )}

        <TaskHistory taskId={task.id} />
      </div>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
