import type { ErrorRequestHandler } from "express";

import { isHttpError } from "../lib/http-error";

/** Terminal error handler — `next` is required by Express but unused here. */
export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express ErrorRequestHandler arity
  _next,
): void => {
  if (isHttpError(err)) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message;
  res.status(statusCode).json({ statusCode, message });
};
