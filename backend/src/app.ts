import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { createCorsOptions } from "./lib/cors-config";
import { HttpError } from "./lib/http-error";
import { authRateLimiter } from "./middleware/auth-rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { applicationsRouter } from "./modules/applications/applications.router";
import { authRouter } from "./modules/auth/auth.router";
import { prisma } from "./prisma/client";

const app = express();

app.use(helmet());
app.use(cors(createCorsOptions()));

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res, next) => {
  void prisma
    .$queryRawUnsafe("SELECT 1")
    .then(() => {
      res.json({ status: "ok", database: "connected" });
    })
    .catch(() => {
      next(new HttpError(503, "Database disconnected"));
    });
});

app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/applications", applicationsRouter);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Not found"));
});

/** Must remain last — handles all errors as `{ statusCode, message }`. */
app.use(errorHandler);

export { app };
