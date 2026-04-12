import bcrypt from "bcrypt";
import jwt, { type Algorithm, type JwtPayload, type SignOptions } from "jsonwebtoken";

import { HttpError } from "../../lib/http-error";
import type { LoginDto, RegisterDto } from "./auth.dto";
import * as authRepository from "./auth.repository";

const SYMMETRIC_ALGORITHMS: readonly Algorithm[] = ["HS256", "HS384", "HS512"];

const INVALID_CREDENTIALS = "Invalid email or password";
const INVALID_SESSION = "Invalid or expired session";
const UNAUTHORIZED_ACCESS = "Unauthorized";

export type RegisterResult = {
  id: string;
  email: string;
  createdAt: Date;
};

export type LoginResult = {
  accessToken: string;
};

/** Internal: controller sets refresh as httpOnly cookie only, never in JSON. */
export type LoginWithRefreshResult = {
  accessToken: string;
  refreshToken: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret === undefined || secret.length === 0) {
    throw new HttpError(500, "Server configuration error");
  }
  return secret;
}

function getRefreshJwtSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (secret === undefined || secret.length === 0) {
    throw new HttpError(500, "Server configuration error");
  }
  return secret;
}

function resolveJwtAlgorithm(): Algorithm {
  const raw = (process.env.JWT_ALGORITHM ?? "HS256").toUpperCase();
  if (!SYMMETRIC_ALGORITHMS.includes(raw as Algorithm)) {
    throw new HttpError(500, "Server configuration error");
  }
  return raw as Algorithm;
}

function resolveRefreshJwtAlgorithm(): Algorithm {
  const fromEnv = process.env.JWT_REFRESH_ALGORITHM?.trim();
  if (fromEnv !== undefined && fromEnv.length > 0) {
    const upper = fromEnv.toUpperCase();
    if (!SYMMETRIC_ALGORITHMS.includes(upper as Algorithm)) {
      throw new HttpError(500, "Server configuration error");
    }
    return upper as Algorithm;
  }
  return resolveJwtAlgorithm();
}

function signAccessTokenForUser(user: { id: string; email: string }): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
  const algorithm = resolveJwtAlgorithm();
  const signOptions: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    algorithm,
  };
  return jwt.sign({ sub: user.id, email: user.email }, secret, signOptions);
}

function signRefreshTokenForUser(user: { id: string; email: string }): string {
  const secret = getRefreshJwtSecret();
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const algorithm = resolveRefreshJwtAlgorithm();
  const signOptions: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    algorithm,
  };
  return jwt.sign({ sub: user.id, email: user.email, typ: "refresh" }, secret, signOptions);
}

export function verifyAccessToken(token: string): { id: string; email: string } {
  try {
    const secret = getJwtSecret();
    const algorithm = resolveJwtAlgorithm();
    const decoded = jwt.verify(token, secret, {
      algorithms: [algorithm],
    }) as JwtPayload;

    if (decoded.typ === "refresh") {
      throw new HttpError(401, UNAUTHORIZED_ACCESS);
    }
    if (typeof decoded.sub !== "string" || typeof decoded.email !== "string") {
      throw new HttpError(401, UNAUTHORIZED_ACCESS);
    }
    return { id: decoded.sub, email: decoded.email };
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(401, UNAUTHORIZED_ACCESS);
  }
}

function verifyRefreshToken(token: string): { sub: string; email: string } {
  try {
    const secret = getRefreshJwtSecret();
    const algorithm = resolveRefreshJwtAlgorithm();
    const decoded = jwt.verify(token, secret, {
      algorithms: [algorithm],
    }) as JwtPayload;

    if (decoded.typ !== "refresh") {
      throw new HttpError(401, INVALID_SESSION);
    }
    if (typeof decoded.sub !== "string" || typeof decoded.email !== "string") {
      throw new HttpError(401, INVALID_SESSION);
    }
    return { sub: decoded.sub, email: decoded.email };
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(401, INVALID_SESSION);
  }
}

export async function register(dto: RegisterDto): Promise<RegisterResult> {
  const existing = await authRepository.findByEmail(dto.email);
  if (existing) {
    throw new HttpError(409, "Email already in use");
  }

  const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(dto.password, saltRounds);
  const user = await authRepository.createUser({
    email: dto.email,
    passwordHash,
  });

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function loginWithTokens(dto: LoginDto): Promise<LoginWithRefreshResult> {
  const user = await authRepository.findByEmail(dto.email);
  if (!user) {
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
  if (!passwordOk) {
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  const accessToken = signAccessTokenForUser(user);
  const refreshToken = signRefreshTokenForUser(user);
  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string | undefined): Promise<LoginResult> {
  if (refreshToken === undefined || refreshToken.length === 0) {
    throw new HttpError(401, INVALID_SESSION);
  }

  const { sub } = verifyRefreshToken(refreshToken);
  const user = await authRepository.findById(sub);
  if (!user) {
    throw new HttpError(401, INVALID_SESSION);
  }

  const accessToken = signAccessTokenForUser(user);
  return { accessToken };
}
