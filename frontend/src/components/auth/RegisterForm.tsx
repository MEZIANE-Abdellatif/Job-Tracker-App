"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

import { AuthBackToHomeLink } from "@/components/auth/AuthBackToHomeLink";
import { BRAND_NAME } from "@/lib/brand";
import {
  readApiErrorMessage,
  validateEmail,
  validatePassword,
} from "@/lib/auth-form-utils";
import { apiFetch } from "@/lib/api";

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
    <div className="relative min-h-full flex-1 overflow-x-hidden bg-transparent text-slate-800">
      <div className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <AuthBackToHomeLink />
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-sm font-semibold tracking-[0.22em] text-sky-700 sm:text-base">
            {BRAND_NAME}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Start organizing applications with a calm, focused workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200/70 bg-white/75 p-6 shadow-[0_16px_56px_-14px_rgba(33,150,243,0.18)] backdrop-blur-xl sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-300/60 bg-rose-50/90 px-4 py-3 text-sm text-rose-900"
              >
                {formError}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="register-email"
                className="block text-sm font-medium text-slate-800"
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
                className="min-h-11 w-full rounded-xl border border-sky-200/90 bg-white/85 px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/45"
                placeholder="you@example.com"
              />
              {emailError ? (
                <p
                  id="register-email-error"
                  className="text-sm text-rose-700"
                  role="status"
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="register-password"
                className="block text-sm font-medium text-slate-800"
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
                className="min-h-11 w-full rounded-xl border border-sky-200/90 bg-white/85 px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/45"
                placeholder="At least 8 characters"
              />
              {passwordError ? (
                <p
                  id="register-password-error"
                  className="text-sm text-rose-700"
                  role="status"
                >
                  {passwordError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-4 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-[transform,box-shadow,opacity] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden
                  />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-sky-700 underline-offset-4 transition-colors hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
