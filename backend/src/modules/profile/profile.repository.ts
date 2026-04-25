import { Status } from "@prisma/client";

import { prisma } from "../../prisma/client";

export type ProfileUserRecord = {
  email: string;
  createdAt: Date;
};

export async function findProfileUserById(userId: string): Promise<ProfileUserRecord | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
    },
  });
}

export async function countApplicationsByUserId(userId: string): Promise<number> {
  return prisma.application.count({ where: { userId } });
}

export async function countActivePipelineByUserId(userId: string): Promise<number> {
  return prisma.application.count({
    where: { userId, status: { in: [Status.APPLIED, Status.INTERVIEW] } },
  });
}

export async function findLastActivityDateByUserId(userId: string): Promise<Date | null> {
  const row = await prisma.application.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  return row?.updatedAt ?? null;
}

export async function findApplicationStatusesByUserId(
  userId: string,
): Promise<Array<{ status: Status }>> {
  return prisma.application.findMany({
    where: { userId },
    select: { status: true },
  });
}

export async function countApplicationsByUserIdSince(
  userId: string,
  since: Date | null,
): Promise<number> {
  return prisma.application.count({
    where: {
      userId,
      ...(since === null ? {} : { appliedAt: { gte: since } }),
    },
  });
}

export async function findApplicationAppliedDatesByUserIdSince(
  userId: string,
  since: Date,
): Promise<Array<{ appliedAt: Date }>> {
  return prisma.application.findMany({
    where: {
      userId,
      appliedAt: { gte: since },
    },
    select: { appliedAt: true },
  });
}

export async function findApplicationDurationsByUserId(
  userId: string,
): Promise<Array<{ appliedAt: Date; updatedAt: Date }>> {
  return prisma.application.findMany({
    where: { userId },
    select: { appliedAt: true, updatedAt: true },
  });
}

export async function findApplicationCompaniesByUserId(
  userId: string,
): Promise<Array<{ company: string }>> {
  return prisma.application.findMany({
    where: { userId },
    select: { company: true },
  });
}

export async function findMostRecentCompanyByUserId(userId: string): Promise<string | null> {
  const row = await prisma.application.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { company: true },
  });
  return row?.company ?? null;
}
