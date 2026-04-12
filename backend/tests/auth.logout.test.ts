import bcrypt from "bcrypt";
import request from "supertest";

jest.mock("../src/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}));

import { app } from "../src/app";
import { prisma } from "../src/prisma/client";

const prismaMock = prisma as jest.Mocked<typeof prisma> & {
  user: { findUnique: jest.Mock; create: jest.Mock };
  $queryRawUnsafe: jest.Mock;
};

const prevJwtSecret = process.env.JWT_SECRET;
const prevJwtExp = process.env.JWT_ACCESS_EXPIRES_IN;
const prevJwtAlg = process.env.JWT_ALGORITHM;
const prevRefreshSecret = process.env.JWT_REFRESH_SECRET;
const prevRefreshExp = process.env.JWT_REFRESH_EXPIRES_IN;
const prevCookieName = process.env.REFRESH_COOKIE_NAME;
const prevCookieSecure = process.env.REFRESH_COOKIE_SECURE;
const prevCookieSameSite = process.env.REFRESH_COOKIE_SAME_SITE;
const prevCookiePath = process.env.REFRESH_COOKIE_PATH;
const prevCookieHttpOnly = process.env.REFRESH_COOKIE_HTTPONLY;

beforeAll(() => {
  process.env.JWT_SECRET = "unit-test-jwt-secret-min-length-32!!";
  process.env.JWT_ACCESS_EXPIRES_IN = "1h";
  process.env.JWT_ALGORITHM = "HS256";
  process.env.JWT_REFRESH_SECRET = "unit-test-refresh-secret-min-length-32!";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  process.env.REFRESH_COOKIE_NAME = "refresh_token";
  process.env.REFRESH_COOKIE_SECURE = "false";
  process.env.REFRESH_COOKIE_SAME_SITE = "lax";
  process.env.REFRESH_COOKIE_PATH = "/";
  process.env.REFRESH_COOKIE_HTTPONLY = "true";
});

afterAll(() => {
  process.env.JWT_SECRET = prevJwtSecret;
  process.env.JWT_ACCESS_EXPIRES_IN = prevJwtExp;
  process.env.JWT_ALGORITHM = prevJwtAlg;
  process.env.JWT_REFRESH_SECRET = prevRefreshSecret;
  process.env.JWT_REFRESH_EXPIRES_IN = prevRefreshExp;
  process.env.REFRESH_COOKIE_NAME = prevCookieName;
  process.env.REFRESH_COOKIE_SECURE = prevCookieSecure;
  process.env.REFRESH_COOKIE_SAME_SITE = prevCookieSameSite;
  process.env.REFRESH_COOKIE_PATH = prevCookiePath;
  process.env.REFRESH_COOKIE_HTTPONLY = prevCookieHttpOnly;
});

describe("POST /api/auth/logout", () => {
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash("password12", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 200, clears refresh cookie, and refresh no longer works", async () => {
    prismaMock.user.findUnique.mockImplementation(
      (args: { where: { email?: string; id?: string } }) => {
        if (args.where.email === "login@example.com" || args.where.id === "user-1") {
          return Promise.resolve({
            id: "user-1",
            email: "login@example.com",
            passwordHash: validPasswordHash,
            createdAt: new Date(),
            applications: [],
          });
        }
        return Promise.resolve(null);
      },
    );

    const agent = request.agent(app);

    await agent
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password12" })
      .expect(200);

    const logoutRes = await agent.post("/api/auth/logout").expect(200);

    expect(logoutRes.text).toBe("");

    const setCookie = logoutRes.headers["set-cookie"] as string[] | undefined;
    expect(
      setCookie?.some(
        (c) =>
          c.includes("refresh_token=") &&
          (c.includes("Max-Age=0") || /Expires=\w{3},\s*01\s+Jan\s+1970/i.test(c)),
      ),
    ).toBe(true);

    await agent.post("/api/auth/refresh").expect(401);
  });
});
