"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { getAccessToken, subscribeAccessToken } from "@/lib/access-token";
import { tryRestoreSessionFromRefreshCookie } from "@/lib/api";

export type AuthGuardProps = {
  children: React.ReactNode;
  /** Where to send users with no access token (default `/login`). */
  loginHref?: string;
  /** Append `?from=<current path>` so login can return here later. */
  preserveReturnUrl?: boolean;
};

/**
 * Client guard: in-memory access token, with one refresh-cookie bootstrap after load
 * so full page refresh can restore the session without localStorage.
 */
export function AuthGuard({
  children,
  loginHref = "/login",
  preserveReturnUrl = true,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionResolved, setSessionResolved] = useState(
    () => getAccessToken() !== null,
  );

  const isAuthed = useSyncExternalStore(
    subscribeAccessToken,
    () => getAccessToken() !== null,
    () => false,
  );

  useEffect(() => {
    if (sessionResolved) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await tryRestoreSessionFromRefreshCookie();
      } finally {
        if (!cancelled) {
          setSessionResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionResolved]);

  useEffect(() => {
    if (!sessionResolved) {
      return;
    }
    if (isAuthed) {
      return;
    }
    const query =
      preserveReturnUrl && pathname.length > 0
        ? `?from=${encodeURIComponent(pathname)}`
        : "";
    const target = `${loginHref}${query}`;
    router.replace(target);
  }, [
    sessionResolved,
    isAuthed,
    router,
    pathname,
    loginHref,
    preserveReturnUrl,
  ]);

  if (!sessionResolved || !isAuthed) {
    return (
      <div
        className="flex min-h-full flex-1 flex-col items-center justify-center bg-transparent px-4 text-slate-800"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500"
          aria-hidden
        />
        <p className="sr-only">Checking authentication…</p>
      </div>
    );
  }

  return <>{children}</>;
}
