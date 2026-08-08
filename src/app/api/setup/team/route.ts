import { NextResponse } from "next/server";
import { guardSetup, listMembers, upsertMember } from "@/lib/setup";
import { normalizePhone } from "@/lib/wa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daftar anggota tim. Tidak pernah mengembalikan PIN maupun hash-nya. */
export async function GET(request: Request) {
  const guard = guardSetup(request);
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json({ members: await listMembers() });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Gagal membaca daftar anggota. Tabel mungkin belum dibuat — jalankan langkah 1 dulu.",
        detail: (err as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = guardSetup(request);
  if (!guard.ok) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const body = payload as {
    name?: unknown;
    phone?: unknown;
    pin?: unknown;
    active?: unknown;
  };

  const name = String(body.name ?? "").trim();
  const phone = normalizePhone(String(body.phone ?? ""));
  const pin = String(body.pin ?? "").trim();
  const active = body.active === undefined ? true : Boolean(body.active);

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Nama 2–60 karakter." }, { status: 400 });
  }
  if (pin && !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN harus 4–8 angka." }, { status: 400 });
  }
  if (phone && !/^62\d{7,15}$/.test(phone)) {
    return NextResponse.json(
      { error: "Nomor WA tidak valid. Contoh: 081234567890." },
      { status: 400 },
    );
  }

  try {
    const result = await upsertMember({ name, phone, pin: pin || undefined, active });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
