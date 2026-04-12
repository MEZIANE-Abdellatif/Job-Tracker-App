"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAccessToken } from "@/lib/access-token";

export type AuthGuardProps = {
  children: React.ReactNode;
  /** Where to send users with no access token (default `/login`). */
  loginHref?: string;
  /** Append `?from=<current path>` so login can return here later. */
  preserveReturnUrl?: boolean;
};

type GuardState = "checking" | "allowed" | "redirecting";

/**
 * Client guard for in-memory access tokens. Wrap a layout or page segment
 * (e.g. `app/dashboard/layout.tsx`) so all child routes require auth.
 */
export function AuthGuard({
  children,
  loginHref = "/login",
  preserveReturnUrl = true,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    const query =
      preserveReturnUrl && pathname.length > 0
        ? `?from=${encodeURIComponent(pathname)}`
        : "";
    const target = `${loginHref}${query}`;

    const id = requestAnimationFrame(() => {
      if (getAccessToken() !== null) {
        setState("allowed");
        return;
      }
      setState("redirecting");
      router.replace(target);
    });

    return () => cancelAnimationFrame(id);
  }, [router, pathname, loginHref, preserveReturnUrl]);

  if (state === "allowed") {
    return <>{children}</>;
  }

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-4 text-slate-100"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400"
        aria-hidden
      />
      <p className="sr-only">Checking authentication…</p>
    </div>
  );
}
