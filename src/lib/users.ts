import bcrypt from "bcryptjs";
import { sql } from "./db";
import type { SessionUser, TeamMember } from "./types";

/** Daftar nama untuk dropdown login. Tidak pernah mengembalikan PIN. */
export async function listTeam(): Promise<TeamMember[]> {
  const rows = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM users WHERE active ORDER BY name
  `;
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function verifyPin(
  userId: number,
  pin: string,
): Promise<SessionUser | null> {
  const rows = await sql<{ id: number; name: string; pin_hash: string }[]>`
    SELECT id, name, pin_hash FROM users WHERE id = ${userId} AND active LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const ok = await bcrypt.compare(pin, row.pin_hash);
  return ok ? { id: row.id, name: row.name } : null;
}

export async function changePin(userId: number, newPin: string): Promise<void> {
  const hash = await bcrypt.hash(newPin, 10);
  await sql`UPDATE users SET pin_hash = ${hash} WHERE id = ${userId}`;
}
