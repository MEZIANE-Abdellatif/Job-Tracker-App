import type { Metadata } from "next";

import { HomeJobBoardLinks } from "@/components/home/HomeJobBoardLinks";
import { HomePrimaryActions } from "@/components/home/HomePrimaryActions";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: BRAND_NAME },
};

export default function Home() {
  return (
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-transparent text-slate-800">
      <main className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold tracking-[0.22em] text-sky-700 sm:text-base">
          {BRAND_NAME}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Stay on top of every application
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          Sign in to manage your pipeline, or create an account to get started.
        </p>
        <HomePrimaryActions />
        <HomeJobBoardLinks />
      </main>
    </div>
  );
}
