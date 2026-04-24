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
