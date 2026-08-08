import { NextResponse } from "next/server";
import { runReminders } from "@/lib/reminder";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Dipanggil harian oleh Vercel Cron (lihat vercel.json).
 * Vercel mengirim header `Authorization: Bearer <CRON_SECRET>` otomatis
 * kalau env CRON_SECRET di-set.
 *
 * - Kirim betulan  : butuh CRON_SECRET (header Bearer atau ?key=).
 * - Dry run (?dry=1): boleh dijalankan anggota tim yang sudah login,
 *   untuk mengecek isi pesan tanpa mengirim apa pun.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";

  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("key") ??
    "";
  const authorized = Boolean(secret) && provided === secret;

  if (!authorized) {
    if (!dryRun) {
      return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
    }
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
    }
  }

  try {
    const report = await runReminders({ dryRun });
    return NextResponse.json(report);
  } catch (err) {
    console.error("[cron/reminder]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Gagal menjalankan pengingat." },
      { status: 500 },
    );
  }
}
