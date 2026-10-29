// FILE: src/features/auth/context/AuthProvider.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AuthContext } from "./AuthContext";
import { authService } from "@/services/auth-service";
import {
  clearLegacyTokens,
  getAuthSessionVersion,
  invalidateAuthSession,
  subscribeToSessionChanges,
} from "@/lib/auth/session-client";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";
import { clearAuthenticatedFileUrlCache } from "@/lib/files/authenticatedFileUrlCache";
import { setBrandingScope } from "@/features/settings/services/brandingService";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  MeResponse,
} from "@/types/user";
import { isApiError } from "@/lib/api-error";
import {
  localeFromPathname,
  safeAuthReturnPath,
} from "@/features/auth/utils/authRedirect";
import { getDefaultAuthorizedNavigationPath } from "@/hooks/usePermissions";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingRedirectRef = useRef<string | null>(null);
  const userRequestRef = useRef(0);
  const explicitLogoutRef = useRef(false);
  const currentLocale = localeFromPathname(pathname);

  const getLocalizedPath = useCallback(
    (destination: "login" | "dashboard" | "change-password") => {
      return `/${currentLocale}/${destination}`;
    },
    [currentLocale],
  );

  const loginPathWithRedirect = useCallback(() => {
    const loginPath = getLocalizedPath("login");
    const isLoginRoute = pathname === loginPath;
    const isRootRoute =
      pathname === "/" || pathname === "/ar" || pathname === "/en";
    const queryString = searchParams.toString();
    const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

    if (isLoginRoute || isRootRoute) {
      return loginPath;
    }

    return `${loginPath}?next=${encodeURIComponent(currentPath)}`;
  }, [getLocalizedPath, pathname, searchParams]);

  const loginReturnPath = useCallback(() => {
    return safeAuthReturnPath(
      searchParams.get("next") ?? searchParams.get("redirect"),
      currentLocale,
    );
  }, [currentLocale, searchParams]);

  const clearLocalSession = useCallback(() => {
    userRequestRef.current += 1;
    clearAuthenticatedFileUrlCache();
    setBrandingScope(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const loadUser = useCallback(async (fallbackMustChangePassword?: boolean) => {
    const request = ++userRequestRef.current;
    try {
      const currentUser = await authService.getCurrentUser();
      if (request !== userRequestRef.current) return null;
      const normalizedUser: MeResponse = {
        ...currentUser,
        mustChangePassword: currentUser.mustChangePassword ?? fallbackMustChangePassword,
      };
      setBrandingScope(normalizedUser);
      explicitLogoutRef.current = false;
      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      if (request !== userRequestRef.current) return null;
      console.error("Failed to restore session:", error);
      setBrandingScope(null);
      setUser(null);
      if (!isApiError(error) || error.status === 401) {
        clearAuthenticatedFileUrlCache();
      }
      return null;
    } finally {
      if (request === userRequestRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    clearLegacyTokens();
    let mounted = true;
    void Promise.resolve().then(() => {
      if (mounted) return loadUser();
    });
    return () => {
      mounted = false;
      userRequestRef.current += 1;
    };
  }, [loadUser]);

  useEffect(() => {
    return subscribeToSessionChanges((kind) => {
      if (kind === "refresh") {
        void loadUser();
        return;
      }
      invalidateAuthSession();
      clearLocalSession();
      if (kind === "login") {
        setIsLoading(true);
        void loadUser();
      }
    });
  }, [clearLocalSession, loadUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearLocalSession();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [clearLocalSession]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      explicitLogoutRef.current = false;
      clearLocalSession();
      const loginRequest = authService.login(credentials);
      const sessionVersion = getAuthSessionVersion();
      setIsLoading(true);
      try {
        const loginResponse = await loginRequest;
        if (sessionVersion !== getAuthSessionVersion()) return null;
        return await loadUser(loginResponse.user.mustChangePassword);
      } finally {
        if (sessionVersion === getAuthSessionVersion()) setIsLoading(false);
      }
    },
    [clearLocalSession, loadUser],
  );

  const logout = useCallback(async () => {
    explicitLogoutRef.current = true;
    clearLocalSession();
    setIsLoading(true);
    const logoutRequest = authService.logout();
    const sessionVersion = getAuthSessionVersion();
    try {
      await logoutRequest;
    } catch (error) {
      if (sessionVersion === getAuthSessionVersion()) await loadUser();
      throw error;
    } finally {
      if (sessionVersion === getAuthSessionVersion()) setIsLoading(false);
    }
  }, [clearLocalSession, loadUser]);

  const refreshCurrentUser = useCallback(async () => {
    setIsLoading(true);
    return loadUser();
  }, [loadUser]);

  const changePassword = useCallback(
    async (payload: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
      return authService.changePassword(payload);
    },
    [],
  );

  const mustChangePassword = Boolean(user?.mustChangePassword);

  // Client-side route protection
  useEffect(() => {
    if (!isLoading) {
      const loginPath = getLocalizedPath("login");
      const dashboardPath = user
        ? getDefaultAuthorizedNavigationPath(
            user.activeMembership?.permissions ?? [],
            currentLocale,
          )
        : getLocalizedPath("dashboard");
      const changePasswordPath = getLocalizedPath("change-password");
      const isLoginRoute = pathname === loginPath;
      const isChangePasswordRoute = pathname === changePasswordPath;
      const isDashboardRoute = pathname === getLocalizedPath("dashboard");
      const isRootRoute =
        pathname === "/" || pathname === "/ar" || pathname === "/en";
      let redirectPath: string | null = null;

      if (!user && !isLoginRoute && !isRootRoute) {
        redirectPath = explicitLogoutRef.current ? loginPath : loginPathWithRedirect();
      } else if (user && mustChangePassword && !isChangePasswordRoute) {
        redirectPath = changePasswordPath;
      } else if (
        user &&
        !mustChangePassword &&
        (isLoginRoute || isChangePasswordRoute)
      ) {
        redirectPath = isLoginRoute
          ? (loginReturnPath() ?? dashboardPath)
          : dashboardPath;
      } else if (
        user &&
        !mustChangePassword &&
        isDashboardRoute &&
        dashboardPath !== pathname
      ) {
        redirectPath = dashboardPath;
      }

      if (!redirectPath) {
        pendingRedirectRef.current = null;
      } else if (pendingRedirectRef.current !== redirectPath) {
        pendingRedirectRef.current = redirectPath;
        router.push(redirectPath);
      }
    }
  }, [
    user,
    isLoading,
    pathname,
    router,
    getLocalizedPath,
    currentLocale,
    loginPathWithRedirect,
    loginReturnPath,
    mustChangePassword,
  ]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      mustChangePassword,
      login,
      logout,
      refreshCurrentUser,
      changePassword,
    }),
    [
      user,
      isLoading,
      mustChangePassword,
      login,
      logout,
      refreshCurrentUser,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
