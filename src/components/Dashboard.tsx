"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, { AppHeader, headerButtonClass } from "./AppShell";
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
import { avatarColor, cx, initials } from "@/lib/ui";

type StateFilter = "semua" | DerivedState;
type SortKey = "due" | "updated" | "owner";

const STATE_FILTERS: { key: StateFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "terlambat", label: "Terlambat" },
  { key: "segera", label: "≤ 2 hari" },
  { key: "on-track", label: "On-track" },
  { key: "selesai", label: "Selesai" },
];

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
    () => [...new Set(tasks.map((t) => t.ownerName))].sort((a, b) => a.localeCompare(b)),
    [tasks],
  );

  const stats = useMemo(() => {
    let selesai = 0;
    let terlambat = 0;
    let segera = 0;
    for (const task of tasks) {
      const state = deriveState(task, daysUntil(task.dueDate, today));
      if (state === "selesai") selesai += 1;
      else if (state === "terlambat") terlambat += 1;
      else if (state === "segera") segera += 1;
    }
    return { total: tasks.length, selesai, terlambat, segera };
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
      if (sortKey === "updated") {
        return b.updatedAt.localeCompare(a.updatedAt);
      }
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
      contentClassName="pb-24 sm:pb-6"
      header={
        <AppHeader
          title="Task Tracker Envilog"
          subtitle={`Halo, ${user.name}`}
          actions={
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="hidden rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:block"
              >
                + Tugas
              </button>
              <button
                type="button"
                onClick={logout}
                className={headerButtonClass}
              >
                Keluar
              </button>
            </div>
          }
        />
      }
    >
      <div>
        <section className="grid grid-cols-4 gap-2">
          <Stat label="Total" value={stats.total} tone="slate" />
          <Stat label="Terlambat" value={stats.terlambat} tone="rose" />
          <Stat label="≤ 2 hari" value={stats.segera} tone="amber" />
          <Stat label="Selesai" value={stats.selesai} tone="emerald" />
        </section>

        <section className="mt-4 space-y-2.5">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:-mx-6 sm:px-6">
            {STATE_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStateFilter(filter.key)}
                className={cx(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  stateFilter === filter.key
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              aria-label="Filter pemilik"
              className="rounded-xl border-0 bg-white py-2 pr-8 pl-3 text-sm text-slate-700 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua orang</option>
              <option value="saya">Tugas saya</option>
              {owners.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              aria-label="Urutkan"
              className="rounded-xl border-0 bg-white py-2 pr-8 pl-3 text-sm text-slate-700 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="due">Due date terdekat</option>
              <option value="updated">Terakhir diupdate</option>
              <option value="owner">Nama pemilik</option>
            </select>

            <button
              type="button"
              onClick={() => setGrouped((value) => !value)}
              className={cx(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                grouped
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              Per orang
            </button>

            <span className="ml-auto text-sm text-slate-400">
              {visible.length} tugas
            </span>
          </div>
        </section>

        <section className="mt-4">
          {visible.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                {tasks.length === 0
                  ? "Belum ada tugas. Tekan tombol + untuk menambah tugas pertama."
                  : "Tidak ada tugas yang cocok dengan filter ini."}
              </p>
            </div>
          ) : groups ? (
            <div className="space-y-6">
              {groups.map(([ownerName, ownerTasks]) => (
                <div key={ownerName}>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cx(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                        avatarColor(ownerName),
                      )}
                    >
                      {initials(ownerName)}
                    </span>
                    <h2 className="text-sm font-semibold text-slate-700">
                      {ownerName}
                    </h2>
                    <span className="text-xs text-slate-400">
                      {ownerTasks.length} tugas
                    </span>
                  </div>
                  <div className="space-y-2.5">
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
            <div className="space-y-2.5">
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
          <a href="/pengingat" className="underline hover:text-slate-600">
            Lihat pratinjau pesan
          </a>
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        aria-label="Tambah tugas"
        className="fixed right-5 bottom-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl leading-none text-white shadow-lg transition hover:bg-blue-700 active:scale-95 sm:hidden"
      >
        +
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

const TONE: Record<string, string> = {
  slate: "text-slate-900",
  rose: "text-rose-600",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE;
}) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5 text-center ring-1 ring-slate-200">
      <p className={cx("text-xl font-bold tabular-nums", TONE[tone])}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{label}</p>
    </div>
  );
}
