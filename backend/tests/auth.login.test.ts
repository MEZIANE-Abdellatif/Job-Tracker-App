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

describe("POST /api/auth/login", () => {
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash("password12", 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 200 and a verifiable access token", async () => {
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

    const body = res.body as { accessToken: string };
    expect(typeof body.accessToken).toBe("string");

    const decoded = jwt.verify(body.accessToken, process.env.JWT_SECRET ?? "", {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    expect(decoded.sub).toBe("user-1");
    expect(decoded.email).toBe("login@example.com");
  });

  it("returns 401 when user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@example.com", password: "password12" })
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });

  it("returns 401 when password is wrong", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "login@example.com",
      passwordHash: validPasswordHash,
      createdAt: new Date(),
      applications: [],
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "wrongpass12" })
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nope", password: "password12" })
      .expect(400);

    expect((res.body as { statusCode: number }).statusCode).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for short password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ok@example.com", password: "short" })
      .expect(400);

    expect((res.body as { statusCode: number }).statusCode).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
