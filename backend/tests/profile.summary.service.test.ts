jest.mock("../src/modules/profile/profile.repository", () => ({
  findProfileUserById: jest.fn(),
  countApplicationsByUserId: jest.fn(),
  countActivePipelineByUserId: jest.fn(),
  findLastActivityDateByUserId: jest.fn(),
}));

import { HttpError } from "../src/lib/http-error";
import * as profileRepository from "../src/modules/profile/profile.repository";
import { getProfileSummaryForUser } from "../src/modules/profile/profile.service";

const profileRepoMock = profileRepository as jest.Mocked<typeof profileRepository>;

describe("getProfileSummaryForUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns profile summary for existing user", async () => {
    const accountCreatedAt = new Date("2026-01-01T00:00:00.000Z");
    const lastActivityDate = new Date("2026-04-20T08:30:00.000Z");
    profileRepoMock.findProfileUserById.mockResolvedValue({
      email: "user@example.com",
      createdAt: accountCreatedAt,
    });
    profileRepoMock.countApplicationsByUserId.mockResolvedValue(12);
    profileRepoMock.countActivePipelineByUserId.mockResolvedValue(5);
    profileRepoMock.findLastActivityDateByUserId.mockResolvedValue(lastActivityDate);

    const result = await getProfileSummaryForUser("user-1");

    expect(result).toEqual({
      email: "user@example.com",
      accountCreatedAt,
      totalApplications: 12,
      activePipelineCount: 5,
      lastActivityDate,
    });
    expect(profileRepoMock.findProfileUserById).toHaveBeenCalledWith("user-1");
    expect(profileRepoMock.countApplicationsByUserId).toHaveBeenCalledWith("user-1");
    expect(profileRepoMock.countActivePipelineByUserId).toHaveBeenCalledWith("user-1");
    expect(profileRepoMock.findLastActivityDateByUserId).toHaveBeenCalledWith("user-1");
  });

  it("returns null lastActivityDate when user has no applications", async () => {
    const accountCreatedAt = new Date("2026-01-01T00:00:00.000Z");
    profileRepoMock.findProfileUserById.mockResolvedValue({
      email: "user@example.com",
      createdAt: accountCreatedAt,
    });
    profileRepoMock.countApplicationsByUserId.mockResolvedValue(0);
    profileRepoMock.countActivePipelineByUserId.mockResolvedValue(0);
    profileRepoMock.findLastActivityDateByUserId.mockResolvedValue(null);

    const result = await getProfileSummaryForUser("user-1");

    expect(result.lastActivityDate).toBeNull();
    expect(result.totalApplications).toBe(0);
    expect(result.activePipelineCount).toBe(0);
  });

  it("throws 401 when user is missing", async () => {
    profileRepoMock.findProfileUserById.mockResolvedValue(null);

    await expect(getProfileSummaryForUser("missing-user")).rejects.toEqual(
      new HttpError(401, "Unauthorized"),
    );
    expect(profileRepoMock.countApplicationsByUserId).not.toHaveBeenCalled();
  });
});
