"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import type { Task } from "@/lib/types";
import { BTN_PRIMARY, INPUT, cx } from "@/lib/ui";

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

  async function submit() {
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
        body: JSON.stringify({
          title: title.trim(),
          target: target.trim(),
          dueDate,
        }),
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
    <Sheet
      title="Tugas baru"
      description="Tugas otomatis tercatat atas nama kamu."
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={busy || title.trim().length < 2}
            className={cx(BTN_PRIMARY, "flex-1")}
          >
            {busy ? "Menyimpan…" : "Simpan tugas"}
          </button>
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="space-y-4 pb-4"
      >
        <Field label="Nama tugas">
          <input
            autoFocus
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="mis. Follow up quotation PT Sejahtera"
            className={INPUT}
          />
        </Field>

        <Field label="Target" hint="opsional">
          <input
            value={target}
            maxLength={200}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="mis. 20 pengiriman / Rp 50 juta"
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

        {error && (
          <p className="rounded-control bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Sheet>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
