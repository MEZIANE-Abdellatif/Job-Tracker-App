import type { ApiErrorBody } from "@/types";

/** Generic copy when the API fails or returns technical details we do not show to users. */
export const USER_FACING_ERROR =
  "Something went wrong. Please try again. Check the browser console if you need to debug.";

const TECHNICAL_MESSAGE =
  /prisma|invocation|P\d{4,}|postgres|database server|internal server error|relation\s|does not exist|column\s|syntax error|ECONNREFUSED|ETIMEDOUT|fetch failed/i;

function shouldSuppressMessage(message: string): boolean {
  const t = message.trim();
  if (t.length === 0) return false;
  if (t.length > 400) return true;
  return TECHNICAL_MESSAGE.test(t);
}

/**
 * Maps an error `Response` to a short, user-safe string.
 * Never surfaces Prisma/DB stack text; developers can inspect Network + console.
 */
export async function readSafeApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  if (res.status >= 500) {
    console.warn("[api]", res.status, res.url);
    return USER_FACING_ERROR;
  }

  try {
    const data = (await res.json()) as Partial<ApiErrorBody>;
    const msg = typeof data.message === "string" ? data.message.trim() : "";
    if (msg.length > 0) {
      if (shouldSuppressMessage(msg)) {
        console.warn("[api] suppressed technical message", res.status, msg.slice(0, 120));
        return USER_FACING_ERROR;
      }
      return msg;
    }
  } catch {
    /* ignore */
  }

  if (res.status >= 400) {
    return fallback;
  }

  return USER_FACING_ERROR;
}

/** Log the real error for developers; return generic user-facing text. */
export function userFacingCatchError(err: unknown, label?: string): string {
  console.error(label ?? "request failed", err);
  return USER_FACING_ERROR;
}
