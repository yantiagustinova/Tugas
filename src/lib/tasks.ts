import { sql } from "./db";
import type { Status, Task } from "./types";

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
  const rows = await sql<{ id: number }[]>`
    INSERT INTO tasks (user_id, title, target, due_date)
    VALUES (${userId}, ${input.title}, ${input.target}, ${input.dueDate}::date)
    RETURNING id
  `;
  const created = await getTask(rows[0].id);
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

  const rows = await sql<{ id: number }[]>`
    UPDATE tasks SET ${sql(fields)}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows[0] ? getTask(rows[0].id) : null;
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
