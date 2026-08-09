"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember } from "@/lib/types";
import { BTN_PRIMARY, INPUT, cx } from "@/lib/ui";

const LAST_USER_KEY = "envilog:last-user";

export default function LoginForm({ team }: { team: TeamMember[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Di HP, staf hampir selalu login sebagai orang yang sama — jadi nama
  // terakhir dipilih otomatis supaya tinggal ketik PIN.
  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_USER_KEY);
    if (saved && team.some((member) => String(member.id) === saved)) {
      setUserId(saved);
    }
  }, [team]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!userId) {
      setError("Pilih nama dulu ya.");
      return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN terdiri dari 4–8 angka.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), pin }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Gagal masuk. Coba lagi.");
        setPin("");
        return;
      }

      window.localStorage.setItem(LAST_USER_KEY, userId);
      router.replace("/");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung. Cek koneksi internet.");
    } finally {
      setBusy(false);
    }
  }

  if (team.length === 0) {
    return (
      <div className="rounded-control bg-amber-50 p-4 text-sm text-amber-800">
        Daftar nama tim masih kosong. Buka halaman <code>/setup</code> untuk
        mendaftarkan anggota tim terlebih dahulu.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Nama
        </span>
        <div className="relative">
          <select
            id="user"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className={cx(INPUT, "appearance-none pr-9")}
          >
            <option value="">— Pilih nama —</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <path
              d="M6 8l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          PIN
        </span>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d*"
          maxLength={8}
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          placeholder="••••"
          className={cx(INPUT, "text-center text-xl tracking-[0.4em]")}
        />
      </label>

      {error && (
        <p className="rounded-control bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className={cx(BTN_PRIMARY, "w-full py-3 text-[15px]")}
      >
        {busy ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
