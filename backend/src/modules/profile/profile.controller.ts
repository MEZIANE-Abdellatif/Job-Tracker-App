import type { NextFunction, Request, RequestHandler, Response } from "express";

import { HttpError } from "../../lib/http-error";
import { getProfileSummaryForUser } from "./profile.service";

async function handleSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const summary = await getProfileSummaryForUser(req.user.id);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

export const summary: RequestHandler = (req, res, next) => {
  void handleSummary(req, res, next);
};
