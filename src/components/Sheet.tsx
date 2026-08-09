"use client";

import { useEffect } from "react";

/**
 * Panel dialog: di HP muncul dari bawah layar seperti aplikasi native
 * (lengkap dengan garis pegangan), di layar lebar jadi kotak di tengah.
 */
export default function Sheet({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="animate-sheet flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="shrink-0 px-5 pt-3 sm:pt-5">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-1">{children}</div>

        {footer && (
          <div className="pb-safe shrink-0 border-t border-slate-100 px-5 pt-3 sm:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
