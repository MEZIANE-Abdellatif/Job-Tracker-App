import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import {
  changePasswordForCurrentUser,
  login,
  logout,
  refresh,
  register,
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.post("/change-password", authenticate, changePasswordForCurrentUser);
