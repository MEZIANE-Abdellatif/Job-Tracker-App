import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { errorHandler } from "../src/middleware/error-handler";
import { authenticate } from "../src/middleware/authenticate";

const prevJwtSecret = process.env.JWT_SECRET;
const prevJwtExp = process.env.JWT_ACCESS_EXPIRES_IN;
const prevJwtAlg = process.env.JWT_ALGORITHM;

beforeAll(() => {
  process.env.JWT_SECRET = "unit-test-jwt-secret-min-length-32!!";
  process.env.JWT_ACCESS_EXPIRES_IN = "1h";
  process.env.JWT_ALGORITHM = "HS256";
});

afterAll(() => {
  process.env.JWT_SECRET = prevJwtSecret;
  process.env.JWT_ACCESS_EXPIRES_IN = prevJwtExp;
  process.env.JWT_ALGORITHM = prevJwtAlg;
});

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get("/protected", authenticate, (req, res) => {
    res.status(200).json({ user: req.user });
  });
  app.use(errorHandler);
  return app;
}

describe("authenticate middleware", () => {
  const app = createTestApp();

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).get("/protected").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
  });

  it("returns 401 when Authorization is not Bearer", async () => {
    const res = await request(app).get("/protected").set("Authorization", "Basic xyz").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
  });

  it("returns 401 when Bearer token is empty", async () => {
    const res = await request(app).get("/protected").set("Authorization", "Bearer ").expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
  });

  it("returns 401 when JWT signature is invalid", async () => {
    const bad = jwt.sign(
      { sub: "user-1", email: "a@b.com" },
      "wrong-secret-wrong-secret-wrong-secret",
      { expiresIn: "1h", algorithm: "HS256" },
    );
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${bad}`)
      .expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
  });

  it("returns 401 when token is a refresh-shaped JWT", async () => {
    const refreshLike = jwt.sign(
      { sub: "user-1", email: "a@b.com", typ: "refresh" },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "1h", algorithm: "HS256" },
    );
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${refreshLike}`)
      .expect(401);
    expect(res.body).toEqual({ statusCode: 401, message: "Unauthorized" });
  });

  it("returns 200 and req.user when access token is valid", async () => {
    const access = jwt.sign(
      { sub: "user-1", email: "ok@example.com" },
      process.env.JWT_SECRET ?? "",
      { expiresIn: "1h", algorithm: "HS256" },
    );
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${access}`)
      .expect(200);

    expect(res.body).toEqual({
      user: { id: "user-1", email: "ok@example.com" },
    });
  });
});
