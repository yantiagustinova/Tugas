import bcrypt from "bcryptjs";
import { connect, loadEnv } from "./_env.mjs";

loadEnv();

const [name, pin] = process.argv.slice(2);

if (!name || !/^\d{4,8}$/.test(pin ?? "")) {
  console.error('Cara pakai: npm run team:pin -- "Nama Lengkap" 1234');
  process.exit(1);
}

const sql = connect();

try {
  const hash = await bcrypt.hash(pin, 10);
  const rows = await sql`
    UPDATE users SET pin_hash = ${hash} WHERE name = ${name} RETURNING id
  `;
  if (rows.length === 0) {
    console.error(`✖ Tidak ada anggota bernama "${name}".`);
    process.exitCode = 1;
  } else {
    console.log(`✔ PIN untuk ${name} sudah direset.`);
  }
} catch (err) {
  console.error("✖ Gagal reset PIN:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
