"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

import { readApiErrorMessage } from "@/lib/application-form-utils";
import { apiFetch } from "@/lib/api";
import type { Application } from "@/types";

import { StatusBadge } from "./StatusBadge";

export type ApplicationCardProps = {
  application: Application;
  /** After a successful delete (e.g. refetch list). */
  onDeleted?: () => void;
};

function formatAppliedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function ApplicationCard({ application, onDeleted }: ApplicationCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    id,
    company,
    position,
    location,
    status,
    appliedAt,
    jobUrl,
    salaryMin,
    salaryMax,
  } = application;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const salaryParts: string[] = [];
  if (salaryMin != null) salaryParts.push(`${salaryMin.toLocaleString()}`);
  if (salaryMax != null) salaryParts.push(`${salaryMax.toLocaleString()}`);
  const salaryLabel =
    salaryParts.length === 2
      ? `${salaryParts[0]} – ${salaryParts[1]}`
      : salaryParts.length === 1
        ? salaryParts[0]
        : null;

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(await readApiErrorMessage(res));
        return;
      }
      setShowDeleteDialog(false);
      onDeleted?.();
      if (pathname === `/dashboard/applications/${id}`) {
        router.push("/dashboard");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not reach the server.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white/90 via-sky-50/40 to-white/85 p-5 shadow-[0_12px_40px_-12px_rgba(33,150,243,0.15)] backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_18px_48px_-10px_rgba(33,150,243,0.22)] sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-[#5BB8F5]/15 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {company}
            </h2>
            <StatusBadge status={status} className="sm:shrink-0" />
          </div>
          <p className="text-sm font-medium text-slate-700">{position}</p>
          {(location || salaryLabel) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {location ? (
                <span className="text-slate-600">{location}</span>
              ) : null}
              {salaryLabel ? (
                <span className="tabular-nums text-slate-600">{salaryLabel}</span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-3 border-t border-sky-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Applied{" "}
          <time dateTime={appliedAt} className="font-medium text-slate-700">
            {formatAppliedDate(appliedAt)}
          </time>
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href={`/dashboard/applications/${id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-300/80 bg-sky-50/90 px-4 text-sm font-medium text-sky-900 transition-[background-color,transform] hover:bg-sky-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Edit
          </Link>
          {jobUrl ? (
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#5BB8F5]/60 bg-[#2196F3]/10 px-4 text-sm font-medium text-sky-900 transition-[background-color,transform] hover:bg-[#2196F3]/15 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              View posting
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setShowDeleteDialog(true);
            }}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-rose-300/70 bg-rose-50/90 text-rose-700 transition-[background-color,transform,color] hover:border-rose-400 hover:bg-rose-100 hover:text-rose-900 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
            aria-label={`Delete application: ${company}`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showDeleteDialog
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-app-title-${id}`}
            >
              <div className="w-full max-w-md rounded-2xl border border-sky-200/80 bg-white p-6 shadow-2xl shadow-sky-900/20">
                <h2
                  id={`delete-app-title-${id}`}
                  className="text-xl font-semibold text-slate-900"
                >
                  Delete this application?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  <span className="font-medium text-slate-800">{company}</span>
                  {" — "}
                  {position}. This can&apos;t be undone.
                </p>
                {deleteError ? (
                  <p className="mt-3 text-sm text-rose-800" role="alert">
                    {deleteError}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(false)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-300/80 bg-white px-4 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    disabled={deleting}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}
