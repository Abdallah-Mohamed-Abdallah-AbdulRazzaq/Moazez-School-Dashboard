let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getRealtimeAccessToken(): string | null {
  return accessToken;
}

export function setRealtimeAccessToken(token: string | null): void {
  if (accessToken === token) return;
  accessToken = token;
  listeners.forEach(listener => listener());
}

export function subscribeToRealtimeTokenChanges(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
