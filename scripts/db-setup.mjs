import { SCHEMA_SQL } from "../db/schema.mjs";
import { connect, loadEnv } from "./_env.mjs";

loadEnv();
const sql = connect();

try {
  await sql.unsafe(SCHEMA_SQL);
  console.log(
    "✔ Skema database siap (tabel users, tasks, task_history, reminder_log).",
  );
} catch (err) {
  console.error("✖ Gagal menyiapkan skema:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
