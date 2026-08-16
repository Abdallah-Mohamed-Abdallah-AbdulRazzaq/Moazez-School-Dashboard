export function localeFromPathname(pathname: string) {
  const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  return localeMatch ? localeMatch[1] : "en";
}

export function safeAuthReturnPath(
  returnPath: string | null,
  currentLocale: string,
): string | null {
  if (!returnPath || !returnPath.startsWith("/") || returnPath.startsWith("//")) {
    return null;
  }

  if (returnPath.startsWith(`/${currentLocale}/login`)) {
    return null;
  }

  if (!returnPath.startsWith(`/${currentLocale}/`)) {
    return null;
  }

  return returnPath;
}
