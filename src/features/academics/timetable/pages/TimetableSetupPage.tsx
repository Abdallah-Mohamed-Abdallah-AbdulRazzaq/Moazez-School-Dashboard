"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  timetableOverviewQuery,
  timetableWorkspaceQuery,
} from "../services/timetableWorkspaceNavigation";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  TimetableSetupBlocker,
  TimetableSetupLoadError,
} from "@/features/academics/timetable/components/TimetableSetupFeedback";
import TimetableSetupWizard from "@/features/academics/timetable/components/TimetableSetupWizard";
import { useTimetableSetupStatus } from "@/features/academics/timetable/hooks/useTimetableSetupStatus";
import { usePermissions } from "@/hooks/usePermissions";

export default function TimetableSetupPage() {
  const t = useTranslations("academics.timetable");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    academicYearId,
    termId,
    termStatus,
    selectedAcademicYear,
    selectedTerm,
    isInitializing,
  } = useAcademicYearTermLayoutContext();
  const { hasPermission, isPermissionsReady } = usePermissions();
  const canManage = hasPermission("academics.structure.manage");
  const hasContext = Boolean(academicYearId && termId);
  const setup = useTimetableSetupStatus({
    academicYearId,
    termId,
    termStatus,
    canManage,
    enabled: !isInitializing && isPermissionsReady && hasContext,
  });
  const openTimetable = () =>
    router.replace(
      `/academics/timetable?${timetableOverviewQuery(searchParams.toString())}`,
    );
  const openWorkspace = () => {
    const params = timetableWorkspaceQuery(searchParams.toString(), {
      scopeType: "TERM",
    });
    params.set("year", academicYearId);
    params.set("term", termId);
    router.replace(`/academics/timetable?${params}`);
  };

  if (
    isInitializing ||
    !isPermissionsReady ||
    (setup.isLoading && !setup.status)
  ) {
    return (
      <div role="status" aria-label={t("loadingLabel")} aria-busy="true">
        <MainLoader />
      </div>
    );
  }

  if (!hasContext) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center text-gray-500">
        {t("emptyState.noAcademicContext")}
      </div>
    );
  }

  if (!setup.status) return null;

  if (setup.status.kind === "error") {
    return <TimetableSetupLoadError onRetry={setup.reload} />;
  }

  if (setup.status.kind === "read_only") {
    return (
      <main className="min-h-0 flex-1 bg-gray-50 p-4 sm:p-6">
        <TimetableSetupBlocker status={setup.status} />
      </main>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
      <TimetableSetupWizard
        key={`${academicYearId}:${termId}`}
        academicYearId={academicYearId}
        termId={termId}
        academicYearName={localizedContextName(selectedAcademicYear, locale)}
        termName={localizedContextName(selectedTerm, locale)}
        status={setup.status}
        entries={setup.entries}
        isRefreshing={setup.isLoading}
        onReload={setup.reload}
        onCancel={openTimetable}
        onComplete={openWorkspace}
      />
    </main>
  );
}

function localizedContextName(
  context:
    { name?: string; nameAr?: string; nameEn?: string } | null | undefined,
  locale: string,
): string {
  if (!context) return "";
  const candidates =
    locale === "ar"
      ? [context.nameAr, context.nameEn, context.name]
      : [context.nameEn, context.nameAr, context.name];
  return candidates.find((name) => name?.trim())?.trim() ?? "";
}
