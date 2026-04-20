import { readSafeApiErrorMessage } from "@/lib/user-facing-error";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const t = value.trim();
  if (!t) return "Email is required";
  if (!EMAIL_RE.test(t)) return "Enter a valid email address";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Use at least 8 characters";
  return null;
}

export async function readApiErrorMessage(res: Response): Promise<string> {
  return readSafeApiErrorMessage(res, "Something went wrong. Please try again.");
}
