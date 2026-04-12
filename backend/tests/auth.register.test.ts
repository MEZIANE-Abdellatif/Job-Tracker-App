import { Prisma } from "@prisma/client";
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

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 201 and safe user fields when registration succeeds", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    prismaMock.user.create.mockResolvedValue({
      id: "user-uuid-1",
      email: "a@example.com",
      passwordHash: "hidden",
      createdAt,
      applications: [],
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "password12" })
      .expect(201);

    expect(res.body).toEqual({
      id: "user-uuid-1",
      email: "a@example.com",
      createdAt: createdAt.toISOString(),
    });
    expect(res.body).not.toHaveProperty("passwordHash");
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: "a@example.com",
        passwordHash: expect.stringMatching(/^\$2[aby]\$/) as unknown as string,
      },
    });
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "password12" })
      .expect(400);

    const body400 = res.body as { statusCode: number; message: string };
    expect(body400.statusCode).toBe(400);
    expect(typeof body400.message).toBe("string");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 for password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "ok@example.com", password: "short" })
      .expect(400);

    expect(res.body).toMatchObject({ statusCode: 400 });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 when body contains unknown fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "ok@example.com", password: "password12", admin: true })
      .expect(400);

    expect(res.body).toMatchObject({ statusCode: 400 });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 409 when email already exists (findByEmail)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "dup@example.com",
      passwordHash: "x",
      createdAt: new Date(),
      applications: [],
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password12" })
      .expect(409);

    expect(res.body).toEqual({
      statusCode: 409,
      message: "Email already in use",
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 409 when create hits unique constraint (P2002)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const p2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { modelName: "User", target: ["email"] },
    });
    prismaMock.user.create.mockRejectedValue(p2002);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "race@example.com", password: "password12" })
      .expect(409);

    expect(res.body).toEqual({
      statusCode: 409,
      message: "Email already in use",
    });
  });
});
