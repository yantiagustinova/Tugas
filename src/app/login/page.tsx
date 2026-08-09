import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/session";
import { listTeam } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");
  const team = await listTeam();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-5 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_-12px_rgba(15,23,42,0.3)] ring-1 ring-slate-900/5">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white ring-1 ring-white/25">
            E
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Task Tracker Envilog
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            Masuk dengan nama dan PIN kamu.
          </p>
        </div>

        <div className="bg-slate-50 p-6">
          <LoginForm team={team} />
          <p className="mt-5 text-center text-xs text-slate-400">
            Lupa PIN? Hubungi admin tim untuk reset.
          </p>
        </div>
      </div>
    </main>
  );
}
