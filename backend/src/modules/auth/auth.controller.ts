import type { NextFunction, Request, RequestHandler, Response } from "express";

import {
  getRefreshCookieClearOptions,
  getRefreshCookieConfig,
} from "../../lib/refresh-cookie-config";
import { validateBody } from "../../lib/validate-body";
import { LoginDto, RegisterDto } from "./auth.dto";
import { loginWithTokens, refreshAccessToken, register as registerUser } from "./auth.service";

async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawBody: unknown = req.body;
    const dto = await validateBody<RegisterDto>(RegisterDto, rawBody);
    const result = await registerUser(dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawBody: unknown = req.body;
    const dto: LoginDto = await validateBody<LoginDto>(LoginDto, rawBody);
    const { accessToken, refreshToken } = await loginWithTokens(dto);
    const { name, options } = getRefreshCookieConfig();
    res.cookie(name, refreshToken, options);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function handleRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = getRefreshCookieConfig();
    const token = req.cookies[name] as string | undefined;
    const { accessToken } = await refreshAccessToken(token);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
}

function handleLogout(_req: Request, res: Response, next: NextFunction): void {
  try {
    const { name } = getRefreshCookieConfig();
    res.clearCookie(name, getRefreshCookieClearOptions());
    res.status(200).end();
  } catch (err) {
    next(err);
  }
}

export const register: RequestHandler = (req, res, next) => {
  void handleRegister(req, res, next);
};

export const login: RequestHandler = (req, res, next) => {
  void handleLogin(req, res, next);
};

export const refresh: RequestHandler = (req, res, next) => {
  void handleRefresh(req, res, next);
};

export const logout: RequestHandler = (req, res, next) => {
  handleLogout(req, res, next);
};
