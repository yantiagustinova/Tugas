import { cx } from "@/lib/ui";

/**
 * Kerangka aplikasi.
 *
 * Mobile-first: di HP tampil penuh selayar seperti aplikasi biasa, dengan
 * bar judul yang menempel di atas. Di layar lebar isinya dikunci pada lebar
 * baca yang nyaman dan dibingkai supaya tidak melebar tanpa batas.
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
    <div className="min-h-dvh bg-[var(--app-bg)] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-[var(--app-bg)] sm:min-h-0 sm:overflow-hidden sm:rounded-2xl sm:shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.18)] sm:ring-1 sm:ring-slate-950/5">
        {header}
        <div
          className={cx(
            "flex-1 px-4 py-5 sm:px-6 sm:py-6",
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
 * Bar judul biru. Menempel di atas hanya saat di HP — di layar lebar
 * dibiarkan diam supaya tidak lepas dari sudut membulat bingkainya.
 */
export function AppHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-30 bg-blue-700 sm:static">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-sm font-bold text-white">
          E
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] leading-tight font-semibold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs leading-tight text-blue-200">
              {subtitle}
            </p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}

export const HEADER_BTN =
  "inline-flex items-center gap-1.5 rounded-control bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20";
