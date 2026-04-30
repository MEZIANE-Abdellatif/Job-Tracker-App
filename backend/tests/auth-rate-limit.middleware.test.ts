import express, { type RequestHandler } from "express";
import request from "supertest";

function createLimiterApp(middleware: RequestHandler) {
  const app = express();
  app.post("/test", middleware, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("auth rate limit middleware", () => {
  const prevNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("skips limits in test environment", async () => {
    process.env.NODE_ENV = "test";
    jest.resetModules();
    const { loginRateLimiter } = await import("../src/middleware/auth-rate-limit");
    const app = createLimiterApp(loginRateLimiter);

    for (let i = 0; i < 12; i += 1) {
      await request(app).post("/test").expect(200);
    }
  });

  it.each([
    ["loginRateLimiter", 10],
    ["registerRateLimiter", 5],
    ["refreshRateLimiter", 30],
    ["logoutRateLimiter", 20],
    ["changePasswordRateLimiter", 5],
  ] as const)(
    "enforces %s max requests",
    async (limiterKey, maxAllowed) => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const limiters = await import("../src/middleware/auth-rate-limit");
      const middleware = limiters[limiterKey];
      const app = createLimiterApp(middleware);

      for (let i = 0; i < maxAllowed; i += 1) {
        await request(app).post("/test").expect(200);
      }

      const blocked = await request(app).post("/test").expect(429);
      expect(blocked.body).toEqual({
        statusCode: 429,
        message: "Too many requests",
      });
    },
  );
});
