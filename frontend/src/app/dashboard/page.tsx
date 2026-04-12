import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Job tracker dashboard",
};

export default function DashboardPage() {
  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-600/10 blur-[100px]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
            Job tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            You&apos;re signed in. Your access token lives in memory for this
            tab—refresh the page to sign out of the session header (refresh
            cookies may still apply until logout).
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-600/80 px-5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              Back to sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/35 transition-[transform,box-shadow] hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98]"
            >
              Register another account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
