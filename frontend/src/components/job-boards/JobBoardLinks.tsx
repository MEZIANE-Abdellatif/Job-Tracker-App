import Image from "next/image";

import { JOB_BOARD_LOGO_PX, JOB_BOARDS } from "@/lib/job-boards";

const cardClassName =
  "group flex w-full min-h-[3.25rem] max-w-full items-center gap-2 rounded-xl border border-sky-200/80 bg-gradient-to-br from-white/95 via-white/85 to-sky-50/50 px-2.5 py-2.5 shadow-sm ring-1 ring-white/60 backdrop-blur-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50/70 hover:shadow-md hover:shadow-sky-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:gap-2.5 sm:px-3 sm:py-3";

const nameClassName =
  "min-w-0 flex-1 text-[0.8125rem] font-semibold leading-snug tracking-tight sm:text-sm";

const gradientNameClassName =
  "bg-gradient-to-r from-slate-900 via-sky-900 to-[#2196F3] bg-clip-text text-transparent transition-[filter] duration-200 ease-out group-hover:brightness-110";

type JobBoardLinksProps = {
  /** Extra classes on the root `<nav>`. */
  className?: string;
  /**
   * `grid` — home-style 2×3 grid.
   * `scroll` — single horizontal row with smooth scroll (dashboard).
   */
  variant?: "grid" | "scroll";
};

export function JobBoardLinks({
  className = "",
  variant = "grid",
}: JobBoardLinksProps) {
  const listClassName =
    variant === "grid"
      ? "grid grid-cols-2 gap-2.5 p-0 sm:grid-cols-3 sm:gap-3"
      : "flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden";

  return (
    <nav
      className={`w-full ${className}`.trim()}
      aria-label="External job search websites"
    >
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-500 sm:text-left">
        Search on job boards
      </p>
      <ul className={listClassName}>
        {JOB_BOARDS.map(({ name, href, imageSrc }) => (
          <li
            key={href}
            className={`list-none ${variant === "scroll" ? "min-w-[9.5rem] max-w-[11rem] shrink-0 snap-start sm:min-w-[10.5rem]" : ""}`}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} (opens in new tab)`}
              className={cardClassName}
            >
              <Image
                src={imageSrc}
                alt=""
                width={JOB_BOARD_LOGO_PX}
                height={JOB_BOARD_LOGO_PX}
                className="size-8 shrink-0 rounded-md bg-white/90 object-contain p-0.5 ring-1 ring-slate-200/70"
              />
              <span className={nameClassName}>
                <span className={gradientNameClassName}>{name}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
