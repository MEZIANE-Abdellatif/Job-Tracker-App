import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import {
  changePasswordRateLimiter,
  loginRateLimiter,
  logoutRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "../../middleware/auth-rate-limit";
import {
  changePasswordForCurrentUser,
  login,
  logout,
  refresh,
  register,
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", registerRateLimiter, register);
authRouter.post("/login", loginRateLimiter, login);
authRouter.post("/refresh", refreshRateLimiter, refresh);
authRouter.post("/logout", logoutRateLimiter, logout);
authRouter.post(
  "/change-password",
  changePasswordRateLimiter,
  authenticate,
  changePasswordForCurrentUser,
);
