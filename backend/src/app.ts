import cookieParser from "cookie-parser";
import express from "express";

import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.router";
import { prisma } from "./prisma/client";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  void prisma
    .$queryRawUnsafe("SELECT 1")
    .then(() => {
      res.json({ status: "ok", database: "connected" });
    })
    .catch(() => {
      res.status(503).json({ status: "error", database: "disconnected" });
    });
});

app.use("/api/auth", authRouter);

app.use(errorHandler);

export { app };
