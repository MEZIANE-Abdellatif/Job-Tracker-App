import type { CookieOptions } from "express";
import ms, { type StringValue } from "ms";

import { HttpError } from "./http-error";

const SAME_SITE_VALUES = ["strict", "lax", "none"] as const;
type SameSite = (typeof SAME_SITE_VALUES)[number];

function parseSameSite(raw: string): SameSite {
  const normalized = raw.trim().toLowerCase();
  if (!SAME_SITE_VALUES.includes(normalized as SameSite)) {
    throw new HttpError(500, "Server configuration error");
  }
  return normalized as SameSite;
}

export function getRefreshCookieConfig(): { name: string; options: CookieOptions } {
  const ttl = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const maxAge = ms(ttl as StringValue);
  if (typeof maxAge !== "number" || Number.isNaN(maxAge)) {
    throw new HttpError(500, "Server configuration error");
  }

  const sameSiteRaw = process.env.REFRESH_COOKIE_SAME_SITE ?? "lax";
  const sameSite = parseSameSite(sameSiteRaw);

  const name = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";
  const path = process.env.REFRESH_COOKIE_PATH ?? "/";
  const httpOnly = process.env.REFRESH_COOKIE_HTTPONLY !== "false";
  const secure = process.env.REFRESH_COOKIE_SECURE === "true";

  return {
    name,
    options: {
      maxAge,
      path,
      httpOnly,
      secure,
      sameSite,
    },
  };
}

/** Options for `res.clearCookie` must match how the cookie was set (path, flags). */
export function getRefreshCookieClearOptions(): Pick<
  CookieOptions,
  "path" | "httpOnly" | "secure" | "sameSite"
> {
  const { options } = getRefreshCookieConfig();
  return {
    path: options.path,
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
  };
}
