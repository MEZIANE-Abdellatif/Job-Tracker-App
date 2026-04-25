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

function stubAnalyticsRows() {
  prismaMock.user.findUnique.mockResolvedValue({
    email: "u@example.com",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });
  prismaMock.application.findMany
    .mockResolvedValueOnce([
      { status: "APPLIED" },
      { status: "INTERVIEW" },
      { status: "OFFER" },
    ] as Array<{ status: "APPLIED" | "INTERVIEW" | "OFFER" }>)
    .mockResolvedValueOnce([
      { appliedAt: new Date("2026-04-01T00:00:00.000Z") },
      { appliedAt: new Date("2026-04-08T00:00:00.000Z") },
    ] as Array<{ appliedAt: Date }>)
    .mockResolvedValueOnce([
      {
        appliedAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-03T00:00:00.000Z"),
      },
      {
        appliedAt: new Date("2026-04-05T00:00:00.000Z"),
        updatedAt: new Date("2026-04-06T00:00:00.000Z"),
      },
    ] as Array<{ appliedAt: Date; updatedAt: Date }>);
  prismaMock.application.count.mockResolvedValue(2);
}

describe("GET /profile/analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns analytics for range=30d", async () => {
    stubAnalyticsRows();
    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/profile/analytics")
      .query({ range: "30d" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const body = res.body as {
      statusDistribution: Record<string, number>;
      interviewRate: number;
      offerRate: number;
      applicationsThisPeriod: number;
      weeklyTrend: Array<{ weekStart: string; count: number }>;
      avgDaysToUpdate: number;
    };

    expect(body).toHaveProperty("statusDistribution");
    expect(body).toHaveProperty("interviewRate");
    expect(body).toHaveProperty("offerRate");
    expect(body).toHaveProperty("applicationsThisPeriod", 2);
    expect(Array.isArray(body.weeklyTrend)).toBe(true);
    expect(body.weeklyTrend).toHaveLength(8);
    expect(prismaMock.application.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        appliedAt: { gte: expect.any(Date) as Date },
      },
    });
  });

  it("returns analytics for range=90d", async () => {
    stubAnalyticsRows();
    const token = accessTokenForUser("user-1", "u@example.com");
    await request(app)
      .get("/profile/analytics")
      .query({ range: "90d" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(prismaMock.application.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        appliedAt: { gte: expect.any(Date) as Date },
      },
    });
  });

  it("returns analytics for range=all", async () => {
    stubAnalyticsRows();
    const token = accessTokenForUser("user-1", "u@example.com");
    await request(app)
      .get("/profile/analytics")
      .query({ range: "all" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(prismaMock.application.count).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });
});
