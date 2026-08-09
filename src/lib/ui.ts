import type { DerivedState, Status } from "./types";

/**
 * Satu sumber warna untuk seluruh aplikasi.
 *
 * Aturannya: biru hanya untuk aksi (tombol, fokus, elemen yang bisa ditekan).
 * Warna status memakai keluarga lain supaya mata bisa langsung membedakan
 * "ini informasi" dari "ini bisa diklik".
 */
export const STATE_META: Record<
  DerivedState,
  { label: string; dot: string; chip: string; bar: string }
> = {
  selesai: {
    label: "Selesai",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  terlambat: {
    label: "Terlambat",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  },
  segera: {
    label: "Segera",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  "on-track": {
    label: "On-track",
    dot: "bg-slate-300",
    chip: "bg-slate-100 text-slate-600",
    bar: "bg-blue-500",
  },
};

export const STATUS_CHIP: Record<Status, string> = {
  Proses: "bg-slate-100 text-slate-600",
  Terkendala: "bg-orange-50 text-orange-700",
  Selesai: "bg-emerald-50 text-emerald-700",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

// Warna avatar sengaja lembut — penanda orang, bukan penarik perhatian.
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/* ── Kelas yang dipakai berulang ────────────────────────────────────────── */

export const CARD =
  "rounded-card bg-white ring-1 ring-slate-950/5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

export const INPUT =
  "w-full rounded-control bg-white px-3.5 py-2.5 text-[15px] text-slate-900 ring-1 ring-slate-300 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-control bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50";

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-control bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:opacity-50";
