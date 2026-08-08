import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connect, loadEnv } from "./_env.mjs";

loadEnv();
const sql = connect();

try {
  const schema = readFileSync(resolve(process.cwd(), "db/schema.sql"), "utf8");
  await sql.unsafe(schema);
  console.log("✔ Skema database siap (tabel users, tasks, reminder_log).");
} catch (err) {
  console.error("✖ Gagal menyiapkan skema:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
