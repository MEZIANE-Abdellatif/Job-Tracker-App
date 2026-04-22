"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { apiFetch } from "@/lib/api";
import type { Application, ApplicationsPage, ApplicationStatus } from "@/types";
import { readSafeApiErrorMessage, userFacingCatchError } from "@/lib/user-facing-error";

import { CreateApplicationForm } from "@/components/applications/CreateApplicationForm";
import { JobBoardLinks } from "@/components/job-boards/JobBoardLinks";

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

function parsePage(json: unknown): ApplicationsPage | null {
  if (!isRecord(json)) return null;
  const rawItems = json.items;
  const nextCursor = json.nextCursor;
  const hasMore = json.hasMore;
  if (!Array.isArray(rawItems)) return null;
  if (!(typeof nextCursor === "string" || nextCursor === null)) return null;
  if (typeof hasMore !== "boolean") return null;
  const items: Application[] = [];
  for (const item of rawItems) {
    const app = parseApplication(item);
    if (app === null) return null;
    items.push(app);
  }
  return { items, nextCursor, hasMore };
}

async function readErrorMessage(res: Response): Promise<string> {
  return readSafeApiErrorMessage(res, "Could not load applications.");
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

const addApplicationCtaClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-[transform,box-shadow] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:w-auto";

const dashboardJobBoardsClassName =
  "mb-6 border-b border-sky-200/45 pb-6 motion-safe:scroll-smooth";

type ApplicationFilterBarProps = {
  activeFilter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
};

type CreatedBannerProps = {
  onClose: () => void;
};

function CreatedBanner({ onClose }: CreatedBannerProps) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-2 rounded-xl border border-emerald-300/70 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        Your application has been saved successfully. It now appears in the list below. Use the
        status filters if you would like to refine the view.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 self-end rounded-lg px-2 py-1 text-xs font-medium text-emerald-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:self-auto"
      >
        Close
      </button>
    </div>
  );
}

function ApplicationFilterBar({
  activeFilter,
  onFilterChange,
}: ApplicationFilterBarProps) {
  return (
    <div className="mb-6 overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === activeFilter;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-xs font-semibold uppercase tracking-wider transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-out active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${active ? filterActive : filterIdle}`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ApplicationsList() {
  const addModalCloseRef = useRef<HTMLButtonElement | null>(null);
  const addModalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [items, setItems] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [createdBannerVisible, setCreatedBannerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(async (options?: { append?: boolean; cursor?: string | null }) => {
    const append = options?.append ?? false;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setNextCursor(null);
      setHasMore(false);
    }
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "ALL") {
        params.set("status", activeFilter);
      }
      params.set("limit", "5");
      const cursor = options?.cursor;
      if (append && typeof cursor === "string" && cursor.length > 0) {
        params.set("cursor", cursor);
      }
      const query = params.toString();
      const res = await apiFetch(`/api/applications${query ? `?${query}` : ""}`);
      if (!res.ok) {
        if (!append) {
          setItems(null);
          setError(await readErrorMessage(res));
        }
        return;
      }
      const json: unknown = await res.json();
      const parsed = parsePage(json);
      if (parsed === null) {
        if (!append) {
          setItems(null);
          setError("Unexpected response from server.");
        }
        return;
      }
      setHasMore(parsed.hasMore);
      setNextCursor(parsed.nextCursor);
      if (append) {
        setItems((prev) => [...(prev ?? []), ...parsed.items]);
      } else {
        setItems(parsed.items);
      }
    } catch (e) {
      if (!append) {
        setItems(null);
        setError(userFacingCatchError(e, "applications list"));
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!addOpen) return;
    const previous = document.body.style.overflow;
    const triggerEl = addModalTriggerRef.current;
    document.body.style.overflow = "hidden";
    addModalCloseRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAddOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
      triggerEl?.focus();
    };
  }, [addOpen]);

  function openAddModal() {
    setAddOpen(true);
  }

  function closeAddModal() {
    setAddOpen(false);
  }

  function handleCreated(): void {
    setAddOpen(false);
    setCreatedBannerVisible(true);
    void load();
  }

  function handleLoadMore(): void {
    if (!hasMore || nextCursor === null || loadingMore) return;
    void load({ append: true, cursor: nextCursor });
  }

  if (loading) {
    return (
      <section
        className="w-full"
        aria-busy="true"
        aria-label="Applications loading"
      >
        <JobBoardLinks
          variant="scroll"
          className={dashboardJobBoardsClassName}
        />
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
        <JobBoardLinks
          variant="scroll"
          className="mb-6 border-b border-rose-200/50 pb-6 motion-safe:scroll-smooth"
        />
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
      <>
        <section
          className="w-full"
          aria-label="No applications"
        >
          <JobBoardLinks
            variant="scroll"
            className={dashboardJobBoardsClassName}
          />
          {createdBannerVisible ? (
            <CreatedBanner onClose={() => setCreatedBannerVisible(false)} />
          ) : null}
          <ApplicationFilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
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
                ? "When you add roles you're pursuing, they'll show up here with status, dates, and quick links, ready to scan at a glance."
                : `No ${activeFilter.toLowerCase()} applications yet. Try another filter or create a new role.`}
            </p>
            <button
              ref={addModalTriggerRef}
              type="button"
              onClick={openAddModal}
              className={`relative mt-8 ${addApplicationCtaClassName}`}
            >
              Add new application
            </button>
          </div>
        </section>
        {mounted && addOpen
          ? createPortal(
              <div
                className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm"
                onClick={closeAddModal}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="create-application-title"
                  className="my-auto w-full max-w-2xl rounded-2xl border border-sky-200/80 bg-white p-5 shadow-[0_22px_70px_-24px_rgba(14,116,144,0.45)] sm:p-6"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 id="create-application-title" className="text-lg font-semibold text-slate-900">
                        New application
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Capture role details and save directly to your dashboard.
                      </p>
                    </div>
                    <button
                      ref={addModalCloseRef}
                      type="button"
                      onClick={closeAddModal}
                      aria-label="Close dialog"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                      ×
                    </button>
                  </div>
                  <CreateApplicationForm onCreated={handleCreated} />
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  if (items === null) {
    return null;
  }

  return (
    <>
      <section className="w-full" aria-label="Your applications">
        <JobBoardLinks
          variant="scroll"
          className={dashboardJobBoardsClassName}
        />
        {createdBannerVisible ? (
          <CreatedBanner onClose={() => setCreatedBannerVisible(false)} />
        ) : null}
        <ApplicationFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Applications
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {activeFilter === "ALL" ? "Newest first" : `${activeFilter.toLowerCase()} only`} · {items.length}{" "}
              {items.length === 1 ? "role" : "roles"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="self-start text-xs font-medium text-sky-700 underline-offset-4 transition-colors hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:self-auto"
          >
            Refresh
          </button>
        </div>

        <div className="sticky top-0 z-10 mb-4 py-2">
          <button
            ref={addModalTriggerRef}
            type="button"
            onClick={openAddModal}
            className={addApplicationCtaClassName}
          >
            Add new application
          </button>
        </div>

        <ul className="flex list-none flex-col gap-4 p-0" role="list">
          {items.map((app) => (
            <li key={app.id} role="listitem">
              <ApplicationCard application={app} onDeleted={() => void load()} />
            </li>
          ))}
        </ul>
        {hasMore ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-300/80 bg-white px-5 text-sm font-semibold text-sky-900 transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          </div>
        ) : null}
      </section>
      {mounted && addOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm"
              onClick={closeAddModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-application-title"
                className="my-auto w-full max-w-2xl rounded-2xl border border-sky-200/80 bg-white p-5 shadow-[0_22px_70px_-24px_rgba(14,116,144,0.45)] sm:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 id="create-application-title" className="text-lg font-semibold text-slate-900">
                      New application
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Capture role details and save directly to your dashboard.
                    </p>
                  </div>
                  <button
                    ref={addModalCloseRef}
                    type="button"
                    onClick={closeAddModal}
                    aria-label="Close dialog"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  >
                    ×
                  </button>
                </div>
                <CreateApplicationForm onCreated={handleCreated} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
