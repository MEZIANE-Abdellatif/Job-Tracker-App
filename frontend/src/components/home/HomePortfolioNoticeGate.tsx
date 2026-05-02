"use client";

import { usePathname } from "next/navigation";

import { HomePortfolioNotice } from "@/components/home/HomePortfolioNotice";

/** Renders the portfolio notice only on `/` so it is not clipped by page-level overflow. */
export function HomePortfolioNoticeGate() {
  const pathname = usePathname();
  if (pathname !== "/") {
    return null;
  }
  return <HomePortfolioNotice />;
}
