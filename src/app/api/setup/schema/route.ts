import { NextResponse } from "next/server";
import { applySchema, guardSetup } from "@/lib/setup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Membuat tabel yang belum ada. Aman dijalankan berulang kali. */
export async function POST(request: Request) {
  const guard = guardSetup(request);
  if (!guard.ok) return guard.response;

  try {
    await applySchema();
    return NextResponse.json({
      ok: true,
      message: "Tabel siap: users, tasks, task_history, reminder_log.",
    });
  } catch (err) {
    console.error("[setup/schema]", err);
    return NextResponse.json(
      { error: `Gagal menyiapkan tabel: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
