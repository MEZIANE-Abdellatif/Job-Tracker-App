import type { CorsOptions } from "cors";

/**
 * Single allowed browser origin (full URL, no trailing slash), e.g. `http://localhost:3000`.
 * In production, set `CORS_ORIGIN` explicitly. In dev/test, defaults to `http://localhost:3000` when unset.
 */
export function resolveAllowedCorsOrigin(): string | false {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw && raw.length > 0) {
    return raw;
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return "http://localhost:3000";
}

/** Supertest and other non-browser clients omit `Origin`; those requests are allowed. */
export function createCorsOptions(): CorsOptions {
  const allowed = resolveAllowedCorsOrigin();
  return {
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (origin === undefined) {
        callback(null, true);
        return;
      }
      if (allowed === false) {
        callback(null, false);
        return;
      }
      callback(null, origin === allowed);
    },
  };
}
