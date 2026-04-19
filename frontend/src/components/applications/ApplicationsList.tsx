"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import type { ApiErrorBody, Application, ApplicationStatus } from "@/types";

import { ApplicationCard } from "./ApplicationCard";

const STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

type FilterValue = "ALL" | ApplicationStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "GHOSTED", label: "Ghosted" },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseApplication(raw: unknown): Application | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const userId = raw.userId;
  const company = raw.company;
  const position = raw.position;
  const status = raw.status;
  const appliedAt = raw.appliedAt;
  const updatedAt = raw.updatedAt;
  if (typeof id !== "string" || typeof userId !== "string") return null;
  if (typeof company !== "string" || typeof position !== "string") return null;
  if (typeof status !== "string" || !STATUSES.includes(status as ApplicationStatus)) {
    return null;
  }
  if (typeof appliedAt !== "string" || typeof updatedAt !== "string") return null;

  const location = raw.location;
  const notes = raw.notes;
  const jobUrl = raw.jobUrl;
  const salaryMin = raw.salaryMin;
  const salaryMax = raw.salaryMax;

  return {
    id,
    userId,
    company,
    position,
    location: typeof location === "string" ? location : null,
    status: status as ApplicationStatus,
    salaryMin: typeof salaryMin === "number" ? salaryMin : null,
    salaryMax: typeof salaryMax === "number" ? salaryMax : null,
    jobUrl: typeof jobUrl === "string" ? jobUrl : null,
    notes: typeof notes === "string" ? notes : null,
    appliedAt,
    updatedAt,
  };
}

function parseList(json: unknown): Application[] | null {
  if (!Array.isArray(json)) return null;
  const out: Application[] = [];
  for (const item of json) {
    const app = parseApplication(item);
    if (app === null) return null;
    out.push(app);
  }
  return out;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as Partial<ApiErrorBody>;
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
  } catch {
    /* ignore */
  }
  return "Could not load applications.";
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-sky-200/50 bg-white/50 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-sky-200/70" />
              <div className="h-4 w-56 rounded bg-sky-100/80" />
            </div>
            <div className="h-7 w-24 rounded-full bg-sky-100/80" />
          </div>
          <div className="mt-5 border-t border-sky-200/40 pt-4">
            <div className="h-3 w-32 rounded bg-sky-100/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

const filterActive =
  "border-sky-400/70 bg-gradient-to-r from-[#2196F3]/15 to-[#5BB8F5]/20 text-sky-950 shadow-[0_8px_22px_-8px_rgba(33,150,243,0.35)]";
const filterIdle =
  "border-sky-200/70 bg-white/55 text-slate-700 hover:border-sky-300 hover:bg-white/80";

export function ApplicationsList() {
  const [items, setItems] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = activeFilter === "ALL" ? "" : `?status=${activeFilter}`;
      const res = await apiFetch(`/api/applications${query}`);
      if (!res.ok) {
        setItems(null);
        setError(await readErrorMessage(res));
        return;
      }
      const json: unknown = await res.json();
      const parsed = parseList(json);
      if (parsed === null) {
        setItems(null);
        setError("Unexpected response from server.");
        return;
      }
      setItems(parsed);
    } catch (e) {
      setItems(null);
      setError(e instanceof Error ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section
        className="w-full"
        aria-busy="true"
        aria-label="Applications loading"
      >
        <div className="mb-6 flex items-center gap-2">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
            aria-hidden
          />
          <span className="text-sm text-slate-600">Loading applications…</span>
        </div>
        <ListSkeleton />
        <p className="sr-only">Loading your applications</p>
      </section>
    );
  }

  if (error !== null) {
    return (
      <section
        className="w-full rounded-2xl border border-rose-300/60 bg-rose-50/80 p-5"
        aria-label="Applications error"
      >
        <p className="text-sm text-rose-900">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 min-h-11 rounded-xl border border-rose-400/60 bg-white/80 px-4 text-sm font-medium text-rose-900 transition-colors hover:bg-rose-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          Try again
        </button>
      </section>
    );
  }

  if (items?.length === 0) {
    return (
      <section
        className="w-full"
        aria-label="No applications"
      >
        <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
            {FILTERS.map((filter) => {
              const active = filter.value === activeFilter;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={active}
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-xs font-semibold uppercase tracking-wider transition-[transform,box-shadow,background-color,color,border-color] duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${active ? filterActive : filterIdle}`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-sky-300/70 bg-gradient-to-br from-white/80 via-sky-50/60 to-[#5BB8F5]/10 px-6 py-14 text-center shadow-inner sm:px-10 sm:py-16">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 rounded-full bg-[#5BB8F5]/20 blur-3xl"
            aria-hidden
          />
          <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-sky-700">
            Your pipeline
          </p>
          <h2 className="relative mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
            No applications yet
          </h2>
          <p className="relative mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            {activeFilter === "ALL"
              ? "When you add roles you're pursuing, they'll show up here with status, dates, and quick links—ready to scan at a glance."
              : `No ${activeFilter.toLowerCase()} applications yet. Try another filter or create a new role.`}
          </p>
        </div>
      </section>
    );
  }

  if (items === null) {
    return null;
  }

  return (
    <section className="w-full" aria-label="Your applications">
      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-2">
          {FILTERS.map((filter) => {
            const active = filter.value === activeFilter;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                aria-pressed={active}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-xs font-semibold uppercase tracking-wider transition-[transform,box-shadow,background-color,color,border-color] duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${active ? filterActive : filterIdle}`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Applications
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {activeFilter === "ALL" ? "Newest first" : `${activeFilter.toLowerCase()} only`} · {items.length}{" "}
            {items.length === 1 ? "role" : "roles"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/applications/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-300/80 bg-sky-50/90 px-4 text-xs font-semibold uppercase tracking-wider text-sky-900 transition-colors hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            New
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="self-start text-xs font-medium text-sky-700 underline-offset-4 transition-colors hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:self-auto"
          >
            Refresh
          </button>
        </div>
      </div>
      <ul className="flex list-none flex-col gap-4 p-0" role="list">
        {items.map((app) => (
          <li key={app.id} role="listitem">
            <ApplicationCard application={app} onDeleted={() => void load()} />
          </li>
        ))}
      </ul>
    </section>
  );
}
