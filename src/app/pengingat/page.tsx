import Link from "next/link";
import AppShell, { AppHeader, HEADER_BTN } from "@/components/AppShell";
import { formatDateId } from "@/lib/dates";
import { runReminders } from "@/lib/reminder";
import { requireUser } from "@/lib/session";
import { groupId, waProviderName } from "@/lib/wa";

export const dynamic = "force-dynamic";

/**
 * Pratinjau pesan WhatsApp yang akan dikirim cron hari ini.
 * Halaman ini hanya membaca data — tidak mengirim apa pun.
 */
export default async function ReminderPreviewPage() {
  await requireUser();
  const report = await runReminders({ dryRun: true });
  const provider = waProviderName();
  const gid = groupId();

  return (
    <AppShell
      header={
        <AppHeader
          title="Pratinjau pengingat"
          subtitle="Isi pesan WhatsApp hari ini — tidak dikirim"
          actions={
            <Link href="/" className={HEADER_BTN}>
              ← Dashboard
            </Link>
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="rounded-card bg-white p-4 text-sm ring-1 ring-slate-950/5">
          <p className="text-slate-600">
            Isi pesan yang akan dikirim cron harian untuk tanggal{" "}
            <strong className="text-slate-900">{formatDateId(report.date)}</strong>.
            Halaman ini <strong>tidak mengirim</strong> WhatsApp.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <Info label="Gateway" value={provider === "log" ? "belum di-set (mode log)" : provider} />
            <Info label="Mulai diingatkan" value={`H-${report.leadDays}`} />
            <Info label="Grup WA" value={gid ? gid : "belum di-set"} />
          </dl>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Pengingat personal ({report.personal.length})
          </h2>
          {report.personal.length === 0 ? (
            <p className="rounded-card bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-950/5">
              Tidak ada tugas yang jatuh tempo ≤ {report.leadDays} hari atau terlambat.
            </p>
          ) : (
            <div className="space-y-3">
              {report.personal.map((entry) => (
                <div
                  key={entry.ownerName}
                  className="overflow-hidden rounded-card bg-white ring-1 ring-slate-950/5"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
                    <span className="text-sm font-semibold text-slate-800">
                      {entry.ownerName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {entry.phone || "nomor WA belum diisi"}
                    </span>
                  </div>
                  <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
                    {entry.message}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Rekap harian ke grup
          </h2>
          <div className="overflow-hidden rounded-card bg-white ring-1 ring-slate-950/5">
            <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
              {report.recap.message}
            </pre>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium break-all text-slate-800">{value}</dd>
    </div>
  );
}
