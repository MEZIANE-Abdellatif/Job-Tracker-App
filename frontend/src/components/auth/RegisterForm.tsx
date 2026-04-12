"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/api";
import type { ApiErrorBody } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | null {
  const t = value.trim();
  if (!t) return "Email is required";
  if (!EMAIL_RE.test(t)) return "Enter a valid email address";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Use at least 8 characters";
  return null;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as Partial<ApiErrorBody>;
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
  } catch {
    /* ignore */
  }
  return "Something went wrong. Please try again.";
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runClientValidation = useCallback((): boolean => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    return eErr === null && pErr === null;
  }, [email, password]);

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setFormError(null);
    if (!runClientValidation()) return;

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (res.ok) {
        router.push("/login");
        return;
      }

      setFormError(await readErrorMessage(res));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not reach the server.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[80px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
            Job tracker
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Start organizing applications with a calm, focused workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              >
                {formError}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="register-email"
                className="block text-sm font-medium text-slate-200"
              >
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(validateEmail(e.target.value));
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                aria-invalid={emailError !== null}
                aria-describedby={
                  emailError ? "register-email-error" : undefined
                }
                className="min-h-11 w-full rounded-xl border border-slate-600/80 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition-[border-color,box-shadow] placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/35"
                placeholder="you@example.com"
              />
              {emailError ? (
                <p
                  id="register-email-error"
                  className="text-sm text-red-300"
                  role="status"
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="register-password"
                className="block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError)
                    setPasswordError(validatePassword(e.target.value));
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                aria-invalid={passwordError !== null}
                aria-describedby={
                  passwordError ? "register-password-error" : undefined
                }
                className="min-h-11 w-full rounded-xl border border-slate-600/80 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition-[border-color,box-shadow] placeholder:text-slate-500 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/35"
                placeholder="At least 8 characters"
              />
              {passwordError ? (
                <p
                  id="register-password-error"
                  className="text-sm text-red-300"
                  role="status"
                >
                  {passwordError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition-[transform,box-shadow,opacity] hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-800/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-400 underline-offset-4 transition-colors hover:text-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          By continuing, you agree to use this app responsibly.
        </p>
      </div>
    </div>
  );
}
