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

describe("global error format { statusCode, message }", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$queryRawUnsafe.mockResolvedValue(undefined);
  });

  it("returns 404 with consistent shape for unknown routes", async () => {
    const res = await request(app).get("/this-route-does-not-exist").expect(404);
    expect(res.body).toEqual({ statusCode: 404, message: "Not found" });
  });

  it("returns 401 with consistent shape when unauthenticated", async () => {
    const res = await request(app).get("/api/applications").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
    expect(Object.keys(res.body as object).sort()).toEqual(["message", "statusCode"]);
  });

  it("returns 503 with consistent shape when health check fails", async () => {
    prismaMock.$queryRawUnsafe.mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/health").expect(503);
    expect(res.body).toEqual({
      statusCode: 503,
      message: "Database disconnected",
    });
  });
});
