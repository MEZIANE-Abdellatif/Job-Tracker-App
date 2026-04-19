import type { ApiErrorBody, ApplicationStatus, CreateApplicationPayload } from "@/types";

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

export type CreateApplicationFormValues = {
  company: string;
  position: string;
  location: string;
  notes: string;
  jobUrl: string;
  salaryMin: string;
  salaryMax: string;
  status: ApplicationStatus;
};

export type CreateApplicationFormErrors = Partial<Record<keyof CreateApplicationFormValues, string>>;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < 0) return undefined;
  return num;
}

export function validateCreateApplication(values: CreateApplicationFormValues): CreateApplicationFormErrors {
  const errors: CreateApplicationFormErrors = {};

  if (values.company.trim().length === 0) {
    errors.company = "Company is required";
  }
  if (values.position.trim().length === 0) {
    errors.position = "Position is required";
  }

  const jobUrl = values.jobUrl.trim();
  if (jobUrl.length > 0 && !isHttpUrl(jobUrl)) {
    errors.jobUrl = "Use a valid URL with http:// or https://";
  }

  const salaryMinRaw = values.salaryMin.trim();
  const salaryMaxRaw = values.salaryMax.trim();
  const salaryMin = normalizeOptionalInt(salaryMinRaw);
  const salaryMax = normalizeOptionalInt(salaryMaxRaw);

  if (salaryMinRaw.length > 0 && salaryMin === undefined) {
    errors.salaryMin = "Salary min must be a whole number >= 0";
  }
  if (salaryMaxRaw.length > 0 && salaryMax === undefined) {
    errors.salaryMax = "Salary max must be a whole number >= 0";
  }
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMax < salaryMin) {
    errors.salaryMax = "Salary max should be greater than or equal to salary min";
  }

  return errors;
}

export function toCreateApplicationPayload(
  values: CreateApplicationFormValues,
): CreateApplicationPayload {
  const payload: CreateApplicationPayload = {
    company: values.company.trim(),
    position: values.position.trim(),
  };

  const location = normalizeOptionalText(values.location);
  if (location !== undefined) payload.location = location;

  const notes = normalizeOptionalText(values.notes);
  if (notes !== undefined) payload.notes = notes;

  const jobUrl = normalizeOptionalText(values.jobUrl);
  if (jobUrl !== undefined) payload.jobUrl = jobUrl;

  const salaryMin = normalizeOptionalInt(values.salaryMin);
  if (salaryMin !== undefined) payload.salaryMin = salaryMin;

  const salaryMax = normalizeOptionalInt(values.salaryMax);
  if (salaryMax !== undefined) payload.salaryMax = salaryMax;

  if (values.status !== "APPLIED") {
    payload.status = values.status;
  }

  return payload;
}

export async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as Partial<ApiErrorBody>;
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
  } catch {
    /* ignore */
  }
  return "Could not save application.";
}
