import type { Prisma, Status } from "@prisma/client";

import { prisma } from "../../prisma/client";

const applicationSelect = {
  id: true,
  userId: true,
  company: true,
  position: true,
  location: true,
  status: true,
  salaryMin: true,
  salaryMax: true,
  jobUrl: true,
  notes: true,
  appliedAt: true,
  updatedAt: true,
} as const;

export type ApplicationRecord = {
  id: string;
  userId: string;
  company: string;
  position: string;
  location: string | null;
  status: Status;
  salaryMin: number | null;
  salaryMax: number | null;
  jobUrl: string | null;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
};

export async function createApplication(params: {
  userId: string;
  company: string;
  position: string;
  location?: string;
  notes?: string;
  jobUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  status?: Status;
}): Promise<ApplicationRecord> {
  return prisma.application.create({
    data: {
      userId: params.userId,
      company: params.company,
      position: params.position,
      location: params.location,
      notes: params.notes,
      jobUrl: params.jobUrl,
      salaryMin: params.salaryMin,
      salaryMax: params.salaryMax,
      status: params.status,
    },
    select: applicationSelect,
  });
}

export async function findApplicationsByUserId(
  userId: string,
  status?: Status,
): Promise<ApplicationRecord[]> {
  return prisma.application.findMany({
    where: {
      userId,
      ...(status !== undefined ? { status } : {}),
    },
    select: applicationSelect,
    orderBy: { appliedAt: "desc" },
  });
}

export async function countApplicationsByUserId(userId: string): Promise<number> {
  return prisma.application.count({ where: { userId } });
}

export async function groupApplicationsByStatusForUser(
  userId: string,
): Promise<{ status: Status; _count: { _all: number } }[]> {
  const rows = await prisma.application.findMany({
    where: { userId },
    select: { status: true },
  });
  const counts = new Map<Status, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, n]) => ({
    status,
    _count: { _all: n },
  }));
}

export async function findApplicationById(id: string): Promise<ApplicationRecord | null> {
  return prisma.application.findUnique({
    where: { id },
    select: applicationSelect,
  });
}

export async function updateApplication(
  id: string,
  data: Prisma.ApplicationUpdateInput,
): Promise<ApplicationRecord> {
  return prisma.application.update({
    where: { id },
    data,
    select: applicationSelect,
  });
}

export async function deleteApplicationById(id: string): Promise<void> {
  await prisma.application.delete({ where: { id } });
}
