"use client";

import { useEffect, useState } from "react";
import TaskHistory from "./TaskHistory";
import { formatDateId } from "@/lib/dates";
import { STATUS_OPTIONS, type Status, type Task } from "@/lib/types";
import { cx } from "@/lib/ui";

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

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isOwner ? "Ubah tugas" : "Detail tugas"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Pemilik: {task.ownerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg px-2.5 py-1.5 text-sm text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>

        {!isOwner ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Nama tugas</dt>
              <dd className="font-medium text-slate-900">{task.title}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Target</dt>
              <dd className="font-medium text-slate-900">{task.target || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Due date</dt>
              <dd className="font-medium text-slate-900">
                {formatDateId(task.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Progress</dt>
              <dd className="font-medium text-slate-900">{task.progress}%</dd>
            </div>
            <div>
              <dt className="text-slate-400">Status terakhir</dt>
              <dd className="font-medium text-slate-900">{task.status}</dd>
            </div>
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              Hanya pemilik tugas yang bisa mengubah data ini.
            </p>
          </dl>
        ) : (
          <div className="space-y-4">
            <Field label="Nama tugas">
              <input
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Target">
              <input
                value={target}
                maxLength={200}
                placeholder="mis. 20 pengiriman / Rp 50 juta"
                onChange={(event) => setTarget(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label={`Progress — ${progress}%`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                className="w-full"
              />
            </Field>

            <Field label="Status terakhir">
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={cx(
                      "h-11 flex-1 rounded-xl text-sm font-semibold transition",
                      status === option
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </Field>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? "Menyimpan…" : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
                disabled={busy}
                className={cx(
                  "rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60",
                  confirmDelete
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50",
                )}
              >
                {confirmDelete ? "Yakin hapus?" : "Hapus"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          <TaskHistory taskId={task.id} />
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border-0 bg-white px-3.5 py-3 text-base text-slate-900 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
