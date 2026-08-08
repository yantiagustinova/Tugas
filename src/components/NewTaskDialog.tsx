"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";

type Props = {
  today: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
};

export default function NewTaskDialog({ today, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (title.trim().length < 2) {
      setError("Nama tugas minimal 2 karakter.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), target: target.trim(), dueDate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan tugas.");
        return;
      }
      onCreated(data.task as Task);
      onClose();
    } catch {
      setError("Tidak bisa terhubung. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <h2 className="mb-4 text-lg font-bold text-slate-900">Tugas baru</h2>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Nama tugas
            </span>
            <input
              autoFocus
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="mis. Follow up quotation PT Sejahtera"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Target <span className="font-normal text-slate-400">(opsional)</span>
            </span>
            <input
              value={target}
              maxLength={200}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="mis. 20 pengiriman / Rp 50 juta"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Due date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={inputClass}
            />
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {busy ? "Menyimpan…" : "Simpan tugas"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border-0 bg-white px-3.5 py-3 text-base text-slate-900 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-teal-500";
