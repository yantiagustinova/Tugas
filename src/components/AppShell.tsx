import { cx } from "@/lib/ui";

/**
 * Bingkai aplikasi: di HP tampil penuh selayar, di layar lebar menjadi kartu
 * di tengah dengan sudut membulat dan bayangan — supaya terasa seperti
 * "aplikasi di dalam kotak", bukan halaman web yang melebar.
 */
export default function AppShell({
  header,
  children,
  contentClassName,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="min-h-dvh bg-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col bg-white shadow-[0_10px_40px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 sm:min-h-0 sm:rounded-3xl">
        {header}
        <div
          className={cx(
            "flex-1 bg-slate-50 px-4 py-4 sm:rounded-b-3xl sm:px-6 sm:py-5",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Bar biru di puncak aplikasi. Sticky hanya di HP — di layar lebar dibiarkan
 * diam supaya tidak "lepas" dari sudut membulat kotaknya saat digulir.
 */
export function AppHeader({
  title,
  subtitle,
  actions,
  leading,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3.5 sm:static sm:rounded-t-3xl sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        {leading ?? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-bold text-white ring-1 ring-white/25">
            E
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base leading-tight font-bold text-white sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-blue-100 sm:text-sm">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}

/** Tombol di dalam bar biru — putih transparan supaya kontras tetap enak. */
export const headerButtonClass =
  "rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/25 transition hover:bg-white/25";
