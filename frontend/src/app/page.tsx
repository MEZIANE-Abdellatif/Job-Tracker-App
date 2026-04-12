import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-violet-600/30 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[90px]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
          Job tracker
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Stay on top of every application
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
          Sign in to manage your pipeline, or create an account to get started.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-[transform,box-shadow] hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600/80 px-6 text-base font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500 sm:text-left">
          <Link
            href="/dashboard"
            className="text-slate-400 underline-offset-4 transition-colors hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
