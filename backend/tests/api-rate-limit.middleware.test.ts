import express, { type RequestHandler } from "express";
import request from "supertest";

function createLimiterApp(middleware: RequestHandler) {
  const app = express();
  app.get("/test", middleware, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.post("/test", middleware, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.delete("/test", middleware, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("api rate limit middleware", () => {
  const prevNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("skips limits in test environment", async () => {
    process.env.NODE_ENV = "test";
    jest.resetModules();
    const { createApplicationRateLimiter } = await import("../src/middleware/api-rate-limit");
    const app = createLimiterApp(createApplicationRateLimiter);

    for (let i = 0; i < 32; i += 1) {
      await request(app).post("/test").expect(200);
    }
  });

  it.each([
    ["createApplicationRateLimiter", "post", 30],
    ["deleteApplicationRateLimiter", "delete", 20],
    ["readApplicationRateLimiter", "get", 100],
    ["profileRateLimiter", "get", 60],
  ] as const)(
    "enforces %s max requests",
    async (limiterKey, method, maxAllowed) => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const limiters = await import("../src/middleware/api-rate-limit");
      const middleware = limiters[limiterKey];
      const app = createLimiterApp(middleware);

      for (let i = 0; i < maxAllowed; i += 1) {
        await request(app)[method]("/test").expect(200);
      }

      const blocked = await request(app)[method]("/test").expect(429);
      expect(blocked.body).toEqual({
        statusCode: 429,
        message: "Too many requests",
      });
    },
  );
});
