"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import {
  APPLICATION_STATUSES,
  readApiErrorMessage,
  toCreateApplicationPayload,
  type CreateApplicationFormErrors,
  type CreateApplicationFormValues,
  validateCreateApplication,
} from "@/lib/application-form-utils";
import { setDashboardCreatedBannerPending } from "@/components/dashboard/DashboardApplicationCreatedBanner";
import { apiFetch } from "@/lib/api";
import { userFacingCatchError } from "@/lib/user-facing-error";

const INITIAL_VALUES: CreateApplicationFormValues = {
  company: "",
  position: "",
  location: "",
  notes: "",
  jobUrl: "",
  salaryMin: "",
  salaryMax: "",
  status: "APPLIED",
};

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-sky-200/90 bg-white/85 px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/45";

export function CreateApplicationForm() {
  const router = useRouter();
  const [values, setValues] = useState<CreateApplicationFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CreateApplicationFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  function updateField<Key extends keyof CreateApplicationFormValues>(
    key: Key,
    value: CreateApplicationFormValues[Key],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleTextChange(
    key: keyof CreateApplicationFormValues,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    updateField(key, e.target.value);
  }

  function runValidation(): boolean {
    const nextErrors = validateCreateApplication(values);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!runValidation()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = toCreateApplicationPayload(values);
      const res = await apiFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setFormError(await readApiErrorMessage(res));
        return;
      }

      setDashboardCreatedBannerPending();
      router.push("/dashboard?created=1");
    } catch (err) {
      setFormError(userFacingCatchError(err, "create application"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-transparent text-slate-800">
      <main className="relative z-10 mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              New application
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Capture role details in one polished flow. Keep your pipeline clean, searchable,
              and ready for action.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-300/80 bg-white/60 px-4 text-sm font-medium text-sky-900 backdrop-blur-sm transition-colors hover:border-sky-400 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Back to dashboard
          </Link>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border border-sky-200/70 bg-white/75 p-6 shadow-[0_16px_56px_-14px_rgba(33,150,243,0.18)] backdrop-blur-xl sm:p-8"
        >
          {formError ? (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-rose-300/60 bg-rose-50/90 px-4 py-3 text-sm text-rose-900"
            >
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-medium text-slate-800">
                Company *
              </label>
              <input
                id="company"
                name="company"
                value={values.company}
                onChange={(e) => handleTextChange("company", e)}
                aria-invalid={Boolean(errors.company)}
                aria-describedby={errors.company ? "company-error" : undefined}
                className={inputClass}
                placeholder="Acme Inc."
              />
              {errors.company ? (
                <p id="company-error" className="text-sm text-rose-700">
                  {errors.company}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="position" className="block text-sm font-medium text-slate-800">
                Position *
              </label>
              <input
                id="position"
                name="position"
                value={values.position}
                onChange={(e) => handleTextChange("position", e)}
                aria-invalid={Boolean(errors.position)}
                aria-describedby={errors.position ? "position-error" : undefined}
                className={inputClass}
                placeholder="Frontend Engineer"
              />
              {errors.position ? (
                <p id="position-error" className="text-sm text-rose-700">
                  {errors.position}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-slate-800">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={values.location}
                onChange={(e) => handleTextChange("location", e)}
                className={inputClass}
                placeholder="Remote / Casablanca"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-slate-800">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={values.status}
                onChange={(e) => handleTextChange("status", e)}
                className={inputClass}
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="jobUrl" className="block text-sm font-medium text-slate-800">
                Job URL
              </label>
              <input
                id="jobUrl"
                name="jobUrl"
                type="url"
                value={values.jobUrl}
                onChange={(e) => handleTextChange("jobUrl", e)}
                aria-invalid={Boolean(errors.jobUrl)}
                aria-describedby={errors.jobUrl ? "job-url-error" : undefined}
                className={inputClass}
                placeholder="https://company.com/jobs/frontend-engineer"
              />
              {errors.jobUrl ? (
                <p id="job-url-error" className="text-sm text-rose-700">
                  {errors.jobUrl}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="salaryMin" className="block text-sm font-medium text-slate-800">
                Salary min
              </label>
              <input
                id="salaryMin"
                name="salaryMin"
                inputMode="numeric"
                value={values.salaryMin}
                onChange={(e) => handleTextChange("salaryMin", e)}
                aria-invalid={Boolean(errors.salaryMin)}
                aria-describedby={errors.salaryMin ? "salary-min-error" : undefined}
                className={inputClass}
                placeholder="45000"
              />
              {errors.salaryMin ? (
                <p id="salary-min-error" className="text-sm text-rose-700">
                  {errors.salaryMin}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="salaryMax" className="block text-sm font-medium text-slate-800">
                Salary max
              </label>
              <input
                id="salaryMax"
                name="salaryMax"
                inputMode="numeric"
                value={values.salaryMax}
                onChange={(e) => handleTextChange("salaryMax", e)}
                aria-invalid={Boolean(errors.salaryMax)}
                aria-describedby={errors.salaryMax ? "salary-max-error" : undefined}
                className={inputClass}
                placeholder="65000"
              />
              {errors.salaryMax ? (
                <p id="salary-max-error" className="text-sm text-rose-700">
                  {errors.salaryMax}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-800">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={values.notes}
                onChange={(e) => handleTextChange("notes", e)}
                className={inputClass}
                placeholder="Referral, stack, interview timeline, and key notes..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              * Required fields. Values are validated client-side before submit.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-[transform,box-shadow,opacity] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden
                  />
                  Saving application…
                </span>
              ) : (
                "Create application"
              )}
            </button>
          </div>

          {hasErrors ? <p className="sr-only">Form has validation errors.</p> : null}
        </form>
      </main>
    </div>
  );
}
