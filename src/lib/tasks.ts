import { sql } from "./db";
import type { Status, Task, TaskHistoryEntry } from "./types";

type TaskRow = {
  id: number;
  user_id: number;
  owner_name: string;
  title: string;
  target: string;
  due_date: string;
  progress: number;
  status: Status;
  created_at: Date;
  updated_at: Date;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    ownerName: row.owner_name,
    title: row.title,
    target: row.target,
    dueDate: row.due_date,
    progress: row.progress,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

// due_date sengaja di-cast ke teks supaya tidak kena pergeseran timezone
// saat driver mengubahnya jadi objek Date.
const taskColumns = () => sql`
  t.id,
  t.user_id,
  u.name AS owner_name,
  t.title,
  t.target,
  to_char(t.due_date, 'YYYY-MM-DD') AS due_date,
  t.progress,
  t.status,
  t.created_at,
  t.updated_at
`;

export async function listTasks(): Promise<Task[]> {
  const rows = await sql<TaskRow[]>`
    SELECT ${taskColumns()}
    FROM tasks t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.due_date ASC, t.id ASC
  `;
  return rows.map(mapTask);
}

export async function getTask(id: number): Promise<Task | null> {
  const rows = await sql<TaskRow[]>`
    SELECT ${taskColumns()}
    FROM tasks t
    JOIN users u ON u.id = t.user_id
    WHERE t.id = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapTask(rows[0]) : null;
}

export async function createTask(
  userId: number,
  input: { title: string; target: string; dueDate: string },
): Promise<Task> {
  // Tugas dan baris riwayat pertamanya ditulis dalam satu transaksi supaya
  // tidak pernah ada tugas tanpa titik awal di timeline.
  const newId = await sql.begin(async (tx) => {
    const rows = await tx<{ id: number }[]>`
      INSERT INTO tasks (user_id, title, target, due_date)
      VALUES (${userId}, ${input.title}, ${input.target}, ${input.dueDate}::date)
      RETURNING id
    `;
    await tx`
      INSERT INTO task_history
        (task_id, user_id, kind, progress_to, status_to, due_date_to)
      VALUES
        (${rows[0].id}, ${userId}, 'dibuat', 0, 'Proses', ${input.dueDate}::date)
    `;
    return rows[0].id;
  });

  const created = await getTask(newId);
  if (!created) throw new Error("Tugas gagal dibuat");
  return created;
}

export type TaskPatch = {
  title?: string;
  target?: string;
  dueDate?: string;
  progress?: number;
  status?: Status;
};

/**
 * Update tugas. Hanya pemilik yang boleh; mengembalikan null kalau tugas
 * tidak ada atau bukan milik user tersebut.
 */
export async function updateTask(
  id: number,
  userId: number,
  patch: TaskPatch,
): Promise<Task | null> {
  const fields: Record<string, unknown> = {};
  if (patch.title !== undefined) fields.title = patch.title;
  if (patch.target !== undefined) fields.target = patch.target;
  if (patch.dueDate !== undefined) fields.due_date = patch.dueDate;
  if (patch.progress !== undefined) fields.progress = patch.progress;
  if (patch.status !== undefined) fields.status = patch.status;
  if (Object.keys(fields).length === 0) return getTask(id);

  fields.updated_at = new Date();

  // Baca-lalu-tulis harus atomik supaya nilai "sebelum" yang tercatat di
  // riwayat benar-benar nilai yang digantikan oleh UPDATE ini.
  const updatedId = await sql.begin(async (tx) => {
    const current = await tx<
      { progress: number; status: Status; due_date: string }[]
    >`
      SELECT progress, status, to_char(due_date, 'YYYY-MM-DD') AS due_date
      FROM tasks
      WHERE id = ${id} AND user_id = ${userId}
      FOR UPDATE
    `;
    const before = current[0];
    if (!before) return null;

    await tx`UPDATE tasks SET ${tx(fields)} WHERE id = ${id}`;

    // Hanya field yang benar-benar berubah nilainya yang dicatat; menyimpan
    // ulang nilai yang sama tidak menghasilkan baris riwayat.
    const progressChanged =
      patch.progress !== undefined && patch.progress !== before.progress;
    const statusChanged =
      patch.status !== undefined && patch.status !== before.status;
    const dueDateChanged =
      patch.dueDate !== undefined && patch.dueDate !== before.due_date;

    if (progressChanged || statusChanged || dueDateChanged) {
      await tx`
        INSERT INTO task_history (
          task_id, user_id, kind,
          progress_from, progress_to,
          status_from, status_to,
          due_date_from, due_date_to
        ) VALUES (
          ${id}, ${userId}, 'update',
          ${progressChanged ? before.progress : null},
          ${progressChanged ? patch.progress! : null},
          ${statusChanged ? before.status : null},
          ${statusChanged ? patch.status! : null},
          ${dueDateChanged ? before.due_date : null}::date,
          ${dueDateChanged ? patch.dueDate! : null}::date
        )
      `;
    }

    return id;
  });

  return updatedId === null ? null : getTask(updatedId);
}

/** Riwayat perubahan satu tugas, terbaru di atas. */
export async function listTaskHistory(
  taskId: number,
): Promise<TaskHistoryEntry[]> {
  const rows = await sql<
    {
      id: number;
      kind: "dibuat" | "update";
      by_name: string;
      progress_from: number | null;
      progress_to: number | null;
      status_from: Status | null;
      status_to: Status | null;
      due_date_from: string | null;
      due_date_to: string | null;
      created_at: Date;
    }[]
  >`
    SELECT
      h.id,
      h.kind,
      u.name AS by_name,
      h.progress_from,
      h.progress_to,
      h.status_from,
      h.status_to,
      to_char(h.due_date_from, 'YYYY-MM-DD') AS due_date_from,
      to_char(h.due_date_to,   'YYYY-MM-DD') AS due_date_to,
      h.created_at
    FROM task_history h
    JOIN users u ON u.id = h.user_id
    WHERE h.task_id = ${taskId}
    ORDER BY h.created_at DESC, h.id DESC
    LIMIT 100
  `;

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    byName: r.by_name,
    progressFrom: r.progress_from,
    progressTo: r.progress_to,
    statusFrom: r.status_from,
    statusTo: r.status_to,
    dueDateFrom: r.due_date_from,
    dueDateTo: r.due_date_to,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function deleteTask(id: number, userId: number): Promise<boolean> {
  const rows = await sql<{ id: number }[]>`
    DELETE FROM tasks WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;
  return rows.length > 0;
}

export type ReminderTask = {
  id: number;
  title: string;
  target: string;
  dueDate: string;
  progress: number;
  status: Status;
  ownerName: string;
  ownerPhone: string;
  userId: number;
};

/** Semua tugas yang belum selesai, lengkap dengan nomor WA pemiliknya. */
export async function listOpenTasksForReminder(): Promise<ReminderTask[]> {
  const rows = await sql<
    {
      id: number;
      title: string;
      target: string;
      due_date: string;
      progress: number;
      status: Status;
      owner_name: string;
      owner_phone: string;
      user_id: number;
    }[]
  >`
    SELECT
      t.id,
      t.title,
      t.target,
      to_char(t.due_date, 'YYYY-MM-DD') AS due_date,
      t.progress,
      t.status,
      u.name  AS owner_name,
      u.phone AS owner_phone,
      t.user_id
    FROM tasks t
    JOIN users u ON u.id = t.user_id
    WHERE u.active
      AND t.progress < 100
      AND t.status <> 'Selesai'
    ORDER BY t.due_date ASC, u.name ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    target: r.target,
    dueDate: r.due_date,
    progress: r.progress,
    status: r.status,
    ownerName: r.owner_name,
    ownerPhone: r.owner_phone,
    userId: r.user_id,
  }));
}
