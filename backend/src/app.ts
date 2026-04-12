import express from "express";

import { prisma } from "./prisma/client";

const app = express();

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

export { app };
