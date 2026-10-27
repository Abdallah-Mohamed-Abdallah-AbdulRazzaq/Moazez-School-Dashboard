export const SESSION_API_PATH = "/api/session";
export const CSRF_HEADER = "X-Moazez-CSRF";
export const ACCESS_COOKIE = process.env.NODE_ENV === "production"
  ? "__Host-moazez-access" : "moazez_session_access";
export const REFRESH_COOKIE = process.env.NODE_ENV === "production"
  ? "__Host-moazez-refresh" : "moazez_session_refresh";
