import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: unknown;
}

export function setSessionCookies(response: NextResponse, login: BackendLoginResponse) {
  response.cookies.set(ACCESS_COOKIE, login.accessToken, { ...cookieOptions, maxAge: login.expiresIn });
  // The backend remains authoritative for refresh expiry and revocation.
  response.cookies.set(REFRESH_COOKIE, login.refreshToken, cookieOptions);
  clearLegacyCookies(response);
}

function clearLegacyCookies(response: NextResponse) {
  for (const name of ["moazez_access_token", "moazez_refresh_token", "refreshToken", "moazez_session"]) {
    response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  }
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  }
  clearLegacyCookies(response);
}
