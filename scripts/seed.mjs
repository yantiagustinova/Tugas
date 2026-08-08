import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { connect, loadEnv } from "./_env.mjs";

loadEnv();

const resetPin = process.argv.includes("--reset-pin");
const file = resolve(process.cwd(), "seed/team.json");

let team;
try {
  team = JSON.parse(readFileSync(file, "utf8"));
} catch {
  console.error(
    "✖ seed/team.json tidak ditemukan atau tidak valid.\n" +
      "  Salin seed/team.example.json menjadi seed/team.json lalu isi anggota tim.",
  );
  process.exit(1);
}

if (!Array.isArray(team) || team.length === 0) {
  console.error("✖ seed/team.json harus berisi array anggota tim.");
  process.exit(1);
}

const sql = connect();

try {
  for (const member of team) {
    const name = String(member.name ?? "").trim();
    const phone = String(member.phone ?? "").trim();
    const pin = String(member.pin ?? "").trim();

    if (!name) {
      console.warn("… dilewati: ada entri tanpa nama.");
      continue;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      console.warn(`… dilewati "${name}": PIN harus 4–8 angka.`);
      continue;
    }

    const hash = await bcrypt.hash(pin, 10);
    const rows = await sql`
      INSERT INTO users (name, phone, pin_hash, active)
      VALUES (${name}, ${phone}, ${hash}, TRUE)
      ON CONFLICT (name) DO UPDATE SET
        phone    = EXCLUDED.phone,
        active   = TRUE,
        pin_hash = CASE WHEN ${resetPin}::boolean THEN EXCLUDED.pin_hash ELSE users.pin_hash END
      RETURNING id, (xmax = 0) AS inserted
    `;
    const inserted = rows[0].inserted;
    console.log(
      `✔ ${name} — ${inserted ? "ditambahkan" : resetPin ? "diupdate + PIN direset" : "diupdate (PIN tetap)"}`,
    );
  }
  console.log("\nSelesai. Jalankan `npm run dev` lalu login pakai nama + PIN.");
} catch (err) {
  console.error("✖ Gagal seed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
