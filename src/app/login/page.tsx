import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/session";
import { listTeam } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");
  const team = await listTeam();

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-700 text-lg font-bold text-white shadow-[0_6px_16px_-6px_rgba(29,78,216,0.7)]">
            E
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Task Tracker Envilog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Masuk dengan nama dan PIN kamu.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-950/5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_32px_-16px_rgba(15,23,42,0.2)]">
          <LoginForm team={team} />
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Lupa PIN? Hubungi admin tim untuk reset.
        </p>
      </div>
    </main>
  );
}
