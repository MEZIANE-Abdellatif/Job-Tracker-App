import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { summary } from "./profile.controller";

export const profileRouter = Router();

profileRouter.get("/summary", authenticate, summary);
