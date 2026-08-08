import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SCHEMA_SQL } from "../../db/schema.mjs";
import { sql } from "./db";

/**
 * Jalur setup lewat browser, untuk yang tidak bisa menjalankan script CLI.
 *
 * Seluruh endpoint di sini mati total kalau env SETUP_SECRET tidak di-set —
 * jadi setelah tim selesai didaftarkan, hapus env-nya dan pintu ini tertutup
 * tanpa perlu deploy ulang kode.
 */

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;
let attempts = { count: 0, until: 0 };

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type SetupGuard = { ok: true } | { ok: false; response: NextResponse };

export function guardSetup(request: Request): SetupGuard {
  const secret = process.env.SETUP_SECRET;

  // Tanpa SETUP_SECRET, halaman ini berpura-pura tidak ada.
  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Setup lewat browser tidak aktif (SETUP_SECRET belum di-set)." },
        { status: 404 },
      ),
    };
  }

  if (Date.now() > attempts.until) attempts = { count: 0, until: 0 };
  if (attempts.count >= MAX_ATTEMPTS) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi 10 menit lagi." },
        { status: 429 },
      ),
    };
  }

  const provided =
    request.headers.get("x-setup-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!safeEqual(provided, secret)) {
    if (attempts.count === 0) attempts.until = Date.now() + WINDOW_MS;
    attempts.count += 1;
    return {
      ok: false,
      response: NextResponse.json({ error: "Kunci setup salah." }, { status: 401 }),
    };
  }

  attempts = { count: 0, until: 0 };
  return { ok: true };
}

export async function applySchema(): Promise<void> {
  await sql.unsafe(SCHEMA_SQL);
}

export type Member = {
  id: number;
  name: string;
  phone: string;
  active: boolean;
  taskCount: number;
};

export async function listMembers(): Promise<Member[]> {
  const rows = await sql<
    { id: number; name: string; phone: string; active: boolean; task_count: string }[]
  >`
    SELECT
      u.id,
      u.name,
      u.phone,
      u.active,
      COUNT(t.id) AS task_count
    FROM users u
    LEFT JOIN tasks t ON t.user_id = u.id
    GROUP BY u.id
    ORDER BY u.name
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    active: r.active,
    taskCount: Number(r.task_count),
  }));
}

export type UpsertResult = { name: string; created: boolean; pinChanged: boolean };

/**
 * Tambah anggota baru atau perbarui yang sudah ada.
 * PIN hanya ditimpa kalau memang diisi — jadi menyunting nomor WA tidak
 * diam-diam mengganti PIN orang.
 */
export async function upsertMember(input: {
  name: string;
  phone: string;
  pin?: string;
  active?: boolean;
}): Promise<UpsertResult> {
  const active = input.active ?? true;
  const pin = input.pin?.trim() ?? "";

  if (pin) {
    const hash = await bcrypt.hash(pin, 10);
    const rows = await sql<{ inserted: boolean }[]>`
      INSERT INTO users (name, phone, pin_hash, active)
      VALUES (${input.name}, ${input.phone}, ${hash}, ${active})
      ON CONFLICT (name) DO UPDATE SET
        phone    = EXCLUDED.phone,
        pin_hash = EXCLUDED.pin_hash,
        active   = EXCLUDED.active
      RETURNING (xmax = 0) AS inserted
    `;
    return { name: input.name, created: rows[0].inserted, pinChanged: true };
  }

  const rows = await sql<{ id: number }[]>`
    UPDATE users
    SET phone = ${input.phone}, active = ${active}
    WHERE name = ${input.name}
    RETURNING id
  `;
  if (rows.length === 0) {
    throw new Error("Anggota baru wajib diberi PIN.");
  }
  return { name: input.name, created: false, pinChanged: false };
}
