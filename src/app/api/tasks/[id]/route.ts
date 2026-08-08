import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { deleteTask, getTask, updateTask, type TaskPatch } from "@/lib/tasks";
import { isStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID tugas tidak valid." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const patch: TaskPatch = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2 || title.length > 120) {
      return NextResponse.json({ error: "Nama tugas 2–120 karakter." }, { status: 400 });
    }
    patch.title = title;
  }

  if (body.target !== undefined) {
    const target = String(body.target).trim();
    if (target.length > 200) {
      return NextResponse.json({ error: "Target maksimal 200 karakter." }, { status: 400 });
    }
    patch.target = target;
  }

  if (body.dueDate !== undefined) {
    const dueDate = String(body.dueDate).trim();
    if (!YMD.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`))) {
      return NextResponse.json({ error: "Due date tidak valid." }, { status: 400 });
    }
    patch.dueDate = dueDate;
  }

  if (body.progress !== undefined) {
    const progress = Number(body.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "Progress harus 0–100." }, { status: 400 });
    }
    patch.progress = Math.round(progress);
  }

  if (body.status !== undefined) {
    if (!isStatus(body.status)) {
      return NextResponse.json({ error: "Status tidak dikenal." }, { status: 400 });
    }
    patch.status = body.status;
  }

  // Sinkronkan dua field yang saling terkait supaya staf cukup satu tap:
  // geser ke 100% otomatis jadi "Selesai", pilih "Selesai" otomatis jadi 100%.
  if (patch.progress === 100 && patch.status === undefined) patch.status = "Selesai";
  if (patch.status === "Selesai" && patch.progress === undefined) patch.progress = 100;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada yang diubah." }, { status: 400 });
  }

  const updated = await updateTask(id, user.id, patch);
  if (!updated) {
    const exists = await getTask(id);
    return NextResponse.json(
      {
        error: exists
          ? "Tugas ini milik orang lain — hanya pemiliknya yang bisa update."
          : "Tugas tidak ditemukan.",
      },
      { status: exists ? 403 : 404 },
    );
  }

  return NextResponse.json({ task: updated });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID tugas tidak valid." }, { status: 400 });
  }

  const removed = await deleteTask(id, user.id);
  if (!removed) {
    const exists = await getTask(id);
    return NextResponse.json(
      {
        error: exists
          ? "Tugas ini milik orang lain."
          : "Tugas tidak ditemukan.",
      },
      { status: exists ? 403 : 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
