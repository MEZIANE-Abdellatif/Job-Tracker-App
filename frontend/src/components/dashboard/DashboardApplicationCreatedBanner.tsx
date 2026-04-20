"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "portfolio:dashboard-created-banner";

function readStoragePending(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearStoragePending(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Shown once after creating an application.
 * - `useSearchParams` picks up `?created=1` on client navigation (SSR/hydration-safe).
 * - `sessionStorage` set right before `router.push` covers any timing gap before the URL
 *   updates in the client router.
 * - Latched state keeps the banner after we strip `created` via `history.replaceState`.
 */
export function DashboardApplicationCreatedBanner() {
  const searchParams = useSearchParams();
  const queryCreated = searchParams.get("created") === "1";

  const [latched, setLatched] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!queryCreated && !readStoragePending()) return;
    const id = window.setTimeout(() => {
      setLatched(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [queryCreated]);

  const fromCreate = latched;
  const show = fromCreate && !dismissed;

  useEffect(() => {
    if (!show) return;
    clearStoragePending();
    const url = new URL(window.location.href);
    if (url.searchParams.get("created") !== "1") return;
    const id = window.setTimeout(() => {
      url.searchParams.delete("created");
      const qs = url.searchParams.toString();
      const next = `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`;
      window.history.replaceState(window.history.state, "", next);
    }, 0);
    return () => window.clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="mt-4 mb-6 flex flex-col gap-2 rounded-xl border border-emerald-300/70 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        Your application has been saved successfully. It now appears in the list below. Use the
        status filters if you would like to refine the view.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 self-end rounded-lg px-2 py-1 text-xs font-medium text-emerald-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:self-auto"
      >
        Close
      </button>
    </div>
  );
}

export function setDashboardCreatedBannerPending(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
