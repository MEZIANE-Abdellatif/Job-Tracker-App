jest.mock("../src/modules/profile/profile.repository", () => ({
  findProfileUserById: jest.fn(),
  findApplicationCompaniesByUserId: jest.fn(),
  findMostRecentCompanyByUserId: jest.fn(),
}));

import { HttpError } from "../src/lib/http-error";
import * as profileRepository from "../src/modules/profile/profile.repository";
import {
  aggregateCompanyCounts,
  getProfileCompaniesForUser,
  selectDuplicateCompanies,
  selectTopCompanies,
} from "../src/modules/profile/profile.service";

const profileRepoMock = profileRepository as jest.Mocked<typeof profileRepository>;

describe("company aggregation helpers", () => {
  it("aggregates company counts and sorts by count desc", () => {
    const rows = [
      { company: "Acme" },
      { company: "Globex" },
      { company: "Acme" },
      { company: "Initech" },
      { company: "Globex" },
      { company: "Globex" },
    ];
    const result = aggregateCompanyCounts(rows);
    expect(result).toEqual([
      { companyName: "Globex", count: 3 },
      { companyName: "Acme", count: 2 },
      { companyName: "Initech", count: 1 },
    ]);
  });

  it("returns top N companies", () => {
    const rows = [
      { companyName: "A", count: 4 },
      { companyName: "B", count: 3 },
      { companyName: "C", count: 2 },
    ];
    expect(selectTopCompanies(rows, 2)).toEqual([
      { companyName: "A", count: 4 },
      { companyName: "B", count: 3 },
    ]);
  });

  it("returns only duplicates where count > 1", () => {
    const rows = [
      { companyName: "A", count: 4 },
      { companyName: "B", count: 1 },
      { companyName: "C", count: 2 },
    ];
    expect(selectDuplicateCompanies(rows)).toEqual([
      { companyName: "A", count: 4 },
      { companyName: "C", count: 2 },
    ]);
  });
});

describe("getProfileCompaniesForUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns topCompanies, mostRecentCompany, and duplicates", async () => {
    profileRepoMock.findProfileUserById.mockResolvedValue({
      email: "user@example.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    profileRepoMock.findApplicationCompaniesByUserId.mockResolvedValue([
      { company: "Acme" },
      { company: "Globex" },
      { company: "Acme" },
      { company: "Initech" },
      { company: "Globex" },
      { company: "Globex" },
      { company: "Stark" },
      { company: "Umbrella" },
      { company: "Wayne" },
    ]);
    profileRepoMock.findMostRecentCompanyByUserId.mockResolvedValue("Initech");

    const result = await getProfileCompaniesForUser("user-1");

    expect(result.topCompanies).toEqual([
      { companyName: "Globex", count: 3 },
      { companyName: "Acme", count: 2 },
      { companyName: "Initech", count: 1 },
      { companyName: "Stark", count: 1 },
      { companyName: "Umbrella", count: 1 },
    ]);
    expect(result.mostRecentCompany).toBe("Initech");
    expect(result.duplicateApplications).toEqual([
      { companyName: "Globex", count: 3 },
      { companyName: "Acme", count: 2 },
    ]);
  });

  it("throws 401 when user is missing", async () => {
    profileRepoMock.findProfileUserById.mockResolvedValue(null);

    await expect(getProfileCompaniesForUser("missing-user")).rejects.toEqual(
      new HttpError(401, "Unauthorized"),
    );
  });
});
