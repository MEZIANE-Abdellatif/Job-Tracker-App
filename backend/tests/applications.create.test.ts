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

describe("POST /api/applications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 401 without Authorization", async () => {
    const res = await request(app)
      .post("/api/applications")
      .send({ company: "Acme", position: "Engineer" })
      .expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });

  it("returns 401 with invalid access token", async () => {
    const bad = jwt.sign(
      { sub: "user-1", email: "a@b.com" },
      "wrong-secret-wrong-secret-wrong-secret",
      { expiresIn: "1h", algorithm: "HS256" },
    );
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${bad}`)
      .send({ company: "Acme", position: "Engineer" })
      .expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });

  it("returns 400 when company is missing", async () => {
    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ position: "Engineer" })
      .expect(400);
    expect((res.body as { statusCode: number }).statusCode).toBe(400);
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });

  it("returns 400 when body contains non-whitelisted userId", async () => {
    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "Acme",
        position: "Engineer",
        userId: "attacker-user-id",
      })
      .expect(400);
    expect((res.body as { statusCode: number }).statusCode).toBe(400);
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });

  it("returns 201 and uses JWT sub as userId, not body userId", async () => {
    const appliedAt = new Date("2026-01-15T12:00:00.000Z");
    const updatedAt = new Date("2026-01-15T12:00:00.000Z");

    prismaMock.application.create.mockResolvedValue({
      id: "app-uuid-1",
      userId: "user-1",
      company: "Acme",
      position: "Engineer",
      location: null,
      status: "APPLIED",
      salaryMin: null,
      salaryMax: null,
      jobUrl: null,
      notes: null,
      appliedAt,
      updatedAt,
    });

    const token = accessTokenForUser("user-1", "u@example.com");
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({ company: "Acme", position: "Engineer" })
      .expect(201);

    expect(prismaMock.application.create).toHaveBeenCalledTimes(1);
    type CreateArg = {
      data: { userId: string; company: string; position: string };
    };
    const calls = prismaMock.application.create.mock.calls as unknown as [CreateArg][];
    const firstArg = calls[0]?.[0];
    expect(firstArg).toBeDefined();
    if (firstArg === undefined) {
      throw new Error("expected prisma.application.create to be called with arguments");
    }
    expect(firstArg.data.userId).toBe("user-1");
    expect(firstArg.data.company).toBe("Acme");
    expect(firstArg.data.position).toBe("Engineer");

    expect(res.body).toMatchObject({
      id: "app-uuid-1",
      userId: "user-1",
      company: "Acme",
      position: "Engineer",
      status: "APPLIED",
    });
  });
});
