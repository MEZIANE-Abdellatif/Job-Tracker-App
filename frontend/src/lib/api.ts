import { getSessionGeneration } from "./session-generation";

type ApiClientConfig = {
  getAccessToken: () => string | null | undefined;
  setAccessToken?: (token: string | null) => void;
  clearAccessToken?: () => void;
};

let getAccessToken: () => string | null | undefined = () => null;
let setAccessToken: (token: string | null) => void = () => {};
let clearAccessToken: () => void = () => {};
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiClient(config: ApiClientConfig): void {
  getAccessToken = config.getAccessToken;
  setAccessToken = config.setAccessToken ?? (() => {});
  clearAccessToken = config.clearAccessToken ?? (() => {});
}

/** Throws if unset — set NEXT_PUBLIC_API_BASE_URL in `frontend/.env`. */
function requireApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw === undefined || raw.length === 0) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set — define it in frontend/.env",
    );
  }
  return raw.replace(/\/$/, "");
}

function resolveUrl(path: string): string {
  const base = requireApiBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function withAuthHeader(
  init: RequestInit | undefined,
  accessTokenOverride?: string,
): { headers: Headers; init: RequestInit } {
  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    const token = accessTokenOverride ?? getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return { headers, init: init ?? {} };
}

function shouldTryRefresh(path: string, response: Response, hasRetried: boolean): boolean {
  if (hasRetried || response.status !== 401) {
    return false;
  }
  return !path.startsWith("/api/auth/");
}

async function refreshAccessToken(): Promise<string | null> {
  const generationAtStart = getSessionGeneration();
  try {
    const res = await fetch(resolveUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      clearAccessToken();
      return null;
    }
    const data = (await res.json()) as Partial<{ accessToken: string }>;
    if (typeof data.accessToken !== "string" || data.accessToken.length === 0) {
      clearAccessToken();
      return null;
    }
    if (getSessionGeneration() !== generationAtStart) {
      return null;
    }
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}

async function refreshAccessTokenSingleton(): Promise<string | null> {
  if (refreshInFlight !== null) {
    return refreshInFlight;
  }
  refreshInFlight = refreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Restores an access JWT using the httpOnly refresh cookie (POST /api/auth/refresh).
 * Token stays in memory only; single-flighted with 401-retry refresh in {@link apiFetch}.
 */
export async function tryRestoreSessionFromRefreshCookie(): Promise<boolean> {
  const token = await refreshAccessTokenSingleton();
  return token !== null;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = resolveUrl(path);
  const requestInit = init ?? {};

  const first = withAuthHeader(requestInit);
  const firstResponse = await fetch(url, {
    ...first.init,
    headers: first.headers,
    credentials: requestInit.credentials ?? "include",
  });

  if (!shouldTryRefresh(path, firstResponse, false)) {
    return firstResponse;
  }

  const refreshedToken = await refreshAccessTokenSingleton();
  if (refreshedToken === null) {
    return firstResponse;
  }

  const retry = withAuthHeader(requestInit, refreshedToken);
  return fetch(url, {
    ...retry.init,
    headers: retry.headers,
    credentials: requestInit.credentials ?? "include",
  });
}
