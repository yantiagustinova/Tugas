export const STATUS_OPTIONS = ["Proses", "Terkendala", "Selesai"] as const;
export type Status = (typeof STATUS_OPTIONS)[number];

export const PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;

export type TeamMember = {
  id: number;
  name: string;
};

export type SessionUser = {
  id: number;
  name: string;
};

export type Task = {
  id: number;
  userId: number;
  ownerName: string;
  title: string;
  target: string;
  dueDate: string; // YYYY-MM-DD
  progress: number; // 0..100
  status: Status;
  createdAt: string;
  updatedAt: string;
};

/** Status turunan yang dipakai untuk filter & warna di dashboard. */
export type DerivedState = "selesai" | "terlambat" | "segera" | "on-track";

export function isDone(task: Pick<Task, "progress" | "status">): boolean {
  return task.progress >= 100 || task.status === "Selesai";
}

export function deriveState(
  task: Pick<Task, "progress" | "status" | "dueDate">,
  daysLeft: number,
): DerivedState {
  if (isDone(task)) return "selesai";
  if (daysLeft < 0) return "terlambat";
  if (daysLeft <= 2) return "segera";
  return "on-track";
}

export function isStatus(value: unknown): value is Status {
  return STATUS_OPTIONS.includes(value as Status);
}
