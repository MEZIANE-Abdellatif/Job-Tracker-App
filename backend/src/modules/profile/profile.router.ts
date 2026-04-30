import { Router } from "express";

import { profileRateLimiter } from "../../middleware/api-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { analytics, companies, summary } from "./profile.controller";

export const profileRouter = Router();

profileRouter.get("/summary", profileRateLimiter, authenticate, summary);
profileRouter.get("/analytics", profileRateLimiter, authenticate, analytics);
profileRouter.get("/companies", profileRateLimiter, authenticate, companies);
