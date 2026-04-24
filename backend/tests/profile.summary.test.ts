import jwt from "jsonwebtoken";
import request from "supertest";

jest.mock("../src/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    application: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}));

import { app } from "../src/app";
import { prisma } from "../src/prisma/client";

const prismaMock = prisma as jest.Mocked<typeof prisma> & {
  user: { findUnique: jest.Mock; create: jest.Mock };
  application: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  $queryRawUnsafe: jest.Mock;
};

const prevJwtSecret = process.env.JWT_SECRET;
const prevJwtExp = process.env.JWT_ACCESS_EXPIRES_IN;
const prevJwtAlg = process.env.JWT_ALGORITHM;
const prevRefreshSecret = process.env.JWT_REFRESH_SECRET;
const prevRefreshExp = process.env.JWT_REFRESH_EXPIRES_IN;

beforeAll(() => {
  process.env.JWT_SECRET = "unit-test-jwt-secret-min-length-32!!";
  process.env.JWT_ACCESS_EXPIRES_IN = "1h";
  process.env.JWT_ALGORITHM = "HS256";
  process.env.JWT_REFRESH_SECRET = "unit-test-refresh-secret-min-length-32!";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
});

afterAll(() => {
  process.env.JWT_SECRET = prevJwtSecret;
  process.env.JWT_ACCESS_EXPIRES_IN = prevJwtExp;
  process.env.JWT_ALGORITHM = prevJwtAlg;
  process.env.JWT_REFRESH_SECRET = prevRefreshSecret;
  process.env.JWT_REFRESH_EXPIRES_IN = prevRefreshExp;
});

function accessTokenForUser(sub: string, email: string): string {
  return jwt.sign({ sub, email }, process.env.JWT_SECRET ?? "", {
    expiresIn: "1h",
    algorithm: "HS256",
  });
}

describe("GET /profile/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 401 without Authorization", async () => {
    const res = await request(app).get("/profile/summary").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
  });

  it("returns the authenticated user's summary", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const lastActivity = new Date("2026-04-20T09:45:00.000Z");
    prismaMock.user.findUnique.mockResolvedValue({
      email: "u@example.com",
      createdAt,
    });
    prismaMock.application.count
      .mockResolvedValueOnce(10) // totalApplications
      .mockResolvedValueOnce(4); // activePipelineCount
    prismaMock.application.findFirst.mockResolvedValue({ updatedAt: lastActivity });

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/profile/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      email: "u@example.com",
      accountCreatedAt: createdAt.toISOString(),
      totalApplications: 10,
      activePipelineCount: 4,
      lastActivityDate: lastActivity.toISOString(),
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true, createdAt: true },
    });
    expect(prismaMock.application.count).toHaveBeenNthCalledWith(1, {
      where: { userId: "user-1" },
    });
    expect(prismaMock.application.count).toHaveBeenNthCalledWith(2, {
      where: { userId: "user-1", status: { in: ["APPLIED", "INTERVIEW"] } },
    });
    expect(prismaMock.application.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
  });
});
