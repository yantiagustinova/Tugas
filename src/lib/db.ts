import postgres from "postgres";

type Sql = postgres.Sql<Record<string, never>>;

/**
 * postgres.js TIDAK membaca `sslmode=` dari connection string — kalau opsi
 * `ssl` dibiarkan kosong, koneksi dibuka tanpa TLS walaupun URL-nya menulis
 * `?sslmode=require`. Penyedia terkelola (Vercel Postgres, Neon, Supabase)
 * menolak koneksi non-TLS, jadi TLS ditentukan di sini, bukan diserahkan
 * ke URL.
 */
export function sslSetting(url: string): "require" | false {
  if (/[?&]sslmode=disable(&|$)/.test(url)) return false;
  if (/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url)) return false;
  return "require";
}

function createClient(): Sql {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum di-set. Isi connection string PostgreSQL di .env.local (lihat .env.example).",
    );
  }

  return postgres(connectionString, {
    // Serverless: satu koneksi per invocation, dan matikan prepared statement
    // supaya aman lewat connection pooler (PgBouncer / Supabase pooler).
    max: 1,
    idle_timeout: 20,
    prepare: false,
    ssl: sslSetting(connectionString),
  });
}

// Di dev, Next.js me-reload modul berkali-kali. Simpan client di globalThis
// supaya tidak membuka koneksi baru terus-menerus.
const globalForDb = globalThis as unknown as { __envilogSql?: Sql };

function client(): Sql {
  if (!globalForDb.__envilogSql) {
    globalForDb.__envilogSql = createClient();
  }
  return globalForDb.__envilogSql;
}

/**
 * Koneksi dibuat saat query pertama, bukan saat modul di-import — supaya
 * `next build` tidak gagal hanya karena env database belum tersedia.
 */
export const sql: Sql = new Proxy(function () {} as unknown as Sql, {
  apply(_target, _thisArg, args: unknown[]) {
    return (client() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    const active = client() as unknown as Record<string | symbol, unknown>;
    const value = active[prop];
    return typeof value === "function" ? value.bind(active) : value;
  },
}) as Sql;
