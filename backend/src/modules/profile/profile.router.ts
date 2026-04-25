import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { analytics, companies, summary } from "./profile.controller";

export const profileRouter = Router();

profileRouter.get("/summary", authenticate, summary);
profileRouter.get("/analytics", authenticate, analytics);
profileRouter.get("/companies", authenticate, companies);
