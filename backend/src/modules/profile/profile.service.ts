import { HttpError } from "../../lib/http-error";
import * as profileRepository from "./profile.repository";

export type ProfileSummary = {
  email: string;
  accountCreatedAt: Date;
  totalApplications: number;
  activePipelineCount: number;
  lastActivityDate: Date | null;
};

export async function getProfileSummaryForUser(userId: string): Promise<ProfileSummary> {
  const user = await profileRepository.findProfileUserById(userId);
  if (user === null) {
    throw new HttpError(401, "Unauthorized");
  }

  const [totalApplications, activePipelineCount, lastActivityDate] = await Promise.all([
    profileRepository.countApplicationsByUserId(userId),
    profileRepository.countActivePipelineByUserId(userId),
    profileRepository.findLastActivityDateByUserId(userId),
  ]);

  return {
    email: user.email,
    accountCreatedAt: user.createdAt,
    totalApplications,
    activePipelineCount,
    lastActivityDate,
  };
}
