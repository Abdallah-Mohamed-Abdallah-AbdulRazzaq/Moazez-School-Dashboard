"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { YearDialog, TermDialog } from "@/features/academics/components/dialogs/YearTermDialogs";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import { AcademicYearTermLayoutProvider } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import type { UseAcademicYearTermContextOptions } from "@/features/academics/hooks/useAcademicYearTermContext";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";

function AcademicContextEmptyState({
  title,
  description,
  ctaLabel,
  canManage,
  onCreate,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  canManage: boolean;
  onCreate: () => void;
}) {
  const t = useTranslations("academics.structure.academic_context_empty");

  return (
    <div className="flex min-h-[420px] flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md rounded-2xl border border-dashed border-gray-300 bg-white px-8 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarDays className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        <div className="mt-6">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={onCreate}
            disabled={!canManage}
          >
            {ctaLabel}
          </Button>
        </div>
        {!canManage && (
          <p className="mt-3 text-xs text-gray-500">
            {t("permission_required")}
          </p>
        )}
      </div>
    </div>
  );
}

function AcademicsContextLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("academics.structure.academic_context_empty");
  const { hasPermission } = usePermissions();
  const canManageAcademicContext = hasPermission("academics.structure.manage");
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [showTermDialog, setShowTermDialog] = useState(false);
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
    selectedAcademicYear,
    isInitializing,
    refreshAcademicYears,
    refreshTerms,
    requestAcademicYearChange,
    requestTermChange,
    contextBarActions,
  } = useAcademicYearTermLayoutContext();
  const activeAcademicYear = selectedAcademicYear ?? academicYears[0] ?? null;
  const shouldShowNoYearsEmptyState =
    !isInitializing && academicYears.length === 0;
  const shouldShowNoTermsEmptyState =
    !isInitializing &&
    academicYears.length > 0 &&
    !!activeAcademicYear &&
    (!termId || terms.length === 0);

  const handleYearSuccess = async () => {
    const refreshedYears = await refreshAcademicYears();
    const nextYear = refreshedYears[0];

    if (nextYear) {
      await requestAcademicYearChange(nextYear.id);
    }
  };

  const handleTermSuccess = async () => {
    if (!activeAcademicYear) {
      return;
    }

    await requestAcademicYearChange(activeAcademicYear.id);
  };

  const content = shouldShowNoYearsEmptyState ? (
    <AcademicContextEmptyState
      title={t("no_years_title")}
      description={t("no_years_description")}
      ctaLabel={t("create_year")}
      canManage={canManageAcademicContext}
      onCreate={() => setShowYearDialog(true)}
    />
  ) : shouldShowNoTermsEmptyState ? (
    <AcademicContextEmptyState
      title={t("no_terms_title")}
      description={t("no_terms_description")}
      ctaLabel={t("create_term")}
      canManage={canManageAcademicContext}
      onCreate={() => setShowTermDialog(true)}
    />
  ) : (
    children
  );

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gray-50">
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        academicYears={academicYears}
        terms={terms}
        isLoadingYears={isInitializing}
        isLoadingTerms={false}
        onRefreshAcademicYears={refreshAcademicYears}
        onRefreshTerms={() => refreshTerms()}
        onAcademicYearChange={(yearId) => {
          void requestAcademicYearChange(yearId);
        }}
        onTermChange={requestTermChange}
        isReadOnly={termStatus === "closed"}
        onPromoteCarryOver={contextBarActions?.onPromoteCarryOver}
        showPromoteCarryOver={contextBarActions?.showPromoteCarryOver ?? false}
        disablePromoteCarryOver={
          contextBarActions?.disablePromoteCarryOver ?? false
        }
        disableYearTermEditing={
          contextBarActions?.disableYearTermEditing ?? false
        }
      />
      <div className="flex-1 min-h-0">{content}</div>
      <YearDialog
        isOpen={showYearDialog}
        onClose={() => setShowYearDialog(false)}
        onSuccess={handleYearSuccess}
        existingYears={academicYears}
        editYear={null}
      />
      {activeAcademicYear && (
        <TermDialog
          isOpen={showTermDialog}
          onClose={() => setShowTermDialog(false)}
          onSuccess={handleTermSuccess}
          academicYear={activeAcademicYear}
          existingTerms={terms}
          editTerm={null}
          isReadOnly={!canManageAcademicContext}
        />
      )}
    </div>
  );
}

export default function AcademicsContextLayout({
  children,
  contextOptions,
}: {
  children: React.ReactNode;
  contextOptions?: UseAcademicYearTermContextOptions;
}) {
  const providerKey = `${contextOptions?.yearParamKey ?? "year"}:${contextOptions?.termParamKey ?? "term"}:${
    contextOptions?.termStatusParamKey ?? "status"
  }`;

  return (
    <AcademicYearTermLayoutProvider key={providerKey} options={contextOptions}>
      <AcademicsContextLayoutContent>{children}</AcademicsContextLayoutContent>
    </AcademicYearTermLayoutProvider>
  );
}
