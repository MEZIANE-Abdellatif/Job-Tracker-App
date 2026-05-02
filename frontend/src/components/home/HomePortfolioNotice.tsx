"use client";

import { useEffect, useRef, useState } from "react";

export function HomePortfolioNotice() {
  const [open, setOpen] = useState(true);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-notice-title"
        className="my-auto w-full max-w-md rounded-2xl border border-sky-200/80 bg-white p-5 shadow-[0_22px_70px_-24px_rgba(14,116,144,0.45)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="portfolio-notice-title" className="text-lg font-semibold text-slate-900">
              Portfolio notice
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This deployment does not use a custom domain or SSL yet. It is a portfolio project;
              domain budget is invested in <strong className="text-slate-800">Mazzinka</strong> and{" "}
              <strong className="text-slate-800">Atlas</strong> (links are in my CV).
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">Developed by Abdellatif Meziane.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            ×
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 min-w-[7.5rem] items-center justify-center rounded-xl border border-sky-300/80 bg-sky-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
