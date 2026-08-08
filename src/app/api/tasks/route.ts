import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createTask, listTasks } from "@/lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  return NextResponse.json({ tasks: await listTasks() });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const body = payload as { title?: unknown; target?: unknown; dueDate?: unknown };
  const title = String(body.title ?? "").trim();
  const target = String(body.target ?? "").trim();
  const dueDate = String(body.dueDate ?? "").trim();

  if (title.length < 2 || title.length > 120) {
    return NextResponse.json(
      { error: "Nama tugas 2–120 karakter." },
      { status: 400 },
    );
  }
  if (target.length > 200) {
    return NextResponse.json({ error: "Target maksimal 200 karakter." }, { status: 400 });
  }
  if (!YMD.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`))) {
    return NextResponse.json({ error: "Due date tidak valid." }, { status: 400 });
  }

  const task = await createTask(user.id, { title, target, dueDate });
  return NextResponse.json({ task }, { status: 201 });
}
