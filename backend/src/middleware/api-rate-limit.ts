import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

const baseOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ statusCode: 429, message: "Too many requests" });
  },
};

export const createApplicationRateLimiter = rateLimit({
  ...baseOptions,
  max: 30,
});

export const deleteApplicationRateLimiter = rateLimit({
  ...baseOptions,
  max: 20,
});

export const readApplicationRateLimiter = rateLimit({
  ...baseOptions,
  max: 100,
});

export const profileRateLimiter = rateLimit({
  ...baseOptions,
  max: 60,
});
