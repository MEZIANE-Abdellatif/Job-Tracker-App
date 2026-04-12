import type { NextFunction, Request, RequestHandler, Response } from "express";

import { HttpError } from "../../lib/http-error";
import { validateBody, validateQuery } from "../../lib/validate-body";
import {
  CreateApplicationDto,
  ListApplicationsQueryDto,
  UpdateApplicationDto,
} from "./applications.dto";
import {
  createApplication as createApplicationForUser,
  deleteApplicationForUser,
  getApplicationForUser,
  getApplicationStatsForUser,
  listApplicationsForUser,
  updateApplicationForUser,
} from "./applications.service";

function listApplicationsQueryPayload(query: Request["query"]): Record<string, unknown> {
  const raw = query["status"];
  if (raw === undefined) {
    return {};
  }
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") {
    return {};
  }
  return { status: value };
}

async function handleCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const rawBody: unknown = req.body;
    const dto = await validateBody<CreateApplicationDto>(CreateApplicationDto, rawBody);
    const created = await createApplicationForUser(req.user.id, dto);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const queryDto = await validateQuery<ListApplicationsQueryDto>(
      ListApplicationsQueryDto,
      listApplicationsQueryPayload(req.query),
    );
    const items = await listApplicationsForUser(req.user.id, queryDto);
    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

async function handleStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const stats = await getApplicationStatsForUser(req.user.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export const create: RequestHandler = (req, res, next) => {
  void handleCreate(req, res, next);
};

export const list: RequestHandler = (req, res, next) => {
  void handleList(req, res, next);
};

export const stats: RequestHandler = (req, res, next) => {
  void handleStats(req, res, next);
};

async function handleGetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const id = req.params["id"];
    if (id === undefined || id.length === 0) {
      next(new HttpError(400, "Invalid id"));
      return;
    }
    const row = await getApplicationForUser(id, req.user.id);
    res.status(200).json(row);
  } catch (err) {
    next(err);
  }
}

export const getById: RequestHandler = (req, res, next) => {
  void handleGetById(req, res, next);
};

async function handlePatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const id = req.params["id"];
    if (id === undefined || id.length === 0) {
      next(new HttpError(400, "Invalid id"));
      return;
    }
    const rawBody: unknown = req.body;
    const dto = await validateBody<UpdateApplicationDto>(UpdateApplicationDto, rawBody);
    const updated = await updateApplicationForUser(id, req.user.id, dto);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export const patchById: RequestHandler = (req, res, next) => {
  void handlePatch(req, res, next);
};

async function handleDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    const id = req.params["id"];
    if (id === undefined || id.length === 0) {
      next(new HttpError(400, "Invalid id"));
      return;
    }
    await deleteApplicationForUser(id, req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export const removeById: RequestHandler = (req, res, next) => {
  void handleDelete(req, res, next);
};
