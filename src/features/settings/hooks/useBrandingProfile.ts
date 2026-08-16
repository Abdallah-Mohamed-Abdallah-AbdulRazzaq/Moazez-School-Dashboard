"use client";

import { useEffect, useState } from "react";
import type { SchoolProfileSettings } from "@/features/settings/types";
import {
  BRANDING_UPDATED_EVENT,
  fetchBrandingProfile,
  getCachedBrandingProfile,
} from "@/features/settings/services/brandingService";

export function useBrandingProfile() {
  const [profile, setProfile] = useState<SchoolProfileSettings | null>(() =>
    getCachedBrandingProfile(),
  );
  const [isLoading, setIsLoading] = useState(profile === null);

  useEffect(() => {
    let isCancelled = false;

    void fetchBrandingProfile()
      .then((nextProfile) => {
        if (!isCancelled) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setProfile(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    const handleBrandingUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SchoolProfileSettings>;
      setProfile(customEvent.detail);
      setIsLoading(false);
    };

    window.addEventListener(BRANDING_UPDATED_EVENT, handleBrandingUpdated);
    return () => {
      isCancelled = true;
      window.removeEventListener(
        BRANDING_UPDATED_EVENT,
        handleBrandingUpdated,
      );
    };
  }, []);

  return { profile, isLoading };
}
