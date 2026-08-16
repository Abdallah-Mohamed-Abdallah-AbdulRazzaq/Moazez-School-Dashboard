// FILE: src/lib/token-storage.ts

export const ACCESS_TOKEN_KEY = "moazez_access_token";
export const REFRESH_TOKEN_KEY = "moazez_refresh_token";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function setTokenCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
) {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearTokenCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const tokenStorage = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setTokenCookie(ACCESS_TOKEN_KEY, token, ACCESS_TOKEN_MAX_AGE_SECONDS);
  },

  removeAccessToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    clearTokenCookie(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    setTokenCookie(REFRESH_TOKEN_KEY, token, REFRESH_TOKEN_MAX_AGE_SECONDS);
  },

  removeRefreshToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearTokenCookie(REFRESH_TOKEN_KEY);
  },

  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearTokenCookie(ACCESS_TOKEN_KEY);
    clearTokenCookie(REFRESH_TOKEN_KEY);
  },

  hasTokens: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};
