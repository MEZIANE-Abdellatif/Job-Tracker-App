"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

import { setAccessToken } from "@/lib/access-token";
import {
  readApiErrorMessage,
  validateEmail,
  validatePassword,
} from "@/lib/auth-form-utils";
import { apiFetch } from "@/lib/api";
import type { LoginResponse } from "@/types";

export function LoginForm() {
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
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as Partial<LoginResponse>;
        if (typeof data.accessToken === "string" && data.accessToken.length > 0) {
          setAccessToken(data.accessToken);
          router.push("/dashboard");
          return;
        }
        setFormError("Invalid response from server.");
        return;
      }

      setFormError(await readApiErrorMessage(res));
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
        className="pointer-events-none absolute -right-20 top-10 h-[22rem] w-[22rem] rounded-full bg-emerald-600/25 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-violet-600/35 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-cyan-500/15 blur-[85px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/90">
            Job tracker
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Sign in to pick up where you left off—your pipeline, one glance
            away.
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
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-200"
              >
                Email
              </label>
              <input
                id="login-email"
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
                aria-describedby={emailError ? "login-email-error" : undefined}
                className="min-h-11 w-full rounded-xl border border-slate-600/80 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition-[border-color,box-shadow] placeholder:text-slate-500 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/35"
                placeholder="you@example.com"
              />
              {emailError ? (
                <p
                  id="login-email-error"
                  className="text-sm text-red-300"
                  role="status"
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError)
                    setPasswordError(validatePassword(e.target.value));
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                aria-invalid={passwordError !== null}
                aria-describedby={
                  passwordError ? "login-password-error" : undefined
                }
                className="min-h-11 w-full rounded-xl border border-slate-600/80 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition-[border-color,box-shadow] placeholder:text-slate-500 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/35"
                placeholder="Your password"
              />
              {passwordError ? (
                <p
                  id="login-password-error"
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
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 px-4 text-base font-semibold text-white shadow-lg shadow-cyan-900/30 transition-[transform,box-shadow,opacity] hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-cyan-800/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            New here?{" "}
            <Link
              href="/register"
              className="font-medium text-cyan-400 underline-offset-4 transition-colors hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Sessions use secure cookies; your access token stays in memory only.
        </p>
      </div>
    </div>
  );
}
