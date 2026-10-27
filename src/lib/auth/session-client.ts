export const SESSION_STORAGE_KEY = "moazez:session-change";
export const SESSION_EXPIRED_EVENT = "moazez:session-expired";
let sessionVersion = 0;
let mutationQueue: Promise<unknown> = Promise.resolve();

export function getAuthSessionVersion() { return sessionVersion; }
export function invalidateAuthSession() { sessionVersion += 1; }

export function clearLegacyTokens() {
  for (const key of ["moazez_access_token", "moazez_refresh_token"]) {
    try { localStorage.removeItem(key); } catch (error) { rethrowUnexpectedStorageError(error); }
    document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function publishSessionChange(kind: "login" | "logout") {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ kind, id: crypto.randomUUID() }));
  } catch (error) { rethrowUnexpectedStorageError(error); }
}

function rethrowUnexpectedStorageError(error: unknown) {
  // Cookies still authenticate when browser privacy settings disable storage.
  if (error instanceof DOMException && ["SecurityError", "QuotaExceededError"].includes(error.name)) return;
  throw error;
}

export function subscribeToSessionChanges(listener: (kind: "login" | "logout") => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SESSION_STORAGE_KEY || !event.newValue) return;
    // Only a notification crosses tabs; credentials stay in HttpOnly cookies.
    let change: unknown;
    try {
      change = JSON.parse(event.newValue);
    } catch (error) {
      if (error instanceof SyntaxError) return;
      throw error;
    }
    if (change && typeof change === "object" && "kind" in change &&
        (change.kind === "login" || change.kind === "logout")) listener(change.kind);
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => typeof navigator !== "undefined" && navigator.locks
    ? await navigator.locks.request("moazez:session", operation) : await operation();
  const pending = mutationQueue.then(run, run);
  mutationQueue = pending;
  return pending;
}
