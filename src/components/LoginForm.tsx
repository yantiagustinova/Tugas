"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember } from "@/lib/types";

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
      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
        Daftar nama tim masih kosong. Jalankan <code>npm run db:seed</code> untuk
        mengisi anggota tim terlebih dahulu.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="user"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Nama
        </label>
        <select
          id="user"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          className="w-full rounded-xl border-0 bg-white px-4 py-3 text-base text-slate-900 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Pilih nama —</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="pin"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          PIN
        </label>
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
          className="w-full rounded-xl border-0 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
      >
        {busy ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
