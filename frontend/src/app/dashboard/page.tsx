import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationsList } from "@/components/applications/ApplicationsList";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { SessionActions } from "@/components/dashboard/SessionActions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Job tracker dashboard",
};

export default function DashboardPage() {
  return (
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-transparent text-slate-800">
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-2xl border border-sky-200/70 bg-white/75 p-8 shadow-[0_16px_56px_-14px_rgba(33,150,243,0.18)] backdrop-blur-xl sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">
            Job tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Track where every application stands—totals and status breakdown
            update from your account.
          </p>

          <div className="mt-6">
            <Link
              href="/dashboard/applications/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-[transform,box-shadow] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Add new application
            </Link>
          </div>

          <div className="mt-10">
            <StatsBar />
          </div>

          <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-sky-200/80 to-transparent" />

          <div className="mt-2">
            <ApplicationsList />
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <SessionActions />
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-[transform,box-shadow] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Register another account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
