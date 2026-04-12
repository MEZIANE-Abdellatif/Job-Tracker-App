import { Status } from "@prisma/client";
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

const ALL: Status[] = [
  Status.APPLIED,
  Status.INTERVIEW,
  Status.OFFER,
  Status.REJECTED,
  Status.GHOSTED,
];

function expectAllStatusesZeroExcept(
  byStatus: Record<string, number>,
  except: Status,
  value: number,
): void {
  for (const s of ALL) {
    if (s === except) {
      expect(byStatus[s]).toBe(value);
    } else {
      expect(byStatus[s]).toBe(0);
    }
  }
}

describe("GET /api/applications/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 401 without Authorization", async () => {
    const res = await request(app).get("/api/applications/stats").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
    expect(prismaMock.application.count).not.toHaveBeenCalled();
    expect(prismaMock.application.findMany).not.toHaveBeenCalled();
  });

  it("returns total and per-status counts for the authenticated user", async () => {
    prismaMock.application.count.mockResolvedValue(4);
    prismaMock.application.findMany.mockResolvedValue([
      { status: Status.APPLIED },
      { status: Status.APPLIED },
      { status: Status.INTERVIEW },
      { status: Status.OFFER },
    ]);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { total: number; byStatus: Record<string, number> };
    expect(body.total).toBe(4);
    expect(body.byStatus[Status.APPLIED]).toBe(2);
    expect(body.byStatus[Status.INTERVIEW]).toBe(1);
    expect(body.byStatus[Status.OFFER]).toBe(1);
    expect(body.byStatus[Status.REJECTED]).toBe(0);
    expect(body.byStatus[Status.GHOSTED]).toBe(0);

    expect(prismaMock.application.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("count for APPLIED only", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.findMany.mockResolvedValue([{ status: Status.APPLIED }]);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { total: number; byStatus: Record<string, number> };
    expect(body.total).toBe(1);
    expectAllStatusesZeroExcept(body.byStatus, Status.APPLIED, 1);
  });

  it("count for INTERVIEW only", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.findMany.mockResolvedValue([{ status: Status.INTERVIEW }]);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { total: number; byStatus: Record<string, number> };
    expect(body.total).toBe(1);
    expectAllStatusesZeroExcept(body.byStatus, Status.INTERVIEW, 1);
  });

  it("count for OFFER only", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.findMany.mockResolvedValue([{ status: Status.OFFER }]);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { total: number; byStatus: Record<string, number> };
    expect(body.total).toBe(1);
    expectAllStatusesZeroExcept(body.byStatus, Status.OFFER, 1);
  });

  it("count for REJECTED only", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.findMany.mockResolvedValue([{ status: Status.REJECTED }]);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { total: number; byStatus: Record<string, number> };
    expect(body.total).toBe(1);
    expectAllStatusesZeroExcept(body.byStatus, Status.REJECTED, 1);
  });

  it("count for GHOSTED only", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.findMany.mockResolvedValue([{ status: Status.GHOSTED }]);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { total: number; byStatus: Record<string, number> };
    expect(body.total).toBe(1);
    expectAllStatusesZeroExcept(body.byStatus, Status.GHOSTED, 1);
  });
});
