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
import { tokenStorage } from "@/lib/token-storage";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";
import { clearAuthenticatedFileUrlCache } from "@/lib/files/authenticatedFileUrlCache";
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

  const loadUser = useCallback(async (fallbackMustChangePassword?: boolean) => {
    try {
      if (tokenStorage.hasTokens()) {
        const currentUser = await authService.getCurrentUser();
        const normalizedUser: MeResponse = {
          ...currentUser,
          mustChangePassword:
            currentUser.mustChangePassword ?? fallbackMustChangePassword,
        };
        setUser(normalizedUser);
        return normalizedUser;
      } else {
        clearAuthenticatedFileUrlCache();
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      setUser(null);
      if (!tokenStorage.hasTokens()) {
        return null;
      }

      if (!isApiError(error) || error.status === 401) {
        tokenStorage.clearTokens();
        clearAuthenticatedFileUrlCache();
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadUser());
  }, [loadUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthenticatedFileUrlCache();
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [loginPathWithRedirect, router]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      try {
        clearAuthenticatedFileUrlCache();
        const loginResponse = await authService.login(credentials);
        return await loadUser(loginResponse.user.mustChangePassword);
      } finally {
        setIsLoading(false);
      }
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      clearAuthenticatedFileUrlCache();
      setUser(null);
      router.push(getLocalizedPath("login"));
    } finally {
      setIsLoading(false);
    }
  }, [getLocalizedPath, router]);

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
        redirectPath = loginPathWithRedirect();
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
