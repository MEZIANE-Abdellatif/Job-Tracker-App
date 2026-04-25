import type { NextFunction, Request, RequestHandler, Response } from "express";

import { HttpError } from "../../lib/http-error";
import { validateQuery } from "../../lib/validate-body";
import { ProfileAnalyticsQueryDto } from "./profile.dto";
import {
  getProfileAnalyticsForUser,
  getProfileCompaniesForUser,
  getProfileSummaryForUser,
} from "./profile.service";

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

function analyticsQueryPayload(query: Request["query"]): Record<string, unknown> {
  const raw = query["range"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return {};
  return { range: value };
}

async function handleAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const queryDto = await validateQuery<ProfileAnalyticsQueryDto>(
      ProfileAnalyticsQueryDto,
      analyticsQueryPayload(req.query),
    );
    const range = queryDto.range ?? "30d";
    const analytics = await getProfileAnalyticsForUser(req.user.id, range);
    res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
}

export const analytics: RequestHandler = (req, res, next) => {
  void handleAnalytics(req, res, next);
};

async function handleCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const insights = await getProfileCompaniesForUser(req.user.id);
    res.status(200).json(insights);
  } catch (err) {
    next(err);
  }
}

export const companies: RequestHandler = (req, res, next) => {
  void handleCompanies(req, res, next);
};
