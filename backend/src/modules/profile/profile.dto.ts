import { IsIn, IsOptional } from "class-validator";

export const PROFILE_ANALYTICS_RANGES = ["30d", "90d", "all"] as const;
export type ProfileAnalyticsRange = (typeof PROFILE_ANALYTICS_RANGES)[number];

export class ProfileAnalyticsQueryDto {
  @IsOptional()
  @IsIn(PROFILE_ANALYTICS_RANGES)
  range?: ProfileAnalyticsRange;
}
