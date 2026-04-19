export type JobBoard = {
  readonly name: string;
  readonly href: string;
  readonly imageSrc: string;
};

/** Small favicon display size (CSS px); avoids upscaling blurry raster icons. */
export const JOB_BOARD_LOGO_PX = 32;

/** Outbound job search sites (no French-only boards). */
export const JOB_BOARDS: readonly JobBoard[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/jobs/",
    imageSrc: "/job-boards/linkedin.png",
  },
  {
    name: "Indeed",
    href: "https://www.indeed.com/",
    imageSrc: "/job-boards/indeed.png",
  },
  {
    name: "Pracuj.pl",
    href: "https://www.pracuj.pl/",
    imageSrc: "/job-boards/pracuj.png",
  },
  {
    name: "The Protocol",
    href: "https://theprotocol.it/",
    imageSrc: "/job-boards/theprotocol.png",
  },
  {
    name: "No Fluff Jobs",
    href: "https://nofluffjobs.com/",
    imageSrc: "/job-boards/nofluffjobs.png",
  },
  {
    name: "Just Join IT",
    href: "https://justjoin.it/",
    imageSrc: "/job-boards/justjoinit.png",
  },
];
