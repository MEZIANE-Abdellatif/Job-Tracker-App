"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { clearAccessToken } from "@/lib/access-token";
import { readApiErrorMessage } from "@/lib/auth-form-utils";
import { apiFetch } from "@/lib/api";
import { userFacingCatchError } from "@/lib/user-facing-error";

type FormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Use at least 8 characters";
  return null;
}

function validateForm(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): FormErrors {
  const errors: FormErrors = {};
  const currentPasswordError = validatePassword(currentPassword);
  if (currentPasswordError) errors.currentPassword = currentPasswordError;

  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;

  const confirmError = validatePassword(confirmNewPassword);
  if (confirmError) {
    errors.confirmNewPassword = confirmError;
  } else if (newPassword !== confirmNewPassword) {
    errors.confirmNewPassword = "Password confirmation does not match";
  }

  if (
    !errors.currentPassword &&
    !errors.newPassword &&
    currentPassword.length >= 8 &&
    newPassword.length >= 8 &&
    currentPassword === newPassword
  ) {
    errors.newPassword = "New password must be different from current password";
  }

  return errors;
}

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateForm(currentPassword, newPassword, confirmNewPassword);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      if (!res.ok) {
        setFormError(await readApiErrorMessage(res));
        return;
      }

      clearAccessToken();
      router.push("/login");
    } catch (err) {
      setFormError(userFacingCatchError(err, "change password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full rounded-2xl border border-sky-200/70 bg-white/70 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Security</h2>
      <p className="mt-1 text-sm text-slate-600">
        Update your password. You will be asked to sign in again after saving.
      </p>

      <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-300/60 bg-rose-50/90 px-4 py-3 text-sm text-rose-900"
          >
            {formError}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="current-password" className="block text-sm font-medium text-slate-800">
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (hasErrors) {
                setErrors(validateForm(e.target.value, newPassword, confirmNewPassword));
              }
            }}
            onBlur={() => setErrors(validateForm(currentPassword, newPassword, confirmNewPassword))}
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
            className="min-h-11 w-full rounded-xl border border-sky-200/90 bg-white/90 px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-sky-400 focus:ring-2 focus:ring-sky-300/45"
            placeholder="Current password"
          />
          {errors.currentPassword ? (
            <p id="current-password-error" className="text-sm text-rose-700" role="status">
              {errors.currentPassword}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-800">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (hasErrors) {
                setErrors(validateForm(currentPassword, e.target.value, confirmNewPassword));
              }
            }}
            onBlur={() => setErrors(validateForm(currentPassword, newPassword, confirmNewPassword))}
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? "new-password-error" : undefined}
            className="min-h-11 w-full rounded-xl border border-sky-200/90 bg-white/90 px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-sky-400 focus:ring-2 focus:ring-sky-300/45"
            placeholder="At least 8 characters"
          />
          {errors.newPassword ? (
            <p id="new-password-error" className="text-sm text-rose-700" role="status">
              {errors.newPassword}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-800">
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            name="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              if (hasErrors) {
                setErrors(validateForm(currentPassword, newPassword, e.target.value));
              }
            }}
            onBlur={() => setErrors(validateForm(currentPassword, newPassword, confirmNewPassword))}
            aria-invalid={Boolean(errors.confirmNewPassword)}
            aria-describedby={errors.confirmNewPassword ? "confirm-new-password-error" : undefined}
            className="min-h-11 w-full rounded-xl border border-sky-200/90 bg-white/90 px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-sky-400 focus:ring-2 focus:ring-sky-300/45"
            placeholder="Re-enter new password"
          />
          {errors.confirmNewPassword ? (
            <p id="confirm-new-password-error" className="text-sm text-rose-700" role="status">
              {errors.confirmNewPassword}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2196F3] to-[#5BB8F5] px-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-[transform,box-shadow,opacity] hover:from-[#1b87e0] hover:to-[#4aadf0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden
              />
              Updating password...
            </span>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </section>
  );
}
