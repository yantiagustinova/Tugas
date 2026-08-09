import type { DerivedState, Status } from "./types";

export const STATE_META: Record<
  DerivedState,
  { label: string; accent: string; chip: string; dot: string }
> = {
  selesai: {
    label: "Selesai",
    accent: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  terlambat: {
    label: "Terlambat",
    accent: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
  segera: {
    label: "Segera",
    accent: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  "on-track": {
    label: "On-track",
    accent: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
};

export const STATUS_CHIP: Record<Status, string> = {
  Proses: "bg-sky-50 text-sky-700 ring-sky-200",
  Terkendala: "bg-orange-50 text-orange-700 ring-orange-200",
  Selesai: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function progressBarColor(state: DerivedState): string {
  if (state === "selesai") return "bg-emerald-500";
  if (state === "terlambat") return "bg-rose-500";
  if (state === "segera") return "bg-amber-500";
  return "bg-sky-500";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
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
