import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/auth/callback",
];

const AUTH_COOKIE_NAMES = [
  "moazez_session",
  "moazez_refresh_token",
  "refreshToken",
];

function getLocale(pathname: string): "en" | "ar" {
  const locale = pathname.split("/")[1];
  return routing.locales.includes(locale as "en" | "ar")
    ? (locale as "en" | "ar")
    : routing.defaultLocale;
}

function stripLocale(pathname: string): string {
  const locale = pathname.split("/")[1];
  if (!routing.locales.includes(locale as "en" | "ar")) {
    return pathname || "/";
  }

  const stripped = pathname.slice(locale.length + 1);
  return stripped || "/";
}

function isPublicRoute(pathname: string): boolean {
  const route = stripLocale(pathname);
  return PUBLIC_ROUTES.some(
    (publicRoute) => route === publicRoute || route.startsWith(`${publicRoute}/`),
  );
}

function hasAuthCookie(request: NextRequest): boolean {
  return AUTH_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the pathname is just the root or just the locale
  // e.g., "/" or "/ar" or "/en"
  const isRootPath = pathname === "/";
  const isLocaleOnlyPath = pathname === "/ar" || pathname === "/en";
  const locale = getLocale(pathname);
  const route = stripLocale(pathname);
  const isPublic = isPublicRoute(pathname);
  const isAuthenticated = hasAuthCookie(request);

  if (isRootPath || isLocaleOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = isAuthenticated ? `/${locale}/dashboard` : `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (!isPublic && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  if (route === "/login" && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // For all other paths, use the intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|images|assets|favicon.ico|.*\\..*).*)"],
};
