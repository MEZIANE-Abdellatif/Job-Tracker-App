"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { clearAccessToken } from "@/lib/access-token";
import { apiFetch } from "@/lib/api";

export function SessionActions() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const res = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        setLogoutError("Could not end your session. Please try again.");
        return;
      }
      clearAccessToken();
      router.push("/login");
    } catch {
      setLogoutError("Could not reach the server.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <ChangePasswordForm />

      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-300/70 bg-rose-50/90 px-5 text-sm font-semibold text-rose-900 transition-colors hover:bg-rose-100/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
        {logoutError ? <p className="text-xs text-rose-800">{logoutError}</p> : null}
      </div>
    </div>
  );
}
