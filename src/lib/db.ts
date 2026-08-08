import postgres from "postgres";

type Sql = postgres.Sql<Record<string, never>>;

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

  const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);
  const hasSslParam = /[?&]sslmode=/.test(connectionString);

  return postgres(connectionString, {
    // Serverless: satu koneksi per invocation, dan matikan prepared statement
    // supaya aman lewat connection pooler (PgBouncer / Supabase pooler).
    max: 1,
    idle_timeout: 20,
    prepare: false,
    ssl: !isLocal && !hasSslParam ? "require" : undefined,
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
