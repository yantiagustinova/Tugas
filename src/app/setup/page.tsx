import Link from "next/link";
import AppShell, { AppHeader } from "@/components/AppShell";
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
    <AppShell
      header={
        <AppHeader
          title="Setup Task Tracker Envilog"
          subtitle="Siapkan tabel dan daftarkan anggota tim"
        />
      }
    >
      <SetupPanel />

      <p className="mt-6 text-center text-xs text-slate-400">
        Sudah selesai?{" "}
        <Link href="/login" className="underline hover:text-slate-600">
          Ke halaman login
        </Link>
      </p>
    </AppShell>
  );
}
