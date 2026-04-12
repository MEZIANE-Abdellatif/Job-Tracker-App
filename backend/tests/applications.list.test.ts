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

function sampleApp(id: string, userId: string) {
  return {
    id,
    userId,
    company: "Acme",
    position: "Engineer",
    location: null,
    status: "APPLIED" as const,
    salaryMin: null,
    salaryMax: null,
    jobUrl: null,
    notes: null,
    appliedAt: new Date("2026-02-01T12:00:00.000Z"),
    updatedAt: new Date("2026-02-01T12:00:00.000Z"),
  };
}

describe("GET /api/applications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 401 without Authorization", async () => {
    const res = await request(app).get("/api/applications").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
    expect(prismaMock.application.findMany).not.toHaveBeenCalled();
  });

  it("returns 200 with only the authenticated user's applications", async () => {
    const rows = [sampleApp("app-a", "user-1"), sampleApp("app-b", "user-1")];
    prismaMock.application.findMany.mockResolvedValue(rows);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = res.body as { id: string }[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body.map((r) => r.id).sort()).toEqual(["app-a", "app-b"]);

    type FindManyArg = { where: { userId: string }; orderBy: { appliedAt: string } };
    const calls = prismaMock.application.findMany.mock.calls as unknown as [FindManyArg][];
    const firstArg = calls[0]?.[0];
    expect(firstArg).toBeDefined();
    if (firstArg === undefined) {
      throw new Error("expected prisma.application.findMany to be called");
    }
    expect(firstArg.where.userId).toBe("user-1");
    expect(firstArg.orderBy).toEqual({ appliedAt: "desc" });
  });

  it("ignores userId query param; list is scoped to JWT sub only", async () => {
    prismaMock.application.findMany.mockResolvedValue([sampleApp("app-x", "user-1")]);

    const token = accessTokenForUser("user-1", "u@example.com");
    await request(app)
      .get("/api/applications")
      .query({ userId: "other-user" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    type FindManyArg = { where: { userId: string } };
    const calls = prismaMock.application.findMany.mock.calls as unknown as [FindManyArg][];
    const firstArg = calls[0]?.[0];
    expect(firstArg?.where.userId).toBe("user-1");
  });

  it("filters by status=APPLIED", async () => {
    prismaMock.application.findMany.mockResolvedValue([sampleApp("app-a", "user-1")]);

    const token = accessTokenForUser("user-1", "u@example.com");
    await request(app)
      .get("/api/applications")
      .query({ status: "APPLIED" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    type FindManyArg = { where: { userId: string; status?: string } };
    const calls = prismaMock.application.findMany.mock.calls as unknown as [FindManyArg][];
    const firstArg = calls[0]?.[0];
    expect(firstArg?.where.userId).toBe("user-1");
    expect(firstArg?.where.status).toBe("APPLIED");
  });

  it("filters by status=INTERVIEW", async () => {
    prismaMock.application.findMany.mockResolvedValue([]);

    const token = accessTokenForUser("user-1", "u@example.com");
    await request(app)
      .get("/api/applications")
      .query({ status: "INTERVIEW" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    type FindManyArg = { where: { userId: string; status?: string } };
    const calls = prismaMock.application.findMany.mock.calls as unknown as [FindManyArg][];
    expect(calls[0]?.[0]?.where.status).toBe("INTERVIEW");
  });

  it("returns 400 for invalid status query", async () => {
    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .get("/api/applications")
      .query({ status: "INVALID" })
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect((res.body as { statusCode: number }).statusCode).toBe(400);
    expect(prismaMock.application.findMany).not.toHaveBeenCalled();
  });
});
