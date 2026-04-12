type ApiClientConfig = {
  getAccessToken: () => string | null | undefined;
};

let getAccessToken: () => string | null | undefined = () => null;

export function configureApiClient(config: ApiClientConfig): void {
  getAccessToken = config.getAccessToken;
}

/** Throws if unset — set NEXT_PUBLIC_API_BASE_URL in `.env.local` (see `.env.local.example`). */
function requireApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw === undefined || raw.length === 0) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set — copy frontend/.env.local.example to frontend/.env.local",
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

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = resolveUrl(path);
  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(url, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  });
}
