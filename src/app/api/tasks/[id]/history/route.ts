import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getTask, listTaskHistory } from "@/lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Riwayat perubahan satu tugas. Bisa dibaca semua anggota tim — dashboard
 * memang transparan; yang dibatasi hanya siapa yang boleh mengubah.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID tugas tidak valid." }, { status: 400 });
  }

  if (!(await getTask(id))) {
    return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ history: await listTaskHistory(id) });
}
