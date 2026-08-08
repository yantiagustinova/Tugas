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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-2xl font-bold text-white shadow-sm">
            E
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Task Tracker Envilog
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Masuk dengan nama dan PIN kamu.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <LoginForm team={team} />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Lupa PIN? Hubungi admin tim untuk reset.
        </p>
      </div>
    </main>
  );
}
