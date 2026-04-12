import type { RequestHandler } from "express";

import { HttpError } from "../lib/http-error";
import { verifyAccessToken } from "../modules/auth/auth.service";

/**
 * Requires `Authorization: Bearer <access_jwt>`.
 * Verification is performed in auth.service (SECURITY.md); this middleware only parses the header and sets req.user.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  const raw = authHeader.slice("Bearer ".length).trim();
  if (raw.length === 0) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  try {
    const { id, email } = verifyAccessToken(raw);
    req.user = { id, email };
    next();
  } catch (err) {
    next(err);
  }
};
