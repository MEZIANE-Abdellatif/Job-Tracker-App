import { Status } from "@prisma/client";

import { HttpError } from "../../lib/http-error";
import * as profileRepository from "./profile.repository";
import type { ProfileAnalyticsRange } from "./profile.dto";

export type ProfileSummary = {
  email: string;
  accountCreatedAt: Date;
  totalApplications: number;
  activePipelineCount: number;
  lastActivityDate: Date | null;
};

export async function getProfileSummaryForUser(userId: string): Promise<ProfileSummary> {
  const user = await profileRepository.findProfileUserById(userId);
  if (user === null) {
    throw new HttpError(401, "Unauthorized");
  }

  const [totalApplications, activePipelineCount, lastActivityDate] = await Promise.all([
    profileRepository.countApplicationsByUserId(userId),
    profileRepository.countActivePipelineByUserId(userId),
    profileRepository.findLastActivityDateByUserId(userId),
  ]);

  return {
    email: user.email,
    accountCreatedAt: user.createdAt,
    totalApplications,
    activePipelineCount,
    lastActivityDate,
  };
}

type StatusDistribution = {
  Applied: number;
  Interview: number;
  Offer: number;
  Rejected: number;
  Ghosted: number;
};

type WeeklyTrendPoint = {
  weekStart: string;
  count: number;
};

export type ProfileAnalytics = {
  statusDistribution: StatusDistribution;
  interviewRate: number;
  offerRate: number;
  applicationsThisPeriod: number;
  weeklyTrend: WeeklyTrendPoint[];
  avgDaysToUpdate: number;
};

export type CompanyCount = {
  companyName: string;
  count: number;
};

export type ProfileCompaniesInsights = {
  topCompanies: CompanyCount[];
  mostRecentCompany: string | null;
  duplicateApplications: CompanyCount[];
};

export function calculateRate(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

export function aggregateCompanyCounts(rows: Array<{ company: string }>): CompanyCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.company.trim();
    if (key.length === 0) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([companyName, count]) => ({ companyName, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.companyName.localeCompare(b.companyName);
    });
}

export function selectTopCompanies(counts: CompanyCount[], limit: number): CompanyCount[] {
  return counts.slice(0, limit);
}

export function selectDuplicateCompanies(counts: CompanyCount[]): CompanyCount[] {
  return counts.filter((row) => row.count > 1);
}

function now(): Date {
  return new Date();
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcWeekMonday(d: Date): Date {
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday=0
  const start = startOfUtcDay(d);
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeStart(range: ProfileAnalyticsRange): Date | null {
  if (range === "all") return null;
  const d = startOfUtcDay(now());
  d.setUTCDate(d.getUTCDate() - (range === "30d" ? 30 : 90));
  return d;
}

function buildWeeklyTrend(rows: Array<{ appliedAt: Date }>): WeeklyTrendPoint[] {
  const thisWeek = startOfUtcWeekMonday(now());
  const weekStarts: Date[] = [];
  for (let i = 7; i >= 0; i -= 1) {
    const w = new Date(thisWeek);
    w.setUTCDate(w.getUTCDate() - i * 7);
    weekStarts.push(w);
  }

  const counts = new Map<string, number>();
  for (const w of weekStarts) {
    counts.set(isoDate(w), 0);
  }
  for (const row of rows) {
    const wk = isoDate(startOfUtcWeekMonday(row.appliedAt));
    if (counts.has(wk)) {
      counts.set(wk, (counts.get(wk) ?? 0) + 1);
    }
  }

  return weekStarts.map((w) => ({
    weekStart: isoDate(w),
    count: counts.get(isoDate(w)) ?? 0,
  }));
}

function averageDaysToUpdate(rows: Array<{ appliedAt: Date; updatedAt: Date }>): number {
  if (rows.length === 0) return 0;
  const totalDays = rows.reduce((acc, row) => {
    const ms = row.updatedAt.getTime() - row.appliedAt.getTime();
    return acc + Math.max(0, ms / (1000 * 60 * 60 * 24));
  }, 0);
  return Number((totalDays / rows.length).toFixed(2));
}

export async function getProfileAnalyticsForUser(
  userId: string,
  range: ProfileAnalyticsRange,
): Promise<ProfileAnalytics> {
  const user = await profileRepository.findProfileUserById(userId);
  if (user === null) {
    throw new HttpError(401, "Unauthorized");
  }

  const cutoff = rangeStart(range);
  const last8WeeksStart = (() => {
    const thisWeek = startOfUtcWeekMonday(now());
    const from = new Date(thisWeek);
    from.setUTCDate(from.getUTCDate() - 7 * 7);
    return from;
  })();

  const [statusRows, applicationsThisPeriod, trendRows, durationRows] = await Promise.all([
    profileRepository.findApplicationStatusesByUserId(userId),
    profileRepository.countApplicationsByUserIdSince(userId, cutoff),
    profileRepository.findApplicationAppliedDatesByUserIdSince(userId, last8WeeksStart),
    profileRepository.findApplicationDurationsByUserId(userId),
  ]);

  const distribution: StatusDistribution = {
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
    Ghosted: 0,
  };
  for (const row of statusRows) {
    if (row.status === Status.APPLIED) distribution.Applied += 1;
    if (row.status === Status.INTERVIEW) distribution.Interview += 1;
    if (row.status === Status.OFFER) distribution.Offer += 1;
    if (row.status === Status.REJECTED) distribution.Rejected += 1;
    if (row.status === Status.GHOSTED) distribution.Ghosted += 1;
  }

  const total = statusRows.length;
  return {
    statusDistribution: distribution,
    interviewRate: calculateRate(distribution.Interview, total),
    offerRate: calculateRate(distribution.Offer, total),
    applicationsThisPeriod,
    weeklyTrend: buildWeeklyTrend(trendRows),
    avgDaysToUpdate: averageDaysToUpdate(durationRows),
  };
}

export async function getProfileCompaniesForUser(
  userId: string,
): Promise<ProfileCompaniesInsights> {
  const user = await profileRepository.findProfileUserById(userId);
  if (user === null) {
    throw new HttpError(401, "Unauthorized");
  }

  const [companyRows, mostRecentCompany] = await Promise.all([
    profileRepository.findApplicationCompaniesByUserId(userId),
    profileRepository.findMostRecentCompanyByUserId(userId),
  ]);
  const counts = aggregateCompanyCounts(companyRows);
  return {
    topCompanies: selectTopCompanies(counts, 5),
    mostRecentCompany,
    duplicateApplications: selectDuplicateCompanies(counts),
  };
}
