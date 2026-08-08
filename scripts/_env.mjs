import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

/** Loader .env sederhana supaya script bisa jalan tanpa dependensi tambahan. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    let raw;
    try {
      raw = readFileSync(resolve(process.cwd(), file), "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function connect() {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    console.error(
      "DATABASE_URL belum di-set. Salin .env.example menjadi .env.local lalu isi connection string PostgreSQL.",
    );
    process.exit(1);
  }

  const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
  const hasSslParam = /[?&]sslmode=/.test(url);

  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: !isLocal && !hasSslParam ? "require" : undefined,
  });
}
