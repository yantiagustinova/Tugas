import { NextResponse } from "next/server";
import { issueSession } from "@/lib/session";
import { verifyPin } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Throttle sederhana untuk menahan tebak-tebakan PIN. Karena serverless,
// state ini per-instance — cukup untuk tim kecil, bukan proteksi kelas berat.
const MAX_ATTEMPTS = 6;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<number, { count: number; until: number }>();

function tooManyAttempts(userId: number): boolean {
  const entry = attempts.get(userId);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    attempts.delete(userId);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(userId: number): void {
  const entry = attempts.get(userId);
  if (!entry || Date.now() > entry.until) {
    attempts.set(userId, { count: 1, until: Date.now() + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const body = payload as { userId?: unknown; pin?: unknown };
  const userId = Number(body.userId);
  const pin = String(body.pin ?? "");

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Pilih nama dulu ya." }, { status: 400 });
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN terdiri dari 4–8 angka." }, { status: 400 });
  }
  if (tooManyAttempts(userId)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi 10 menit lagi." },
      { status: 429 },
    );
  }

  const user = await verifyPin(userId, pin);
  if (!user) {
    recordFailure(userId);
    return NextResponse.json({ error: "PIN salah." }, { status: 401 });
  }

  attempts.delete(userId);
  await issueSession(user);
  return NextResponse.json({ ok: true, user });
}
