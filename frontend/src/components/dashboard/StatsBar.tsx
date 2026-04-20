"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { readSafeApiErrorMessage, userFacingCatchError } from "@/lib/user-facing-error";
import type { ApplicationStats, ApplicationStatus } from "@/types";

const STATUS_ORDER: { status: ApplicationStatus; label: string }[] = [
  { status: "APPLIED", label: "Applied" },
  { status: "INTERVIEW", label: "Interview" },
  { status: "OFFER", label: "Offer" },
  { status: "REJECTED", label: "Rejected" },
  { status: "GHOSTED", label: "Ghosted" },
];

const ACCENTS: Record<ApplicationStatus, string> = {
  APPLIED:
    "from-sky-400/20 via-sky-100/40 to-white/60 border-sky-300/60",
  INTERVIEW:
    "from-[#5BB8F5]/25 via-sky-50/50 to-white/60 border-sky-400/55",
  OFFER:
    "from-teal-400/20 via-emerald-50/50 to-white/60 border-teal-300/55",
  REJECTED: "from-rose-200/35 via-rose-50/60 to-white/60 border-rose-300/55",
  GHOSTED:
    "from-slate-300/35 via-slate-50/70 to-white/60 border-slate-300/60",
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseStats(json: unknown): ApplicationStats | null {
  if (!isRecord(json)) return null;
  if (typeof json.total !== "number" || !Number.isFinite(json.total)) {
    return null;
  }
  const raw = json.byStatus;
  if (!isRecord(raw)) return null;
  const byStatus = {} as Record<ApplicationStatus, number>;
  for (const { status } of STATUS_ORDER) {
    const n = raw[status];
    if (typeof n !== "number" || !Number.isFinite(n)) return null;
    byStatus[status] = n;
  }
  return { total: json.total, byStatus };
}

async function readErrorMessage(res: Response): Promise<string> {
  return readSafeApiErrorMessage(res, "Could not load statistics.");
}

function StatSkeleton({ hero = false }: { hero?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-sky-200/50 bg-white/50 p-4 sm:p-5 ${hero ? "min-h-[7.5rem] sm:min-h-[8.5rem]" : ""}`}
    >
      <div className={`rounded bg-sky-200/60 ${hero ? "h-3 w-40" : "h-3 w-16"}`} />
      <div
        className={`mt-3 rounded-lg bg-sky-100/80 ${hero ? "h-10 w-20" : "h-8 w-12"}`}
      />
    </div>
  );
}

export function StatsBar() {
  const [data, setData] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/applications/stats");
      if (!res.ok) {
        setData(null);
        setError(await readErrorMessage(res));
        return;
      }
      const json: unknown = await res.json();
      const parsed = parseStats(json);
      if (parsed === null) {
        setData(null);
        setError("Unexpected response from server.");
        return;
      }
      setData(parsed);
    } catch (e) {
      setData(null);
      setError(userFacingCatchError(e, "stats"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section
        className="w-full"
        aria-busy="true"
        aria-label="Application statistics loading"
      >
        <div className="mb-4 flex items-center gap-2">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
            aria-hidden
          />
          <span className="text-sm text-slate-600">Loading your pipeline…</span>
        </div>
        <div className="mb-4">
          <StatSkeleton hero />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_ORDER.map(({ status }) => (
            <StatSkeleton key={status} />
          ))}
        </div>
        <p className="sr-only">Loading application statistics</p>
      </section>
    );
  }

  if (error !== null || data === null) {
    return (
      <section
        className="w-full rounded-2xl border border-rose-300/60 bg-rose-50/80 p-5"
        aria-label="Application statistics error"
      >
        <p className="text-sm text-rose-900">{error ?? "Something went wrong."}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 min-h-11 rounded-xl border border-rose-400/60 bg-white/70 px-4 text-sm font-medium text-rose-900 transition-colors hover:bg-rose-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          Try again
        </button>
      </section>
    );
  }

  const { total, byStatus } = data;

  return (
    <section
      className="w-full"
      aria-label="Application statistics"
    >
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Pipeline overview
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Live counts from your applications
          </p>
        </div>
      </div>

      <div className="mb-4">
        <article
          className="group relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white/90 via-sky-50/80 to-[#5BB8F5]/15 p-6 shadow-[0_18px_50px_-14px_rgba(33,150,243,0.22)] backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:shadow-[0_22px_56px_-12px_rgba(33,150,243,0.28)] sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#5BB8F5]/25 blur-2xl transition-opacity duration-500 group-hover:opacity-95"
            aria-hidden
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-700">
            Total applications
          </p>
          <p
            className="mt-2 bg-gradient-to-r from-slate-900 via-sky-900 to-[#2196F3] bg-clip-text text-4xl font-semibold tabular-nums tracking-tight text-transparent sm:text-5xl"
            aria-live="polite"
          >
            {total}
          </p>
        </article>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_ORDER.map(({ status, label }) => {
          const count = byStatus[status];
          const accent = ACCENTS[status];
          return (
            <article
              key={status}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accent} p-4 shadow-md shadow-sky-900/5 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl">
                {count}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
