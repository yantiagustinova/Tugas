"use client";

import { useCallback, useState } from "react";
import { cx } from "@/lib/ui";

type Member = {
  id: number;
  name: string;
  phone: string;
  active: boolean;
  taskCount: number;
};

const inputClass =
  "w-full rounded-xl border-0 bg-white px-3.5 py-3 text-base text-slate-900 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-500";

export default function SetupPanel() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [lockError, setLockError] = useState("");
  const [busy, setBusy] = useState(false);

  const [members, setMembers] = useState<Member[] | null>(null);
  const [tableHint, setTableHint] = useState("");
  const [schemaMsg, setSchemaMsg] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [memberMsg, setMemberMsg] = useState("");
  const [memberError, setMemberError] = useState("");

  const loadMembers = useCallback(async (setupKey: string) => {
    const res = await fetch("/api/setup/team", {
      headers: { "x-setup-key": setupKey },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMembers(data.members as Member[]);
      setTableHint("");
      return res.status;
    }
    setMembers(null);
    if (res.status >= 500) setTableHint(data.error ?? "");
    return res.status;
  }, []);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setLockError("");
    setBusy(true);
    try {
      const status = await loadMembers(key);
      if (status === 401) {
        setLockError("Kunci setup salah.");
        return;
      }
      if (status === 404) {
        setLockError(
          "Setup lewat browser belum aktif. Tambahkan env SETUP_SECRET di Vercel, lalu redeploy.",
        );
        return;
      }
      if (status === 429) {
        setLockError("Terlalu banyak percobaan. Coba lagi 10 menit lagi.");
        return;
      }
      setUnlocked(true);
    } catch {
      setLockError("Tidak bisa terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  async function createSchema() {
    setBusy(true);
    setSchemaMsg("");
    try {
      const res = await fetch("/api/setup/schema", {
        method: "POST",
        headers: { "x-setup-key": key },
      });
      const data = await res.json().catch(() => ({}));
      setSchemaMsg(res.ok ? `✅ ${data.message}` : `⚠️ ${data.error}`);
      if (res.ok) await loadMembers(key);
    } catch {
      setSchemaMsg("⚠️ Tidak bisa terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  async function saveMember(event: React.FormEvent) {
    event.preventDefault();
    setMemberError("");
    setMemberMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/setup/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-setup-key": key },
        body: JSON.stringify({ name, phone, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberError(data.error ?? "Gagal menyimpan anggota.");
        return;
      }
      setMemberMsg(
        data.result.created
          ? `✅ ${data.result.name} ditambahkan.`
          : `✅ ${data.result.name} diperbarui${data.result.pinChanged ? " (PIN diganti)" : ""}.`,
      );
      setName("");
      setPhone("");
      setPin("");
      await loadMembers(key);
    } catch {
      setMemberError("Tidak bisa terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <form onSubmit={unlock} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Kunci setup
          </span>
          <input
            type="password"
            autoFocus
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="isi nilai SETUP_SECRET"
            className={inputClass}
          />
        </label>

        {lockError && (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
            {lockError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || key.length === 0}
          className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Memeriksa…" : "Buka halaman setup"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">1. Siapkan tabel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Membuat tabel yang belum ada. Aman ditekan berkali-kali — data yang
          sudah ada tidak tersentuh.
        </p>
        <button
          type="button"
          onClick={createSchema}
          disabled={busy}
          className="mt-3 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
        >
          {busy ? "Memproses…" : "Buat / perbarui tabel"}
        </button>
        {schemaMsg && <p className="mt-3 text-sm text-slate-700">{schemaMsg}</p>}
        {tableHint && !schemaMsg && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
            {tableHint}
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">2. Anggota tim</h2>
        <p className="mt-1 text-sm text-slate-500">
          Nama dan PIN inilah yang dipakai untuk login. Isi nomor WA supaya
          pengingat bisa terkirim.
        </p>

        {members !== null && members.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {member.name}
                    {!member.active && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        nonaktif
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {member.phone || "nomor WA belum diisi"} · {member.taskCount}{" "}
                    tugas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setName(member.name);
                    setPhone(member.phone);
                    setPin("");
                    setMemberMsg("");
                    setMemberError("");
                  }}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Ubah
                </button>
              </li>
            ))}
          </ul>
        )}

        {members !== null && members.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            Belum ada anggota. Tambahkan orang pertama di bawah.
          </p>
        )}

        <form onSubmit={saveMember} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Nama
            </span>
            <input
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              placeholder="mis. Budi"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Nomor WA
            </span>
            <input
              value={phone}
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="081234567890"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              PIN{" "}
              <span className="font-normal text-slate-400">
                (4–8 angka; kosongkan untuk tidak mengubah PIN)
              </span>
            </span>
            <input
              value={pin}
              inputMode="numeric"
              maxLength={8}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              className={inputClass}
            />
          </label>

          {memberError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
              {memberError}
            </p>
          )}
          {memberMsg && <p className="text-sm text-slate-700">{memberMsg}</p>}

          <button
            type="submit"
            disabled={busy || name.trim().length < 2}
            className={cx(
              "w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60",
            )}
          >
            {busy ? "Menyimpan…" : "Simpan anggota"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <h2 className="text-base font-bold text-amber-900">3. Tutup pintunya</h2>
        <p className="mt-1 text-sm text-amber-800">
          Kalau semua anggota sudah terdaftar, hapus env{" "}
          <code className="rounded bg-amber-100 px-1">SETUP_SECRET</code> di
          Vercel lalu redeploy. Halaman ini langsung mati — siapa pun yang tahu
          alamatnya tidak bisa lagi menambah orang atau mengganti PIN.
        </p>
      </section>
    </div>
  );
}
