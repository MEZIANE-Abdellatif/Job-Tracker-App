import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";

import { HttpError } from "../../lib/http-error";
import { prisma } from "../../prisma/client";

export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(params: { email: string; passwordHash: string }): Promise<User> {
  try {
    return await prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Email already in use");
    }
    throw e;
  }
}
