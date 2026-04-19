import type { ApplicationStatus } from "@/types";

const LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

const STYLES: Record<ApplicationStatus, string> = {
  APPLIED:
    "border-sky-300/80 bg-sky-100/90 text-sky-900 shadow-[0_0_16px_-4px_rgba(33,150,243,0.25)]",
  INTERVIEW:
    "border-[#5BB8F5]/70 bg-sky-50/95 text-sky-900 shadow-[0_0_16px_-4px_rgba(91,184,245,0.35)]",
  OFFER:
    "border-teal-300/80 bg-emerald-50/95 text-emerald-900 shadow-[0_0_14px_-4px_rgba(20,184,166,0.25)]",
  REJECTED:
    "border-rose-300/80 bg-rose-50/95 text-rose-900 shadow-[0_0_14px_-4px_rgba(244,63,94,0.2)]",
  GHOSTED:
    "border-slate-300/80 bg-slate-100/90 text-slate-800 shadow-[0_0_12px_-4px_rgba(100,116,139,0.2)]",
};

export type StatusBadgeProps = {
  status: ApplicationStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-[1.75rem] items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider transition-[transform,box-shadow] duration-200 hover:scale-[1.02] ${STYLES[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
}
