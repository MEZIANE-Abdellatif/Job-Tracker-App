"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AuthBackToHomeLink } from "@/components/auth/AuthBackToHomeLink";
import { apiFetch } from "@/lib/api";
import { BRAND_NAME } from "@/lib/brand";
import { readSafeApiErrorMessage, userFacingCatchError } from "@/lib/user-facing-error";
import type {
  ProfileAnalytics,
  ProfileAnalyticsRange,
  ProfileCompanies,
  ProfileSummary,
} from "@/types";

const RANGES: Array<{ value: ProfileAnalyticsRange; label: string }> = [
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

const STATUS_KEYS: Array<keyof ProfileAnalytics["statusDistribution"]> = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
];

function formatDate(iso: string | null): string {
  if (iso === null) return "No activity yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function formatWeekLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Week";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProfilePage() {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [companies, setCompanies] = useState<ProfileCompanies | null>(null);
  const [range, setRange] = useState<ProfileAnalyticsRange>("30d");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingSummary(true);
      setLoadingCompanies(true);
      setError(null);
      try {
        const [summaryRes, companiesRes] = await Promise.all([
          apiFetch("/api/profile/summary"),
          apiFetch("/api/profile/companies"),
        ]);

        if (!summaryRes.ok) {
          throw new Error(await readSafeApiErrorMessage(summaryRes, "Could not load profile summary."));
        }
        if (!companiesRes.ok) {
          throw new Error(
            await readSafeApiErrorMessage(companiesRes, "Could not load company insights."),
          );
        }

        const [summaryJson, companiesJson] = await Promise.all([
          summaryRes.json() as Promise<ProfileSummary>,
          companiesRes.json() as Promise<ProfileCompanies>,
        ]);
        if (!cancelled) {
          setSummary(summaryJson);
          setCompanies(companiesJson);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : userFacingCatchError(err, "profile fetch"));
        }
      } finally {
        if (!cancelled) {
          setLoadingSummary(false);
          setLoadingCompanies(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingAnalytics(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/profile/analytics?range=${range}`);
        if (!res.ok) {
          throw new Error(await readSafeApiErrorMessage(res, "Could not load profile analytics."));
        }
        const json = (await res.json()) as ProfileAnalytics;
        if (!cancelled) {
          setAnalytics(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : userFacingCatchError(err, "analytics fetch"));
        }
      } finally {
        if (!cancelled) {
          setLoadingAnalytics(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const isLoading = loadingSummary || loadingCompanies || loadingAnalytics;
  const showEmpty = summary?.totalApplications === 0;

  const statusCards = useMemo(
    () =>
      STATUS_KEYS.map((key) => ({
        key,
        count: analytics?.statusDistribution[key] ?? 0,
      })),
    [analytics],
  );

  const weeklyTrendData = useMemo(
    () =>
      (analytics?.weeklyTrend ?? []).slice(-8).map((point) => ({
        label: formatWeekLabel(point.weekStart),
        count: point.count,
      })),
    [analytics],
  );
  const weeklyTrendHasData = weeklyTrendData.some((point) => point.count > 0);

  return (
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-transparent text-slate-800">
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <AuthBackToHomeLink />
        <div className="mt-4 rounded-2xl border border-sky-200/70 bg-white/75 p-6 shadow-[0_16px_56px_-14px_rgba(33,150,243,0.18)] backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold tracking-[0.22em] text-sky-700 sm:text-base">{BRAND_NAME}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Profile</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Account summary and analytics for your application pipeline.
          </p>

          {isLoading ? (
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-600" role="status" aria-live="polite">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" aria-hidden />
              Loading profile insights...
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="mt-6 rounded-xl border border-rose-300/60 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && summary ? (
            <>
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Profile summary</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{summary.email}</p>
                  </div>
                  <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(summary.accountCreatedAt)}</p>
                  </div>
                  <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Last activity</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(summary.lastActivityDate)}</p>
                  </div>
                  <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total applications</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalApplications}</p>
                  </div>
                  <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Active pipeline</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.activePipelineCount}</p>
                  </div>
                </div>
              </section>

              {showEmpty ? (
                <section className="mt-8 rounded-xl border border-dashed border-sky-300/70 bg-sky-50/50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">No data yet</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Add your first application from the dashboard to unlock profile analytics.
                  </p>
                </section>
              ) : (
                <>
                  <section className="mt-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">Status distribution</h2>
                      <div className="flex items-center gap-2">
                        {RANGES.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setRange(item.value)}
                            aria-pressed={range === item.value}
                            className={`min-h-11 rounded-lg border px-3 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                              range === item.value
                                ? "border-sky-400/70 bg-sky-100/80 text-sky-900"
                                : "border-sky-200/70 bg-white/70 text-slate-700 hover:bg-sky-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {statusCards.map((card) => (
                        <div key={card.key} className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">{card.key}</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.count}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Interview rate</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {formatPercent(analytics?.interviewRate ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Offer rate</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {formatPercent(analytics?.offerRate ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">This period</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {analytics?.applicationsThisPeriod ?? 0}
                      </p>
                    </div>
                  </section>

                  <section className="mt-8">
                    <h2 className="text-lg font-semibold text-slate-900">Weekly trend</h2>
                    <div className="mt-4 rounded-xl border border-sky-200/70 bg-white/80 p-4">
                      {weeklyTrendHasData ? (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={weeklyTrendData}
                              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: "#475569" }}
                                axisLine={{ stroke: "#cbd5e1" }}
                                tickLine={false}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 12, fill: "#475569" }}
                                axisLine={{ stroke: "#cbd5e1" }}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "0.75rem",
                                  borderColor: "#bae6fd",
                                }}
                                labelStyle={{ color: "#0f172a" }}
                              />
                              <Bar dataKey="count" name="Applications" fill="#0284c7" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">No data yet</p>
                      )}
                    </div>
                  </section>

                  <section className="mt-8">
                    <h2 className="text-lg font-semibold text-slate-900">Company insights</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4 lg:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Top 5 companies</p>
                        <ul className="mt-2 space-y-2">
                          {(companies?.topCompanies ?? []).map((row) => (
                            <li key={row.companyName} className="flex items-center justify-between text-sm">
                              <span className="text-slate-800">{row.companyName}</span>
                              <span className="font-medium text-slate-900">{row.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-sky-200/70 bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Most recent company</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {companies?.mostRecentCompany ?? "No recent company"}
                        </p>
                        <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Duplicates</p>
                        <ul className="mt-2 space-y-2">
                          {(companies?.duplicateApplications ?? []).map((row) => (
                            <li key={row.companyName} className="flex items-center justify-between text-sm">
                              <span className="text-slate-800">{row.companyName}</span>
                              <span className="font-medium text-slate-900">{row.count}</span>
                            </li>
                          ))}
                          {(companies?.duplicateApplications.length ?? 0) === 0 ? (
                            <li className="text-sm text-slate-600">No duplicate applications.</li>
                          ) : null}
                        </ul>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
