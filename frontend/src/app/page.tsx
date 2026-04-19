import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-transparent text-slate-800">
      <main className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">
          Job tracker
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Stay on top of every application
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          Sign in to manage your pipeline, or create an account to get started.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-6 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition-[transform,box-shadow] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-sky-300/90 bg-white/50 px-6 text-base font-medium text-sky-900 backdrop-blur-sm transition-colors hover:border-sky-400 hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500 sm:text-left">
          <Link
            href="/dashboard"
            className="text-sky-700 underline-offset-4 transition-colors hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
