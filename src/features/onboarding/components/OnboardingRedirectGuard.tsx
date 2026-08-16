"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useSetupStatusContext } from "../context/SetupStatusContext";
import { isSetupSnapshotLoading } from "../utils/setupStatus";

function skippedStorageKey(schoolId: string) {
  return `sis:onboarding:skipped:${schoolId}`;
}

function localeFromPathname(pathname: string | null) {
  return pathname?.split("/").filter(Boolean)[0] || "en";
}

function isOnboardingPath(pathname: string | null) {
  return Boolean(pathname?.match(/^\/[^/]+\/settings\/onboarding(?:\/)?$/));
}

export function markOnboardingSkipped(schoolId: string) {
  if (!schoolId) return;
  sessionStorage.setItem(skippedStorageKey(schoolId), "true");
}

export function hasSkippedOnboarding(schoolId: string) {
  if (!schoolId) return false;
  return sessionStorage.getItem(skippedStorageKey(schoolId)) === "true";
}

export function OnboardingRedirectGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { evaluation, schoolId, snapshot } = useSetupStatusContext();
  const isSnapshotLoading = isSetupSnapshotLoading(snapshot);
  const onboardingPath = isOnboardingPath(pathname);
  const skipped = schoolId ? hasSkippedOnboarding(schoolId) : false;
  const shouldRedirect = Boolean(
    schoolId &&
      !evaluation.isComplete &&
      !onboardingPath &&
      !isSnapshotLoading &&
      !skipped,
  );

  useEffect(() => {
    if (!shouldRedirect) return;

    router.replace(`/${localeFromPathname(pathname)}/settings/onboarding`);
  }, [pathname, router, shouldRedirect]);

  if (isSnapshotLoading || shouldRedirect) {
    return <MainLoader />;
  }

  return <>{children}</>;
}
