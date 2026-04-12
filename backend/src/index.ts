import "reflect-metadata";
import "dotenv/config";

import { app } from "./app";
import { prisma } from "./prisma/client";

const port = Number(process.env.PORT) || 3001;

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });

  const shutdown = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server.close((e) => (e ? reject(e) : resolve()));
    });
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

void start();
