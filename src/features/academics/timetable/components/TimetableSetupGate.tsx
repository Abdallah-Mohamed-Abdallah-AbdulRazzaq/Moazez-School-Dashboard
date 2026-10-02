"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { TimetableContentLoadingSkeleton } from "@/features/academics/timetable/components/TimetableLoadingSkeletons";
import {
  TimetableSetupBlocker,
  TimetableSetupLoadError,
} from "@/features/academics/timetable/components/TimetableSetupFeedback";
import { useTimetableSetupStatus } from "@/features/academics/timetable/hooks/useTimetableSetupStatus";

interface TimetableSetupGateProps {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  canManage: boolean;
  children: ReactNode;
}

export default function TimetableSetupGate({
  academicYearId,
  termId,
  termStatus,
  canManage,
  children,
}: TimetableSetupGateProps) {
  const t = useTranslations("academics.timetable");
  const router = useRouter();
  const setup = useTimetableSetupStatus({
    academicYearId,
    termId,
    termStatus,
    canManage,
  });
  const mustRedirect =
    setup.status?.kind === "missing_config" ||
    setup.status?.kind === "missing_periods";

  useEffect(() => {
    if (mustRedirect) router.replace("/academics/timetable/setup");
  }, [mustRedirect, router]);

  if (setup.isLoading || !setup.status || mustRedirect) {
    return <TimetableContentLoadingSkeleton label={t("loadingLabel")} />;
  }

  if (setup.status.kind === "error") {
    return <TimetableSetupLoadError onRetry={setup.reload} />;
  }

  if (setup.status.kind === "read_only") {
    return <TimetableSetupBlocker status={setup.status} />;
  }

  return <>{children}</>;
}
