import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

describe("POST /api/auth/login (refresh cookie)", () => {
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash("password12", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("sets Set-Cookie with refresh token (HttpOnly, SameSite, no Secure in test env)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "login@example.com",
      passwordHash: validPasswordHash,
      createdAt: new Date(),
      applications: [],
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password12" })
      .expect(200);

    const body = res.body as { accessToken: string; refreshToken?: string };
    expect(typeof body.accessToken).toBe("string");
    expect(body.refreshToken).toBeUndefined();

    const setCookie = res.headers["set-cookie"] as string[] | undefined;
    expect(setCookie).toBeDefined();
    expect(setCookie?.length).toBeGreaterThan(0);
    const cookieHeader = setCookie?.[0] ?? "";
    expect(cookieHeader).toMatch(/refresh_token=/);
    expect(cookieHeader.toLowerCase()).toContain("httponly");
    expect(cookieHeader.toLowerCase()).toContain("samesite=lax");
    expect(cookieHeader.toLowerCase()).not.toContain("secure");
  });
});

describe("POST /api/auth/refresh", () => {
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash("password12", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns a new access token when agent sends cookie after login", async () => {
    prismaMock.user.findUnique.mockImplementation(
      (args: { where: { email?: string; id?: string } }) => {
        if (args.where.email === "login@example.com") {
          return Promise.resolve({
            id: "user-1",
            email: "login@example.com",
            passwordHash: validPasswordHash,
            createdAt: new Date(),
            applications: [],
          });
        }
        if (args.where.id === "user-1") {
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

    const refreshRes = await agent.post("/api/auth/refresh").expect(200);

    const secondAccess = (refreshRes.body as { accessToken: string }).accessToken;
    expect(typeof secondAccess).toBe("string");

    const decoded = jwt.verify(secondAccess, process.env.JWT_SECRET ?? "", {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    expect(decoded.sub).toBe("user-1");
    expect(decoded.email).toBe("login@example.com");
  });

  it("returns 401 when cookie is missing", async () => {
    const res = await request(app).post("/api/auth/refresh").expect(401);
    expect(res.body).toEqual({
      statusCode: 401,
      message: "Invalid or expired session",
    });
  });

  it("returns 401 when refresh JWT signature is invalid", async () => {
    const badToken = jwt.sign(
      { sub: "user-1", email: "x@y.com", typ: "refresh" },
      "wrong-secret-wrong-secret-wrong-secret",
      { expiresIn: "1h", algorithm: "HS256" },
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${badToken}`)
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: "Invalid or expired session",
    });
  });

  it("returns 401 when typ is not refresh", async () => {
    const accessLike = jwt.sign(
      { sub: "user-1", email: "login@example.com" },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "1h", algorithm: "HS256" },
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${accessLike}`)
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: "Invalid or expired session",
    });
  });

  it("returns 401 when user no longer exists", async () => {
    const refreshTok = jwt.sign(
      { sub: "gone-user", email: "gone@example.com", typ: "refresh" },
      process.env.JWT_REFRESH_SECRET ?? "",
      { expiresIn: "1h", algorithm: "HS256" },
    );

    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${refreshTok}`)
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: "Invalid or expired session",
    });
  });
});
