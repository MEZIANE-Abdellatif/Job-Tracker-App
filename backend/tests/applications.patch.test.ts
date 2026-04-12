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

function sampleRow(id: string, userId: string, company = "Acme") {
  return {
    id,
    userId,
    company,
    position: "Engineer",
    location: null,
    status: "APPLIED" as const,
    salaryMin: null,
    salaryMax: null,
    jobUrl: null,
    notes: null,
    appliedAt: new Date("2026-03-01T12:00:00.000Z"),
    updatedAt: new Date("2026-03-01T12:00:00.000Z"),
  };
}

describe("PATCH /api/applications/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 404 when application does not exist", async () => {
    prismaMock.application.findUnique.mockResolvedValue(null);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .patch("/api/applications/app-missing")
      .set("Authorization", `Bearer ${token}`)
      .send({ company: "X" })
      .expect(404);

    expect(res.body).toEqual({ statusCode: 404, message: "Not found" });
    expect(prismaMock.application.update).not.toHaveBeenCalled();
  });

  it("returns 403 when application belongs to another user", async () => {
    prismaMock.application.findUnique.mockResolvedValue(sampleRow("app-1", "user-2"));

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .patch("/api/applications/app-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ company: "X" })
      .expect(403);

    expect(res.body).toEqual({ statusCode: 403, message: "Forbidden" });
    expect(prismaMock.application.update).not.toHaveBeenCalled();
  });

  it("returns 400 when body has no fields to update", async () => {
    prismaMock.application.findUnique.mockResolvedValue(sampleRow("app-1", "user-1"));

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .patch("/api/applications/app-1")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body).toEqual({ statusCode: 400, message: "No fields to update" });
    expect(prismaMock.application.update).not.toHaveBeenCalled();
  });

  it("returns 400 when body contains non-whitelisted userId", async () => {
    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .patch("/api/applications/app-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ company: "Ok", userId: "hijack" })
      .expect(400);

    expect((res.body as { statusCode: number }).statusCode).toBe(400);
    expect(prismaMock.application.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.application.update).not.toHaveBeenCalled();
  });

  it("returns 200 and passes only provided fields to update", async () => {
    prismaMock.application.findUnique.mockResolvedValue(sampleRow("app-1", "user-1", "Acme"));
    const updated = sampleRow("app-1", "user-1", "Beta");
    prismaMock.application.update.mockResolvedValue(updated);

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .patch("/api/applications/app-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ company: "Beta" })
      .expect(200);

    expect(res.body).toMatchObject({ id: "app-1", company: "Beta", userId: "user-1" });

    type UpdateArg = { where: { id: string }; data: Record<string, unknown> };
    const calls = prismaMock.application.update.mock.calls as unknown as [UpdateArg][];
    const firstArg = calls[0]?.[0];
    expect(firstArg?.where.id).toBe("app-1");
    expect(firstArg?.data).toEqual({ company: "Beta" });
    expect(firstArg?.data["position"]).toBeUndefined();
  });
});
