"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { getAccessToken, subscribeAccessToken } from "@/lib/access-token";
import { tryRestoreSessionFromRefreshCookie } from "@/lib/api";

const primaryCtaClassName =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-6 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition-[transform,box-shadow] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:w-auto";

const secondaryCtaClassName =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-sky-300/90 bg-white/50 px-6 text-base font-medium text-sky-900 backdrop-blur-sm transition-colors hover:border-sky-400 hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:w-auto";

/**
 * One primary slot: **Create account** (guest) or **Dashboard** (signed in).
 * **Sign in** only when guest — register remains reachable from `/login`.
 * Runs refresh-cookie restore once on load (same idea as `AuthGuard`) so `/` matches session after full reload.
 */
export function HomePrimaryActions() {
  const [bootstrapDone, setBootstrapDone] = useState(
    () => getAccessToken() !== null,
  );

  const isAuthed = useSyncExternalStore(
    subscribeAccessToken,
    () => getAccessToken() !== null,
    () => false,
  );

  useEffect(() => {
    if (bootstrapDone) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await tryRestoreSessionFromRefreshCookie();
      } finally {
        if (!cancelled) {
          setBootstrapDone(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapDone]);

  if (!bootstrapDone) {
    return (
      <div
        className="mt-10 flex min-h-12 items-center justify-center"
        aria-busy="true"
        aria-live="polite"
      >
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
          aria-hidden
        />
        <span className="sr-only">Checking session…</span>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
      {isAuthed ? (
        <Link href="/dashboard" className={primaryCtaClassName}>
          Dashboard
        </Link>
      ) : (
        <>
          <Link href="/register" className={primaryCtaClassName}>
            Create account
          </Link>
          <Link href="/login" className={secondaryCtaClassName}>
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}
