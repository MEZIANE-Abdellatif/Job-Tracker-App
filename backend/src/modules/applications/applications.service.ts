import type { Prisma } from "@prisma/client";
import { Status } from "@prisma/client";

import { HttpError } from "../../lib/http-error";
import type {
  CreateApplicationDto,
  ListApplicationsQueryDto,
  UpdateApplicationDto,
} from "./applications.dto";
import * as applicationsRepository from "./applications.repository";

function buildUpdateData(dto: UpdateApplicationDto): Prisma.ApplicationUpdateInput {
  const data: Prisma.ApplicationUpdateInput = {};
  if (dto.company !== undefined) {
    data.company = dto.company;
  }
  if (dto.position !== undefined) {
    data.position = dto.position;
  }
  if (dto.location !== undefined) {
    data.location = dto.location;
  }
  if (dto.notes !== undefined) {
    data.notes = dto.notes;
  }
  if (dto.jobUrl !== undefined) {
    data.jobUrl = dto.jobUrl;
  }
  if (dto.salaryMin !== undefined) {
    data.salaryMin = dto.salaryMin;
  }
  if (dto.salaryMax !== undefined) {
    data.salaryMax = dto.salaryMax;
  }
  if (dto.status !== undefined) {
    data.status = dto.status;
  }
  return data;
}

export async function createApplication(
  userId: string,
  dto: CreateApplicationDto,
): Promise<applicationsRepository.ApplicationRecord> {
  return applicationsRepository.createApplication({
    userId,
    company: dto.company,
    position: dto.position,
    location: dto.location,
    notes: dto.notes,
    jobUrl: dto.jobUrl,
    salaryMin: dto.salaryMin,
    salaryMax: dto.salaryMax,
    status: dto.status,
  });
}

const ALL_STATUSES: readonly Status[] = [
  Status.APPLIED,
  Status.INTERVIEW,
  Status.OFFER,
  Status.REJECTED,
  Status.GHOSTED,
];

export type ApplicationStats = {
  total: number;
  byStatus: Record<Status, number>;
};

export async function listApplicationsForUser(
  userId: string,
  query: ListApplicationsQueryDto,
): Promise<applicationsRepository.ApplicationRecord[]> {
  return applicationsRepository.findApplicationsByUserId(userId, query.status);
}

export async function getApplicationStatsForUser(userId: string): Promise<ApplicationStats> {
  const [total, groups] = await Promise.all([
    applicationsRepository.countApplicationsByUserId(userId),
    applicationsRepository.groupApplicationsByStatusForUser(userId),
  ]);

  const byStatus = {} as Record<Status, number>;
  for (const s of ALL_STATUSES) {
    byStatus[s] = 0;
  }
  for (const row of groups) {
    byStatus[row.status] = row._count._all;
  }

  return { total, byStatus };
}

export async function getApplicationForUser(
  applicationId: string,
  userId: string,
): Promise<applicationsRepository.ApplicationRecord> {
  const row = await applicationsRepository.findApplicationById(applicationId);
  if (row === null) {
    throw new HttpError(404, "Not found");
  }
  if (row.userId !== userId) {
    throw new HttpError(403, "Forbidden");
  }
  return row;
}

export async function updateApplicationForUser(
  applicationId: string,
  userId: string,
  dto: UpdateApplicationDto,
): Promise<applicationsRepository.ApplicationRecord> {
  await getApplicationForUser(applicationId, userId);
  const data = buildUpdateData(dto);
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "No fields to update");
  }
  return applicationsRepository.updateApplication(applicationId, data);
}

export async function deleteApplicationForUser(
  applicationId: string,
  userId: string,
): Promise<void> {
  await getApplicationForUser(applicationId, userId);
  await applicationsRepository.deleteApplicationById(applicationId);
}
