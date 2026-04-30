import { Router } from "express";

import {
  createApplicationRateLimiter,
  deleteApplicationRateLimiter,
  readApplicationRateLimiter,
} from "../../middleware/api-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { create, getById, list, patchById, removeById, stats } from "./applications.controller";

export const applicationsRouter = Router();

applicationsRouter.get("/", readApplicationRateLimiter, authenticate, list);
applicationsRouter.get("/stats", authenticate, stats);
applicationsRouter.get("/:id", readApplicationRateLimiter, authenticate, getById);
applicationsRouter.patch("/:id", authenticate, patchById);
applicationsRouter.delete("/:id", deleteApplicationRateLimiter, authenticate, removeById);
applicationsRouter.post("/", createApplicationRateLimiter, authenticate, create);
