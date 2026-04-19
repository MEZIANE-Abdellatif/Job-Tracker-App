export type ApplicationStatus =
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED";

export type Application = {
  id: string;
  userId: string;
  company: string;
  position: string;
  location: string | null;
  status: ApplicationStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  jobUrl: string | null;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  accessToken: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
  createdAt: string;
};

export type ApiErrorBody = {
  statusCode: number;
  message: string;
};

/** `GET /api/applications/stats` — `byStatus` keys match backend `Status` enum. */
export type ApplicationStats = {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
};

export type CreateApplicationInput = {
  company: string;
  position: string;
  location: string;
  notes: string;
  jobUrl: string;
  salaryMin: string;
  salaryMax: string;
  status: ApplicationStatus;
};

export type CreateApplicationPayload = {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  jobUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  status?: ApplicationStatus;
};
