jest.mock("../src/modules/profile/profile.repository", () => ({
  findProfileUserById: jest.fn(),
  findApplicationStatusesByUserId: jest.fn(),
  countApplicationsByUserIdSince: jest.fn(),
  findApplicationAppliedDatesByUserIdSince: jest.fn(),
  findApplicationDurationsByUserId: jest.fn(),
}));

import { Status } from "@prisma/client";

import { HttpError } from "../src/lib/http-error";
import * as profileRepository from "../src/modules/profile/profile.repository";
import {
  calculateRate,
  getProfileAnalyticsForUser,
} from "../src/modules/profile/profile.service";

const profileRepoMock = profileRepository as jest.Mocked<typeof profileRepository>;

describe("calculateRate", () => {
  it("returns ratio for positive denominator", () => {
    expect(calculateRate(2, 8)).toBe(0.25);
  });

  it("returns 0 when total is zero", () => {
    expect(calculateRate(1, 0)).toBe(0);
  });
});

describe("getProfileAnalyticsForUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calculates interviewRate and offerRate from status distribution", async () => {
    profileRepoMock.findProfileUserById.mockResolvedValue({
      email: "user@example.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    profileRepoMock.findApplicationStatusesByUserId.mockResolvedValue([
      { status: Status.APPLIED },
      { status: Status.INTERVIEW },
      { status: Status.INTERVIEW },
      { status: Status.OFFER },
      { status: Status.REJECTED },
    ]);
    profileRepoMock.countApplicationsByUserIdSince.mockResolvedValue(4);
    profileRepoMock.findApplicationAppliedDatesByUserIdSince.mockResolvedValue([]);
    profileRepoMock.findApplicationDurationsByUserId.mockResolvedValue([
      {
        appliedAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-03T00:00:00.000Z"),
      },
    ]);

    const result = await getProfileAnalyticsForUser("user-1", "30d");

    expect(result.statusDistribution).toEqual({
      Applied: 1,
      Interview: 2,
      Offer: 1,
      Rejected: 1,
      Ghosted: 0,
    });
    expect(result.interviewRate).toBe(0.4);
    expect(result.offerRate).toBe(0.2);
  });

  it("returns zero rates when no applications exist", async () => {
    profileRepoMock.findProfileUserById.mockResolvedValue({
      email: "user@example.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    profileRepoMock.findApplicationStatusesByUserId.mockResolvedValue([]);
    profileRepoMock.countApplicationsByUserIdSince.mockResolvedValue(0);
    profileRepoMock.findApplicationAppliedDatesByUserIdSince.mockResolvedValue([]);
    profileRepoMock.findApplicationDurationsByUserId.mockResolvedValue([]);

    const result = await getProfileAnalyticsForUser("user-1", "all");

    expect(result.interviewRate).toBe(0);
    expect(result.offerRate).toBe(0);
    expect(result.avgDaysToUpdate).toBe(0);
  });

  it("throws 401 when user is missing", async () => {
    profileRepoMock.findProfileUserById.mockResolvedValue(null);

    await expect(getProfileAnalyticsForUser("missing-user", "30d")).rejects.toEqual(
      new HttpError(401, "Unauthorized"),
    );
  });
});
