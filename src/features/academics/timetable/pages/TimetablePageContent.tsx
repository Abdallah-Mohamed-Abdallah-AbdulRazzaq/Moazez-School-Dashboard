"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { timetableOverviewQuery } from "../services/timetableWorkspaceNavigation";
import TimetableOverview from "../components/TimetableOverview";
import { AccessDenied, Button } from "@/components/ui";
import { TimetablePageLoadingSkeleton } from "../components/TimetableLoadingSkeletons";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useGuardedAcademicContextChange } from "@/features/academics/hooks/useGuardedAcademicContextChange";
import { DEFAULT_SCHOOL_ID } from "@/features/academics/constants/school";
import { usePermissions } from "@/hooks/usePermissions";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";

const TimetableView = dynamic(() => import("../components/TimetableView"), {
  loading: TimetableWorkspaceLoading,
});
const RoomsView = dynamic(() => import("../../rooms/components/RoomsView"), {
  loading: TimetableWorkspaceLoading,
});

function TimetableWorkspaceLoading() {
  const t = useTranslations("academics.timetable");
  return <TimetablePageLoadingSkeleton label={t("loadingLabel")} />;
}

export default function TimetablePageContent() {
  const t = useTranslations("academics.timetable");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("timetable");
  const {
    academicYearId,
    termId,
    termStatus,
    selectedAcademicYear,
    selectedTerm,
    isInitializing,
  } = useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const canManageStructure = hasPermission("academics.structure.manage");
  const pendingViewChangeRef = useRef<(() => void) | null>(null);
  const pendingContextDiscardRef = useRef<((discard: boolean) => void) | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const confirmContextDiscard = useCallback(
    () => new Promise<boolean>((resolve) => {
      pendingContextDiscardRef.current = resolve;
      setDiscardConfirmOpen(true);
    }),
    [],
  );
  useGuardedAcademicContextChange({
    hasUnsavedChanges: isDirty,
    confirmDiscard: confirmContextDiscard,
  });
  useEffect(() => () => pendingContextDiscardRef.current?.(false), []);

  const urlQueryState = useMemo(
    () => ({
      activeTab: searchParams.get("tab") === "rooms" ? "rooms" : "timetable",
      stageId: searchParams.get("stage") || "",
      gradeId: searchParams.get("grade") || "",
      sectionId: searchParams.get("section") || "",
      classroomId: searchParams.get("classroom") || "",
      workspace: [
        "workspace",
        "configurationScope",
        "configuration",
        "stage",
        "grade",
        "section",
        "classroom",
      ].some((key) => searchParams.has(key)),
      configurationQuery: searchParams.toString(),
    }),
    [searchParams],
  );
  const [retainedQueryState, setRetainedQueryState] = useState(urlQueryState);
  const queryState = isDirty ? retainedQueryState : urlQueryState;

  const isTermClosed = termStatus === "closed";
  const isReadOnly = isTermClosed || !canManageStructure;
  const schoolId = DEFAULT_SCHOOL_ID;

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        activeTab: "timetable" | "rooms";
        stageId: string;
        gradeId: string;
        sectionId: string;
        classroomId: string;
      }>,
      historyMode: "push" | "replace" = "push",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      if (historyMode === "push") {
        params.delete("entry");
      }
      const mergedState = {
        activeTab: nextState.activeTab ?? queryState.activeTab,
        stageId: nextState.stageId ?? queryState.stageId,
        gradeId: nextState.gradeId ?? queryState.gradeId,
        sectionId: nextState.sectionId ?? queryState.sectionId,
        classroomId: nextState.classroomId ?? queryState.classroomId,
      };

      if (mergedState.activeTab === "rooms") {
        params.set("tab", "rooms");
      } else {
        params.delete("tab");
        params.set("workspace", "1");
      }

      const entries: Array<[string, string]> = [
        ["stage", mergedState.stageId],
        ["grade", mergedState.gradeId],
        ["section", mergedState.sectionId],
        ["classroom", mergedState.classroomId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [
      queryState.activeTab,
      queryState.classroomId,
      queryState.gradeId,
      queryState.sectionId,
      queryState.stageId,
      router,
      searchParams,
    ],
  );

  const requestViewChange = useCallback(
    (applyViewChange: () => void) => {
      if (!isDirty) {
        applyViewChange();
        return;
      }

      pendingViewChangeRef.current = applyViewChange;
      setDiscardConfirmOpen(true);
    },
    [isDirty],
  );

  const cancelViewChange = useCallback(() => {
    pendingViewChangeRef.current = null;
    pendingContextDiscardRef.current?.(false);
    pendingContextDiscardRef.current = null;
    setDiscardConfirmOpen(false);
  }, []);

  const confirmViewChange = useCallback(() => {
    const applyViewChange = pendingViewChangeRef.current;
    pendingViewChangeRef.current = null;
    setDiscardConfirmOpen(false);
    clearDirty();
    pendingContextDiscardRef.current?.(true);
    pendingContextDiscardRef.current = null;
    applyViewChange?.();
  }, [clearDirty]);

  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      if (dirty) {
        if (!isDirty) {
          setRetainedQueryState(urlQueryState);
        }
        markDirty();
        return;
      }

      clearDirty();
    },
    [clearDirty, isDirty, markDirty, urlQueryState],
  );

  const handleStageChange = useCallback(
    (stageId: string) => {
      requestViewChange(() =>
        syncQueryParams(
          {
            stageId,
            gradeId: "",
            sectionId: "",
            classroomId: "",
          },
          "push",
        ),
      );
    },
    [requestViewChange, syncQueryParams],
  );

  const handleGradeChange = useCallback(
    (gradeId: string) => {
      requestViewChange(() =>
        syncQueryParams(
          {
            stageId: queryState.stageId,
            gradeId,
            sectionId: "",
            classroomId: "",
          },
          "push",
        ),
      );
    },
    [queryState.stageId, requestViewChange, syncQueryParams],
  );

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      requestViewChange(() =>
        syncQueryParams(
          {
            stageId: queryState.stageId,
            gradeId: queryState.gradeId,
            sectionId,
            classroomId: "",
          },
          "push",
        ),
      );
    },
    [
      queryState.gradeId,
      queryState.stageId,
      requestViewChange,
      syncQueryParams,
    ],
  );

  const handleClassroomChange = useCallback(
    (classroomId: string) => {
      requestViewChange(() =>
        syncQueryParams(
          {
            stageId: queryState.stageId,
            gradeId: queryState.gradeId,
            sectionId: queryState.sectionId,
            classroomId,
          },
          "push",
        ),
      );
    },
    [
      queryState.gradeId,
      queryState.sectionId,
      queryState.stageId,
      requestViewChange,
      syncQueryParams,
    ],
  );

  const handleNormalizeSelection = useCallback(
    (selection: {
      stageId: string;
      gradeId: string;
      sectionId: string;
      classroomId: string;
    }) => {
      syncQueryParams(selection, "replace");
    },
    [syncQueryParams],
  );

  if (isInitializing) {
    return <TimetablePageLoadingSkeleton label={t("loadingLabel")} />;
  }

  if (!academicYearId || !termId) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="text-gray-500">{t("emptyState.noAcademicContext")}</div>
      </div>
    );
  }

  if (
    queryState.activeTab === "timetable" &&
    !hasPermission("academics.structure.view")
  ) {
    return (
      <div className="p-6">
        <AccessDenied
          title={t("accessDenied.title")}
          description={t("accessDenied.description")}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      {/* Read-only Banner */}
      {isTermClosed && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-sm text-yellow-800">{t("readOnlyBanner")}</p>
        </div>
      )}
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {queryState.activeTab === "timetable" && !queryState.workspace && (
          <TimetableOverview
            key={`${academicYearId}:${termId}`}
            academicYearId={academicYearId}
            termId={termId}
            contextName={[
              localizedContextName(selectedAcademicYear, locale),
              localizedContextName(selectedTerm, locale),
            ]
              .filter(Boolean)
              .join(" · ")}
            readOnly={isReadOnly}
          />
        )}
        {queryState.activeTab === "timetable" && queryState.workspace && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2 print:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  requestViewChange(() =>
                    router.push(
                      `?${timetableOverviewQuery(searchParams.toString())}`,
                      { scroll: false },
                    ),
                  )
                }
              >
                {t("overview.back")}
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <TimetableView
                key={`${academicYearId}:${termId}`}
                schoolId={schoolId}
                configurationQuery={queryState.configurationQuery}
                academicYearId={academicYearId}
                academicYearName={localizedContextName(
                  selectedAcademicYear,
                  locale,
                )}
                termId={termId}
                termName={localizedContextName(selectedTerm, locale)}
                termStatus={termStatus}
                isReadOnly={isReadOnly}
                isDirty={isDirty}
                onDirtyChange={handleDirtyChange}
                selectedStageId={queryState.stageId}
                selectedGradeId={queryState.gradeId}
                selectedSectionId={queryState.sectionId}
                selectedClassroomId={queryState.classroomId}
                onStageChange={handleStageChange}
                onGradeChange={handleGradeChange}
                onSectionChange={handleSectionChange}
                onClassroomChange={handleClassroomChange}
                onNormalizeSelection={handleNormalizeSelection}
              />
            </div>
          </div>
        )}
        {queryState.activeTab === "rooms" && (
          <RoomsView
            schoolId={schoolId}
            academicYearId={academicYearId}
            termId={termId}
            isReadOnly={isTermClosed}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={discardConfirmOpen}
        onClose={cancelViewChange}
        onConfirm={confirmViewChange}
        title={t("unsavedChanges.label")}
        description={t("unsavedChanges.message")}
        confirmLabel={tCommon("discard")}
        cancelLabel={tCommon("cancel")}
        severity="warning"
      />
    </div>
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
