import { configureApiClient } from "./api";
import { invalidateClientSession } from "./session-generation";

let accessToken: string | null = null;
const listeners = new Set<() => void>();

function emitAccessTokenChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function clearAccessTokenInternal(): void {
  accessToken = null;
  invalidateClientSession();
  emitAccessTokenChange();
}

configureApiClient({
  getAccessToken: () => accessToken,
  setAccessToken: (token) => {
    if (token === null) {
      clearAccessTokenInternal();
      return;
    }
    accessToken = token;
    emitAccessTokenChange();
  },
  clearAccessToken: clearAccessTokenInternal,
});

export function setAccessToken(token: string | null): void {
  if (token === null) {
    clearAccessTokenInternal();
    return;
  }
  accessToken = token;
  emitAccessTokenChange();
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  clearAccessTokenInternal();
}

/** For `useSyncExternalStore` consumers (e.g. AuthGuard). */
export function subscribeAccessToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
