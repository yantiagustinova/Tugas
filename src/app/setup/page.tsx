import Link from "next/link";
import SetupPanel from "@/components/SetupPanel";

export const dynamic = "force-dynamic";

// Halaman ini sengaja tidak butuh login: sebelum ada anggota terdaftar,
// belum ada seorang pun yang bisa masuk. Pengamannya adalah SETUP_SECRET.
export const metadata = {
  title: "Setup — Task Tracker Envilog",
  robots: { index: false, follow: false },
};

export default function SetupPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Setup Task Tracker Envilog
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Menyiapkan tabel database dan mendaftarkan anggota tim — semuanya dari
          browser, tanpa perlu terminal.
        </p>
      </header>

      <SetupPanel />

      <p className="mt-6 text-center text-xs text-slate-400">
        Sudah selesai? <Link href="/login" className="underline">Ke halaman login</Link>
      </p>
    </main>
  );
}
