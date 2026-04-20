import bcrypt from "bcrypt";
import request from "supertest";

jest.mock("../src/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}));

import { app } from "../src/app";
import { prisma } from "../src/prisma/client";

const prismaMock = prisma as jest.Mocked<typeof prisma> & {
  user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
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

describe("POST /api/auth/change-password", () => {
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash("password12", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("changes password for authenticated user", async () => {
    prismaMock.user.findUnique.mockImplementation(
      (args: { where: { email?: string; id?: string } }) => {
        if (args.where.email === "user@example.com" || args.where.id === "user-1") {
          return Promise.resolve({
            id: "user-1",
            email: "user@example.com",
            passwordHash: validPasswordHash,
            createdAt: new Date(),
            applications: [],
          });
        }
        return Promise.resolve(null);
      },
    );
    prismaMock.user.update.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      passwordHash: "next-hash",
      createdAt: new Date(),
      applications: [],
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "password12" })
      .expect(200);

    const { accessToken } = loginRes.body as { accessToken: string };

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "password12",
        newPassword: "new-password-12",
        confirmNewPassword: "new-password-12",
      })
      .expect(200);

    expect(changeRes.body).toEqual({ message: "Password changed successfully" });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        passwordHash: expect.stringMatching(/^\$2[aby]\$/) as unknown as string,
      },
    });
  });

  it("returns 401 for wrong current password", async () => {
    prismaMock.user.findUnique.mockImplementation(
      (args: { where: { email?: string; id?: string } }) => {
        if (args.where.email === "user@example.com" || args.where.id === "user-1") {
          return Promise.resolve({
            id: "user-1",
            email: "user@example.com",
            passwordHash: validPasswordHash,
            createdAt: new Date(),
            applications: [],
          });
        }
        return Promise.resolve(null);
      },
    );

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "password12" })
      .expect(200);
    const { accessToken } = loginRes.body as { accessToken: string };

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "wrong-password",
        newPassword: "new-password-12",
        confirmNewPassword: "new-password-12",
      })
      .expect(401);

    expect(changeRes.body).toEqual({
      statusCode: 401,
      message: "Current password is incorrect",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when confirmation does not match", async () => {
    prismaMock.user.findUnique.mockImplementation(
      (args: { where: { email?: string; id?: string } }) => {
        if (args.where.email === "user@example.com" || args.where.id === "user-1") {
          return Promise.resolve({
            id: "user-1",
            email: "user@example.com",
            passwordHash: validPasswordHash,
            createdAt: new Date(),
            applications: [],
          });
        }
        return Promise.resolve(null);
      },
    );

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "password12" })
      .expect(200);
    const { accessToken } = loginRes.body as { accessToken: string };

    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "password12",
        newPassword: "new-password-12",
        confirmNewPassword: "different-12",
      })
      .expect(400);

    expect(changeRes.body).toEqual({
      statusCode: 400,
      message: "New password confirmation does not match",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
