import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { create, getById, list, patchById, removeById, stats } from "./applications.controller";

export const applicationsRouter = Router();

applicationsRouter.get("/", authenticate, list);
applicationsRouter.get("/stats", authenticate, stats);
applicationsRouter.get("/:id", authenticate, getById);
applicationsRouter.patch("/:id", authenticate, patchById);
applicationsRouter.delete("/:id", authenticate, removeById);
applicationsRouter.post("/", authenticate, create);
