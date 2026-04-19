import Link from "next/link";

export function AuthBackToHomeLink() {
  return (
    <div className="mb-5 sm:mb-6">
      <Link
        href="/"
        className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg py-2 pr-2 pl-1 text-sm font-medium text-slate-500 transition-colors hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:-ml-1"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-4 shrink-0 stroke-[1.75] text-slate-400 transition-[color,transform] group-hover:-translate-x-0.5 group-hover:text-sky-600"
          aria-hidden
        >
          <path
            d="M15 18 9 12l6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="border-b border-transparent pb-px transition-[border-color] group-hover:border-sky-400/80">
          Home
        </span>
      </Link>
    </div>
  );
}
