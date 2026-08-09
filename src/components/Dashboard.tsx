"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, { AppHeader, HEADER_BTN } from "./AppShell";
import NewTaskDialog from "./NewTaskDialog";
import TaskCard from "./TaskCard";
import TaskDialog from "./TaskDialog";
import { daysUntil } from "@/lib/dates";
import {
  deriveState,
  type DerivedState,
  type SessionUser,
  type Task,
} from "@/lib/types";
import { CARD, avatarColor, cx, initials } from "@/lib/ui";

type StateFilter = "semua" | DerivedState;
type SortKey = "due" | "updated" | "owner";

const STATE_FILTERS: { key: StateFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "terlambat", label: "Terlambat" },
  { key: "segera", label: "≤ 2 hari" },
  { key: "on-track", label: "On-track" },
  { key: "selesai", label: "Selesai" },
];

const SELECT =
  "appearance-none rounded-control bg-white py-2 pr-8 pl-3 text-sm text-slate-700 ring-1 ring-slate-200 outline-none transition hover:bg-slate-50 focus:ring-2 focus:ring-blue-600";

export default function Dashboard({
  user,
  initialTasks,
  today,
}: {
  user: SessionUser;
  initialTasks: Task[];
  today: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [owner, setOwner] = useState<string>("semua");
  const [stateFilter, setStateFilter] = useState<StateFilter>("semua");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [grouped, setGrouped] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const owners = useMemo(
    () =>
      [...new Set(tasks.map((t) => t.ownerName))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [tasks],
  );

  const counts = useMemo(() => {
    const base: Record<StateFilter, number> = {
      semua: tasks.length,
      selesai: 0,
      terlambat: 0,
      segera: 0,
      "on-track": 0,
    };
    for (const task of tasks) {
      base[deriveState(task, daysUntil(task.dueDate, today))] += 1;
    }
    return base;
  }, [tasks, today]);

  const visible = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (owner === "saya" && task.userId !== user.id) return false;
      if (owner !== "semua" && owner !== "saya" && task.ownerName !== owner) {
        return false;
      }
      if (stateFilter !== "semua") {
        const state = deriveState(task, daysUntil(task.dueDate, today));
        if (state !== stateFilter) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortKey === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      if (sortKey === "owner") {
        return (
          a.ownerName.localeCompare(b.ownerName) ||
          a.dueDate.localeCompare(b.dueDate)
        );
      }
      return a.dueDate.localeCompare(b.dueDate) || a.id - b.id;
    });
  }, [tasks, owner, stateFilter, sortKey, today, user.id]);

  const groups = useMemo(() => {
    if (!grouped) return null;
    const map = new Map<string, Task[]>();
    for (const task of visible) {
      const list = map.get(task.ownerName) ?? [];
      list.push(task);
      map.set(task.ownerName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible, grouped]);

  function upsert(task: Task) {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === task.id);
      if (index === -1) return [...prev, task];
      const next = [...prev];
      next[index] = task;
      return next;
    });
  }

  function removeTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppShell
      contentClassName="pb-28 sm:pb-6"
      header={
        <AppHeader
          title="Task Tracker Envilog"
          subtitle={`Halo, ${user.name}`}
          actions={
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="hidden rounded-control bg-white px-3.5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:inline-flex"
              >
                Tugas baru
              </button>
              <button type="button" onClick={logout} className={HEADER_BTN}>
                Keluar
              </button>
            </div>
          }
        />
      }
    >
      {/* Ringkasan tim — satu baris dipisah garis tipis, bukan empat kotak. */}
      <section className={cx(CARD, "flex divide-x divide-slate-100")}>
        <Stat label="Total" value={counts.semua} />
        <Stat label="Terlambat" value={counts.terlambat} tone="text-rose-600" />
        <Stat label="≤ 2 hari" value={counts.segera} tone="text-amber-600" />
        <Stat label="Selesai" value={counts.selesai} tone="text-emerald-600" />
      </section>

      <div className="mt-5 space-y-2.5">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {STATE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStateFilter(filter.key)}
              className={cx(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                stateFilter === filter.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {filter.label}
              <span
                className={cx(
                  "text-xs tabular-nums",
                  stateFilter === filter.key
                    ? "text-slate-400"
                    : "text-slate-400",
                )}
              >
                {counts[filter.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="relative shrink-0">
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              aria-label="Filter pemilik"
              className={SELECT}
            >
              <option value="semua">Semua orang</option>
              <option value="saya">Tugas saya</option>
              {owners.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Chevron />
          </div>

          <div className="relative shrink-0">
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              aria-label="Urutkan"
              className={SELECT}
            >
              <option value="due">Due date terdekat</option>
              <option value="updated">Terakhir diupdate</option>
              <option value="owner">Nama pemilik</option>
            </select>
            <Chevron />
          </div>

          <button
            type="button"
            onClick={() => setGrouped((value) => !value)}
            className={cx(
              "shrink-0 rounded-control px-3 py-2 text-sm font-medium transition",
              grouped
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            Per orang
          </button>
        </div>
      </div>

      <section className="mt-4">
        {visible.length === 0 ? (
          <div className={cx(CARD, "px-6 py-12 text-center")}>
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {tasks.length === 0 ? "Belum ada tugas" : "Tidak ada yang cocok"}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
              {tasks.length === 0
                ? "Tekan tombol tambah untuk mencatat tugas pertama tim."
                : "Coba ubah filter atau pilih orang lain."}
            </p>
          </div>
        ) : groups ? (
          <div className="space-y-6">
            {groups.map(([ownerName, ownerTasks]) => (
              <div key={ownerName}>
                <div className="mb-2 flex items-center gap-2 px-0.5">
                  <span
                    className={cx(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                      avatarColor(ownerName),
                    )}
                  >
                    {initials(ownerName)}
                  </span>
                  <h2 className="text-sm font-semibold text-slate-800">
                    {ownerName}
                  </h2>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {ownerTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {ownerTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      today={today}
                      isOwner={task.userId === user.id}
                      onChanged={upsert}
                      onEdit={setEditing}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                today={today}
                isOwner={task.userId === user.id}
                onChanged={upsert}
                onEdit={setEditing}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">
        Pengingat WhatsApp dikirim otomatis mulai H-2 sebelum due date.{" "}
        <a
          href="/pengingat"
          className="underline underline-offset-2 hover:text-slate-600"
        >
          Lihat pratinjau
        </a>
      </p>

      <button
        type="button"
        onClick={() => setCreating(true)}
        aria-label="Tambah tugas"
        className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition active:scale-95 sm:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {creating && (
        <NewTaskDialog
          today={today}
          onClose={() => setCreating(false)}
          onCreated={upsert}
        />
      )}

      {editing && (
        <TaskDialog
          task={tasks.find((t) => t.id === editing.id) ?? editing}
          isOwner={editing.userId === user.id}
          onClose={() => setEditing(null)}
          onChanged={upsert}
          onDeleted={removeTask}
        />
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone = "text-slate-900",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="flex-1 px-2 py-3 text-center">
      <p className={cx("text-lg leading-none font-semibold tabular-nums", tone)}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-none text-slate-500">{label}</p>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
    >
      <path
        d="M6 8l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
