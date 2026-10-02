"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { AccessDenied, Button } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import TimetableSetupWizard from "@/features/academics/timetable/components/TimetableSetupWizard";
import { useTimetableSetupStatus } from "@/features/academics/timetable/hooks/useTimetableSetupStatus";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";
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
    return <SetupLoadError onRetry={setup.reload} />;
  }

  if (setup.status.kind === "read_only") {
    return <ReadOnlySetup status={setup.status} />;
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

function SetupLoadError({ onRetry }: { onRetry: () => Promise<void> }) {
  const t = useTranslations("academics.timetable");
  return (
    <main className="flex min-h-[24rem] flex-1 items-center justify-center bg-gray-50 p-6">
      <div role="alert" className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
        <p className="mt-3 text-sm text-gray-700">{t("setup.loadError")}</p>
        <Button className="mt-5" onClick={() => void onRetry()}>
          {t("setup.retry")}
        </Button>
      </div>
    </main>
  );
}

function ReadOnlySetup({
  status,
}: {
  status: Extract<TimetableSetupStatus, { kind: "read_only" }>;
}) {
  const t = useTranslations("academics.timetable");
  const description = t(
    status.reason === "closed_term"
      ? "setup.readOnly.closedTerm"
      : "setup.readOnly.missingPermission",
  );

  if (status.reason === "missing_permission") {
    return (
      <main className="min-h-0 flex-1 bg-gray-50 p-4 sm:p-6">
        <AccessDenied
          className="max-w-xl"
          title={t("setup.title")}
          description={description}
          requiredPermissions={["academics.structure.manage"]}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-[24rem] flex-1 items-center justify-center bg-gray-50 p-6">
      <div role="alert" className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
        <AlertTriangle className="mx-auto h-8 w-8" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold">{t("setup.title")}</h1>
        <p className="mt-2 text-sm">{description}</p>
      </div>
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
