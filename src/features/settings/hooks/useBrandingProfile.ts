"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { SchoolProfileSettings } from "@/features/settings/types";
import {
  BRANDING_UPDATED_EVENT,
  brandingScopeKey,
  fetchBrandingProfile,
  getCachedBrandingProfile,
  getBrandingSessionVersion,
} from "@/features/settings/services/brandingService";

interface BrandingState {
  scopeKey: string | null;
  sessionVersion: number;
  profile: SchoolProfileSettings | null;
  isLoading: boolean;
}

export function useBrandingProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const scopeKey = brandingScopeKey(user);
  const sessionVersion = getBrandingSessionVersion();
  const [state, setState] = useState<BrandingState>(() => {
    const profile = getCachedBrandingProfile(scopeKey);
    return {
      scopeKey,
      sessionVersion,
      profile,
      isLoading: Boolean(scopeKey) && profile === null,
    };
  });

  useEffect(() => {
    if (!scopeKey || isAuthLoading) return;
    let isCancelled = false;

    const updateProfile = (profile: SchoolProfileSettings | null) => {
      if (!isCancelled && sessionVersion === getBrandingSessionVersion()) {
        setState({ scopeKey, sessionVersion, profile, isLoading: false });
      }
    };

    void fetchBrandingProfile()
      .then(updateProfile)
      .catch(() => updateProfile(null));

    const handleBrandingUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SchoolProfileSettings>;
      updateProfile(customEvent.detail);
    };

    window.addEventListener(BRANDING_UPDATED_EVENT, handleBrandingUpdated);
    return () => {
      isCancelled = true;
      window.removeEventListener(
        BRANDING_UPDATED_EVENT,
        handleBrandingUpdated,
      );
    };
  }, [scopeKey, sessionVersion, isAuthLoading]);

  if (!scopeKey || isAuthLoading) return { profile: null, isLoading: isAuthLoading };
  if (state.scopeKey !== scopeKey || state.sessionVersion !== sessionVersion) {
    const profile = getCachedBrandingProfile(scopeKey);
    return { profile, isLoading: profile === null };
  }
  return { profile: state.profile, isLoading: state.isLoading };
}
