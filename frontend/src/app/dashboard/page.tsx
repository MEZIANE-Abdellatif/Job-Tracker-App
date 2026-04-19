import type { Metadata } from "next";

import { ApplicationsList } from "@/components/applications/ApplicationsList";
import { AuthBackToHomeLink } from "@/components/auth/AuthBackToHomeLink";
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
          <AuthBackToHomeLink />
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

          <div className="mt-10">
            <StatsBar />
          </div>

          <div className="my-12 h-px w-full bg-gradient-to-r from-transparent via-sky-200/80 to-transparent" />

          <div className="mt-2">
            <ApplicationsList />
          </div>

          <div className="mt-12">
            <SessionActions />
          </div>
        </div>
      </main>
    </div>
  );
}
