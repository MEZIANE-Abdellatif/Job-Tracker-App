"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { clearAccessToken } from "@/lib/access-token";
import { apiFetch } from "@/lib/api";

export function SessionActions() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!changePasswordOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalCloseRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setChangePasswordOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [changePasswordOpen]);

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

  function openChangePasswordModal() {
    setMenuOpen(false);
    setChangePasswordOpen(true);
  }

  function closeChangePasswordModal() {
    setChangePasswordOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Open account menu"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-sky-300/80 bg-white/70 text-xl text-sky-900 transition-colors hover:bg-white/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        ⋮
      </button>

      {menuOpen ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-sky-200/80 bg-white p-2 shadow-lg shadow-sky-500/15"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openChangePasswordModal}
            className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-slate-800 transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Change password
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void handleLogout();
            }}
            disabled={loggingOut}
            className="mt-1 flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-rose-900 transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : null}

      {logoutError ? <p className="mt-2 text-xs text-rose-800">{logoutError}</p> : null}

      {mounted && changePasswordOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm"
              onClick={closeChangePasswordModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
                className="my-auto w-full max-w-md rounded-2xl border border-sky-200/80 bg-white p-5 shadow-[0_22px_70px_-24px_rgba(14,116,144,0.45)] sm:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 id="change-password-title" className="text-lg font-semibold text-slate-900">
                      Change password
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Update your password. You will need to sign in again after saving.
                    </p>
                  </div>
                  <button
                    ref={modalCloseRef}
                    type="button"
                    onClick={closeChangePasswordModal}
                    aria-label="Close dialog"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  >
                    ×
                  </button>
                </div>

                <ChangePasswordForm onSuccess={closeChangePasswordModal} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
