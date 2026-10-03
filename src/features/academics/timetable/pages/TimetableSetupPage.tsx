"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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

  if (isInitializing || !isPermissionsReady || setup.isLoading) {
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
        onReload={setup.reload}
        onComplete={() => router.replace("/academics/timetable")}
      />
    </main>
  );
}

function localizedContextName(
  context:
    | { name?: string; nameAr?: string; nameEn?: string }
    | null
    | undefined,
  locale: string,
): string {
  if (!context) return "";
  const candidates =
    locale === "ar"
      ? [context.nameAr, context.nameEn, context.name]
      : [context.nameEn, context.nameAr, context.name];
  return candidates.find((name) => name?.trim())?.trim() ?? "";
}
