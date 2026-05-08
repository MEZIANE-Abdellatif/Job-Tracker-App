"use client";

import { useEffect, useRef, useState } from "react";

import { BRAND_NAME } from "@/lib/brand";

const NOTICE_DISMISSED_KEY = "home_portfolio_notice_dismissed";

export function HomePortfolioNotice() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(NOTICE_DISMISSED_KEY) === "1";
    if (dismissed) {
      return;
    }

    setOpen(true);
    const id = window.requestAnimationFrame(() => {
      setVisible(true);
      closeRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        window.localStorage.setItem(NOTICE_DISMISSED_KEY, "1");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  function close() {
    window.localStorage.setItem(NOTICE_DISMISSED_KEY, "1");
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[10000] grid place-items-center overflow-y-auto p-4 backdrop-blur-sm transition-all duration-300 ${
        visible ? "bg-slate-950/60 opacity-100" : "bg-slate-950/0 opacity-0"
      }`}
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-intro-title"
        className={`my-auto w-full max-w-md rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_24px_90px_-32px_rgba(15,23,42,0.55)] transition-all duration-300 sm:p-7 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
          <img
            src="https://res.cloudinary.com/dbock6hhb/image/upload/v1778170353/WhatsApp_Image_2026-04-05_at_05.24.06_1_ufb1hv.jpg"
            alt="Abdellatif Meziane profile photo"
            className="h-12 w-12 rounded-full border border-sky-200 object-cover"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Developed by</p>
            <a
              href="https://www.linkedin.com/in/abdellatif-meziane-847916219/"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-sm font-semibold text-slate-900 underline decoration-sky-300 decoration-2 underline-offset-4 transition-colors hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Abdellatif Meziane
            </a>
          </div>
        </div>
        <div className="mb-5">
          <h2 id="home-intro-title" className="text-xl font-semibold tracking-tight text-slate-900">
            {BRAND_NAME}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">
            A lightweight job-application tracker: sign in, add roles you applied for, and keep your
            pipeline organized in one place.
          </p>
        </div>
        <div className="flex justify-end">
          <button
            ref={closeRef}
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
