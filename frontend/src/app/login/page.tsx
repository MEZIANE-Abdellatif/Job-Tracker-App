import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Log in to Job tracker",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[90px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
            Job tracker
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Sign in
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Login form will live here. New here?{" "}
            <Link
              href="/register"
              className="font-medium text-violet-400 underline-offset-4 transition-colors hover:text-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
