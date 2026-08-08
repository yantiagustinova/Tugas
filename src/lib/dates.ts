// Dipakai juga di client component, jadi akses process dibuat aman.
export const TZ =
  (typeof process !== "undefined" && process.env.APP_TIMEZONE) || "Asia/Jakarta";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Tanggal hari ini menurut zona waktu tim (default Asia/Jakarta), format YYYY-MM-DD. */
export function todayYmd(now: Date = new Date()): string {
  return ymdFormatter.format(now);
}

/** Ubah nilai tanggal apa pun (Date dari driver / string) menjadi YYYY-MM-DD. */
export function toYmd(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return ymdFormatter.format(value);
}

/**
 * Selisih hari kalender: due - today.
 * 2 = jatuh tempo 2 hari lagi, 0 = hari ini, -1 = telat 1 hari.
 */
export function daysUntil(due: string, today: string = todayYmd()): number {
  const a = Date.parse(`${toYmd(due)}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

const LONG_ID = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "2026-08-10" -> "10 Agu 2026" */
export function formatDateId(due: string): string {
  const ts = Date.parse(`${toYmd(due)}T00:00:00Z`);
  if (Number.isNaN(ts)) return due;
  return LONG_ID.format(new Date(ts));
}

/** Label relatif yang enak dibaca di kartu tugas. */
export function dueLabel(due: string, today: string = todayYmd()): string {
  const d = daysUntil(due, today);
  if (d === 0) return "Jatuh tempo hari ini";
  if (d === 1) return "Besok";
  if (d > 1) return `${d} hari lagi`;
  if (d === -1) return "Telat 1 hari";
  return `Telat ${Math.abs(d)} hari`;
}

/** "2 jam lalu" untuk kolom terakhir diupdate. */
export function relativeTime(value: string | Date): string {
  const ts = typeof value === "string" ? Date.parse(value) : value.getTime();
  if (Number.isNaN(ts)) return "-";
  const diffMin = Math.round((Date.now() - ts) / 60_000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return formatDateId(toYmd(new Date(ts)));
}
