"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertTitle, useMediaQuery, useTheme } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import { useToast } from "@/components/ui/toast/Toast";
import LessonPlansFilters from "../components/LessonPlansFilters";
import LessonPlansBoard from "../components/LessonPlansBoard";
import LessonPlansPageHeader from "../components/LessonPlansPageHeader";
import LessonPlansSkeleton from "../components/LessonPlansSkeleton";
import FiltersDrawer from "../components/FiltersDrawer";
import LessonLibraryDrawer from "../components/LessonLibraryDrawer";
import AddLessonDialog from "../components/AddLessonDialog";
import MobileBottomBar from "../components/MobileBottomBar";
import AutoPlanDialog from "../components/AutoPlanDialog";
import LessonPlansMissingDataCta from "../components/LessonPlansMissingDataCta";
import CreateLessonPlanDialog, {
  type CreateLessonPlanDialogPayload,
} from "../components/CreateLessonPlanDialog";
import LessonPlanValidationPanel from "../components/LessonPlanValidationPanel";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useLessonPlansData } from "../hooks/useLessonPlansData";
import {
  subjectsForLessonPlanGrade,
  useLessonPlansFilters,
} from "../hooks/useLessonPlansFilters";
import { useLessonPlanMutations } from "../hooks/useLessonPlanMutations";
import {
  canEditLessonPlans,
  canOpenAutoPlan,
  missingDataStatusForLessonPlansView,
  resolveLessonPlansView,
} from "./lessonPlansPageState";
import { usePermissions } from "@/hooks/usePermissions";
import { createLessonPlan } from "../services/lessonPlansService";
import { lessonPlansUiError } from "../services/lessonPlansErrors";
import {
  getAutoPlanReadiness,
  type AutoPlanBlockingReason,
} from "../services/autoPlanReadiness";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";

export default function LessonPlansPage() {
  const t = useTranslations("academics.lessonPlans");
  const tCommon = useTranslations("common");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { hasPermission } = usePermissions();
  const canManageLessonPlans = hasPermission("academics.lesson_plans.manage");
  const { academicYearId, termId, termStatus, selectedTerm, isInitializing } =
    useAcademicYearTermLayoutContext();
  const handleLoadError = useCallback(() => {
    showError(tCommon("error"));
  }, [showError, tCommon]);
  const queryFilters = useMemo(
    () => ({
      stageId: searchParams.get("stage") || "",
      gradeId: searchParams.get("grade") || "",
      sectionId: searchParams.get("section") || "",
      classroomId: searchParams.get("classroom") || "",
      subjectId: searchParams.get("subject") || "",
    }),
    [searchParams],
  );
  const {
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    hasFilters,
    getFilteredGrades,
    getFilteredSections,
    getFilteredClassrooms,
  } = useLessonPlansFilters({
    initialFilters: queryFilters,
  });

  // Mobile drawer states
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAutoPlanDialog, setShowAutoPlanDialog] = useState(false);
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const libraryQueryState = useMemo(
    () => ({
      isOpen: searchParams.get("library") === "1",
      search: searchParams.get("librarySearch") || "",
      unitId: searchParams.get("libraryUnit") || "",
    }),
    [searchParams],
  );
  const [librarySearchInput, setLibrarySearchInput] = useState(
    libraryQueryState.search,
  );
  useEffect(() => {
    void Promise.resolve().then(() => {
      setLibrarySearchInput(libraryQueryState.search);
    });
  }, [libraryQueryState.search]);
  const {
    stages,
    grades,
    sections,
    classrooms,
    subjects,
    subjectAllocations,
    teachers,
    units,
    lessons,
    plans,
    weeks,
    summary,
    summaryLoading,
    summaryError,
    validation,
    validationLoading,
    validationError,
    assignedTeacherId,
    teacherSubjectAllocationId,
    curriculumId,
    resolvedClassroomId,
    loading,
    plansLoading,
    isInitialLoading,
    isRefreshing,
    dataChecked,
    scopeStatus,
    refreshAllLessonPlans,
    refreshPlanDetail,
    refreshSummaryAndValidation,
    upsertPlan,
    removePlan,
    upsertPlanItem,
    removePlanItem,
  } = useLessonPlansData({
    academicYearId,
    termId,
    isInitializing,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    onLoadError: handleLoadError,
  });
  const isTermClosed = termStatus === "closed";
  const isReadOnly = !canEditLessonPlans({
    canManage: canManageLessonPlans,
    termStatus,
  });
  const filteredGrades = useMemo(
    () => getFilteredGrades(grades),
    [getFilteredGrades, grades],
  );
  const filteredSections = useMemo(
    () => getFilteredSections(sections),
    [getFilteredSections, sections],
  );
  const filteredClassrooms = useMemo(
    () => getFilteredClassrooms(classrooms),
    [classrooms, getFilteredClassrooms],
  );
  const filteredSubjects = useMemo(
    () =>
      subjectsForLessonPlanGrade({
        subjects,
        subjectAllocations,
        gradeId: selectedGradeId,
        currentSubjectId: selectedSubjectId,
      }),
    [selectedGradeId, selectedSubjectId, subjectAllocations, subjects],
  );
  const displayedClassroomId = selectedClassroomId || resolvedClassroomId;
  const classroomRequired = classrooms.some(
    (classroom) => classroom.sectionId === selectedSectionId,
  );
  const scopeLabels = useMemo(() => {
    const selectedStage = stages.find((stage) => stage.id === selectedStageId);
    const selectedGrade = grades.find((grade) => grade.id === selectedGradeId);
    const selectedSection = sections.find(
      (section) => section.id === selectedSectionId,
    );
    const selectedClassroom = classrooms.find(
      (classroom) => classroom.id === displayedClassroomId,
    );
    const selectedSubject = subjects.find(
      (subject) => subject.id === selectedSubjectId,
    );

    return [
      selectedStage &&
        (locale === "ar" ? selectedStage.nameAr : selectedStage.nameEn),
      selectedGrade &&
        (locale === "ar" ? selectedGrade.nameAr : selectedGrade.nameEn),
      selectedSection &&
        (locale === "ar" ? selectedSection.nameAr : selectedSection.nameEn),
      selectedClassroom &&
        (locale === "ar" ? selectedClassroom.nameAr : selectedClassroom.nameEn),
      selectedSubject &&
        (locale === "ar" ? selectedSubject.nameAr : selectedSubject.nameEn),
    ].filter(Boolean) as string[];
  }, [
    classrooms,
    displayedClassroomId,
    grades,
    locale,
    sections,
    selectedGradeId,
    selectedSectionId,
    selectedStageId,
    selectedSubjectId,
    stages,
    subjects,
  ]);
  const syncFilterParams = useCallback(
    (
      filters: {
        stageId: string;
        gradeId: string;
        sectionId: string;
        classroomId: string;
        subjectId: string;
      },
      historyMode: "push" | "replace" = "push",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const entries: Array<[string, string]> = [
        ["stage", filters.stageId],
        ["grade", filters.gradeId],
        ["section", filters.sectionId],
        ["classroom", filters.classroomId],
        ["subject", filters.subjectId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const nextUrl = `?${params.toString()}`;
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParams],
  );
  const syncLibraryParams = useCallback(
    (
      nextLibraryState: {
        isOpen?: boolean;
        search?: string;
        unitId?: string;
      },
      historyMode: "push" | "replace" = "replace",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const isOpen = nextLibraryState.isOpen ?? libraryQueryState.isOpen;
      const search = nextLibraryState.search ?? libraryQueryState.search;
      const unitId = nextLibraryState.unitId ?? libraryQueryState.unitId;

      if (isOpen) {
        params.set("library", "1");
      } else {
        params.delete("library");
      }

      if (search) {
        params.set("librarySearch", search);
      } else {
        params.delete("librarySearch");
      }

      if (unitId) {
        params.set("libraryUnit", unitId);
      } else {
        params.delete("libraryUnit");
      }

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
      libraryQueryState.isOpen,
      libraryQueryState.search,
      libraryQueryState.unitId,
      router,
      searchParams,
    ],
  );
  const syncLibrarySearchParam = useDebouncedCallback((value: string) => {
    syncLibraryParams({ search: value }, "replace");
  }, 250);
  useEffect(() => {
    if (!selectedSectionId) {
      return;
    }

    const classroomOptionsLoaded = filteredClassrooms.length > 0;

    if (selectedClassroomId && !classroomOptionsLoaded) {
      return;
    }

    const hasValidSelectedClassroom =
      !!selectedClassroomId &&
      filteredClassrooms.some(
        (classroom) => classroom.id === selectedClassroomId,
      );

    if (hasValidSelectedClassroom) {
      return;
    }

    if (!resolvedClassroomId) {
      return;
    }

    if (resolvedClassroomId === selectedClassroomId) {
      return;
    }

    syncFilterParams(
      {
        stageId: selectedStageId,
        gradeId: selectedGradeId,
        sectionId: selectedSectionId,
        classroomId: resolvedClassroomId,
        subjectId: selectedSubjectId,
      },
      "replace",
    );
  }, [
    filteredClassrooms,
    resolvedClassroomId,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    selectedStageId,
    selectedSubjectId,
    syncFilterParams,
  ]);
  useEffect(
    () => () => {
      syncLibrarySearchParam.cancel();
    },
    [syncLibrarySearchParam],
  );
  const {
    addLessonDialog,
    handleSelectLessonFromLibrary,
    handleAddLessonFromWeek,
    handleConfirmAddLesson,
    closeAddLessonDialog,
    previewAutoPlan,
    applyAutoPlan,
  } = useLessonPlanMutations({
    academicYearId,
    termId,
    termStartDate: selectedTerm?.startDate,
    termEndDate: selectedTerm?.endDate,
    selectedSubjectId,
    selectedClassroomId: displayedClassroomId,
    assignedTeacherId,
    teacherSubjectAllocationId,
    curriculumId,
    classroomRequired,
    lessons,
    plans,
    weeks,
    refreshPlans: refreshAllLessonPlans,
    refreshPlanDetail,
    refreshSummaryAndValidation,
    upsertPlanItem,
    showSuccess,
    showError,
    onLessonSelected: () => syncLibraryParams({ isOpen: false }, "replace"),
    validationMessages: {
      missingWeek: t("validation.week_outside_term"),
      noInstructionalDays: t("validation.no_instructional_days"),
      weekOutsideTerm: t("validation.week_outside_term"),
      plannedDateOutsideTerm: t("validation.planned_date_outside_term"),
    },
  });

  const handlePlansUpdate = useCallback(
    async (options?: { silent?: boolean }) => {
      await refreshAllLessonPlans(options);
    },
    [refreshAllLessonPlans],
  );

  const handleStageFilterChange = useCallback(
    (stageId: string) => {
      syncFilterParams(
        {
          stageId,
          gradeId: "",
          sectionId: "",
          classroomId: "",
          subjectId: "",
        },
        "push",
      );
    },
    [syncFilterParams],
  );

  const handleGradeFilterChange = useCallback(
    (gradeId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId,
          sectionId: "",
          classroomId: "",
          subjectId: "",
        },
        "push",
      );
    },
    [selectedStageId, syncFilterParams],
  );

  const handleSectionFilterChange = useCallback(
    (sectionId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId,
          classroomId: "",
          subjectId: selectedSubjectId,
        },
        "push",
      );
    },
    [selectedGradeId, selectedStageId, selectedSubjectId, syncFilterParams],
  );

  const handleClassroomFilterChange = useCallback(
    (classroomId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          classroomId,
          subjectId: selectedSubjectId,
        },
        "push",
      );
    },
    [
      selectedGradeId,
      selectedSectionId,
      selectedStageId,
      selectedSubjectId,
      syncFilterParams,
    ],
  );

  const handleSubjectFilterChange = useCallback(
    (subjectId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          classroomId: displayedClassroomId,
          subjectId,
        },
        "push",
      );
    },
    [
      displayedClassroomId,
      selectedGradeId,
      selectedSectionId,
      selectedStageId,
      syncFilterParams,
    ],
  );

  const handleApplyFilters = useCallback(
    (filters: {
      stageId: string;
      gradeId: string;
      sectionId: string;
      classroomId: string;
      subjectId: string;
    }) => {
      syncFilterParams(filters, "push");
    },
    [syncFilterParams],
  );
  const handleOpenLibrary = useCallback(() => {
    syncLibraryParams({ isOpen: true }, "push");
  }, [syncLibraryParams]);

  const handleCloseLibrary = useCallback(() => {
    syncLibraryParams({ isOpen: false }, "replace");
  }, [syncLibraryParams]);

  const handleLibrarySearchChange = (value: string) => {
    setLibrarySearchInput(value);
    syncLibrarySearchParam(value);
  };

  const handleLibraryUnitChange = useCallback(
    (value: string) => {
      syncLibraryParams({ unitId: value }, "replace");
    },
    [syncLibraryParams],
  );

  const handleAddLessonFromWeekWithLibrary = useCallback(
    (weekIndex: number) => {
      handleAddLessonFromWeek(weekIndex);
      syncLibraryParams({ isOpen: true }, "push");
    },
    [handleAddLessonFromWeek, syncLibraryParams],
  );

  const handleMissingDataNavigation = useCallback(
    (href: string) => router.push(href),
    [router],
  );

  const lessonPlanExportRows = useMemo(() => {
    const unitMap = new Map(units.map((unit) => [unit.id, unit]));
    const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    return plans.flatMap((plan) =>
      plan.items.map((item) => {
        const lesson = lessonMap.get(item.lessonId);
        const unit = item.unitId ? unitMap.get(item.unitId) : undefined;
        return {
          week: plan.weekIndex,
          status: t(`status.${item.status}`),
          lesson: lesson?.title || "",
          unit: unit?.title || "",
          order: item.order,
          notes:
            locale === "ar"
              ? item.notesAr || item.notesEn || ""
              : item.notesEn || item.notesAr || "",
        };
      }),
    );
  }, [lessons, locale, plans, t, units]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: termId || undefined,
      gradeName: selectedGradeId || undefined,
      sectionName: selectedSectionId || undefined,
      classroomName: displayedClassroomId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columns: ExportColumn[] = [
      { key: "week", label: locale === "ar" ? "الأسبوع" : "Week" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "unit", label: locale === "ar" ? "الوحدة" : "Unit" },
      { key: "lesson", label: locale === "ar" ? "الدرس" : "Lesson" },
      { key: "order", label: locale === "ar" ? "الترتيب" : "Order" },
      { key: "notes", label: locale === "ar" ? "الملاحظات" : "Notes" },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename(
        "lesson-plans",
        termId,
        displayedClassroomId ||
          selectedSectionId ||
          selectedGradeId ||
          undefined,
      ),
      format,
      columns,
      rows: lessonPlanExportRows,
      locale,
      jsonData: {
        title: "Lesson Plans",
        metadata,
        filters: {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          classroomId: displayedClassroomId,
          subjectId: selectedSubjectId,
        },
        summary,
        rows: plans.map((plan) => ({
          weekIndex: plan.weekIndex,
          updatedAt: plan.updatedAt,
          items: plan.items,
        })),
      },
    });
  };

  const scopeResolved = !isInitializing && !loading;
  const viewState = resolveLessonPlansView({
    loading: isInitialLoading,
    scopeResolved,
    dataChecked,
    selectedSectionId,
    selectedSubjectId,
    teacherSubjectAllocationId,
    curriculumId,
    weeks,
    lessons,
  });
  const missingDataStatus = missingDataStatusForLessonPlansView(
    scopeStatus,
    viewState,
  );
  const missingDataScope = useMemo(
    () => ({
      academicYearId,
      termId,
      stageId: selectedStageId,
      gradeId: selectedGradeId,
      sectionId: selectedSectionId,
      classroomId: displayedClassroomId,
      subjectId: selectedSubjectId,
    }),
    [
      academicYearId,
      displayedClassroomId,
      selectedGradeId,
      selectedSectionId,
      selectedStageId,
      selectedSubjectId,
      termId,
    ],
  );
  const showSkeleton = viewState === "loading";
  const createPlanDisabled =
    isReadOnly || scopeStatus !== "ready" || weeks.length === 0;
  const autoPlanReadiness = useMemo(
    () =>
      getAutoPlanReadiness({
        scopeStatus,
        termId,
        teacherSubjectAllocationId,
        curriculumId,
        lessons,
        selectedSubjectId,
        selectedGradeId,
        selectedClassroomId: displayedClassroomId,
        teacherAllocation: {
          id: teacherSubjectAllocationId,
          subjectId: selectedSubjectId,
          classroomId: displayedClassroomId,
        },
        curriculum: {
          id: curriculumId,
          subjectId: selectedSubjectId,
          gradeId: selectedGradeId,
        },
        termStartDate: selectedTerm?.startDate,
        termEndDate: selectedTerm?.endDate,
        termStatus,
      }),
    [
      curriculumId,
      lessons,
      displayedClassroomId,
      scopeStatus,
      selectedGradeId,
      selectedSubjectId,
      selectedTerm?.endDate,
      selectedTerm?.startDate,
      teacherSubjectAllocationId,
      termId,
      termStatus,
    ],
  );
  const firstAutoPlanPreviewBlockingReason =
    autoPlanReadiness.previewBlockingReasons[0] as
      | AutoPlanBlockingReason
      | undefined;
  const firstAutoPlanApplyBlockingReason =
    autoPlanReadiness.applyBlockingReasons[0] as
    | AutoPlanBlockingReason
    | undefined;

  const isSecondaryLoading = summaryLoading || validationLoading;

  const autoPlanPreviewBlockedMessage = isSecondaryLoading
    ? t("autoPlan.checkingReadiness", {
        defaultValue: "Checking auto-plan readiness...",
      })
    : firstAutoPlanPreviewBlockingReason
      ? t(`autoPlan.readiness.${firstAutoPlanPreviewBlockingReason}`)
      : t("tooltips.autoPlanUnavailable");
  const autoPlanApplyBlockedMessage = isSecondaryLoading
    ? t("autoPlan.checkingReadiness", {
        defaultValue: "Checking auto-plan readiness...",
      })
    : firstAutoPlanApplyBlockingReason
      ? t(`autoPlan.readiness.${firstAutoPlanApplyBlockingReason}`)
      : t("tooltips.autoPlanUnavailable");
  const canOpenAutoPlanDialog = canOpenAutoPlan({
    canManage: canManageLessonPlans,
    canPreview: autoPlanReadiness.canPreview,
  });

  const handleCreatePlan = async (payload: CreateLessonPlanDialogPayload) => {
    if (
      scopeStatus !== "ready" ||
      !academicYearId ||
      !termId ||
      !teacherSubjectAllocationId ||
      !curriculumId ||
      !selectedSubjectId ||
      (classroomRequired && !displayedClassroomId)
    ) {
      showError(t("scope.incompleteScope"));
      return;
    }
    setCreatingPlan(true);
    try {
      const createdPlan = await createLessonPlan({
        academicYearId,
        termId,
        teacherSubjectAllocationId,
        teacherUserId: assignedTeacherId || undefined,
        classroomId: displayedClassroomId || undefined,
        subjectId: selectedSubjectId || undefined,
        curriculumId,
        ...payload,
      });
      await refreshPlanDetail(createdPlan.id);
      setShowCreatePlanDialog(false);
      showSuccess(t("createPlan.success"));
      void refreshSummaryAndValidation({ silent: true });
    } catch (error) {
      showError(lessonPlansUiError(error));
    } finally {
      setCreatingPlan(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="flex-1">
        <LessonPlansPageHeader
          scopeLabels={scopeLabels}
          createPlanDisabled={createPlanDisabled}
          autoPlanDisabled={!canOpenAutoPlanDialog}
          autoPlanUnavailableReason={
            !canManageLessonPlans
              ? t("readOnlyBanner")
              : autoPlanPreviewBlockedMessage
          }
          exportDisabled={lessonPlanExportRows.length === 0}
          refreshing={isRefreshing || plansLoading}
          onAutoPlan={() => setShowAutoPlanDialog(true)}
          onCreatePlan={() => setShowCreatePlanDialog(true)}
          onRefresh={handlePlansUpdate}
          onExport={() => setShowExportModal(true)}
        />

        {/* Read-only banner */}
        {isTermClosed && (
          <div className="p-4">
            <Alert severity="warning">
              <AlertTitle>{t("readOnlyBanner")}</AlertTitle>
            </Alert>
          </div>
        )}

        {/* Filters */}
        {!isMobile && (
          <LessonPlansFilters
            stages={stages}
            grades={filteredGrades}
            sections={filteredSections}
            classrooms={filteredClassrooms}
            subjects={filteredSubjects}
            teachers={teachers}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedClassroomId={displayedClassroomId}
            selectedSubjectId={selectedSubjectId}
            assignedTeacherId={assignedTeacherId}
            onStageChange={handleStageFilterChange}
            onGradeChange={handleGradeFilterChange}
            onSectionChange={handleSectionFilterChange}
            onClassroomChange={handleClassroomFilterChange}
            onSubjectChange={handleSubjectFilterChange}
            disabled={loading}
            loading={loading}
          />
        )}

        {/* Main content */}
        <div className={isMobile ? "p-4 pb-24" : "p-6"}>
          {showSkeleton ? (
            <LessonPlansSkeleton />
          ) : scopeStatus !== "ready" ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noSelection.title")}
              </h3>
              <p className={missingDataStatus ? "mb-4 text-gray-600" : "text-gray-600"}>
                {t(
                  scopeStatus === "missing-classroom"
                    ? "scope.selectClassroom"
                    : scopeStatus === "missing-teacher-allocation"
                      ? "scope.noTeacherAllocation"
                      : scopeStatus === "missing-curriculum"
                        ? "scope.noCurriculum"
                        : scopeStatus === "missing-grade"
                          ? "scope.selectGrade"
                          : scopeStatus === "missing-section"
                            ? "scope.selectSection"
                            : scopeStatus === "missing-subject"
                              ? "scope.selectSubject"
                              : "scope.incompleteScope",
                )}
              </p>
              {missingDataStatus && (
                <LessonPlansMissingDataCta
                  status={missingDataStatus}
                  locale={locale}
                  scope={missingDataScope}
                  onNavigate={handleMissingDataNavigation}
                />
              )}
            </div>
          ) : viewState === "no-selection" ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("scope.incompleteScope")}</p>
            </div>
          ) : filteredClassrooms.length > 1 && !displayedClassroomId ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("filters.selectClassroom")}
              </h3>
              <p className="text-gray-600">
                {t("emptyState.selectClassroom.message")}
              </p>
            </div>
          ) : viewState === "no-allocation" ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noAllocation.title")}
              </h3>
              <p className="text-gray-600">
                {t("emptyState.noAllocation.message")}
              </p>
            </div>
          ) : viewState === "no-curriculum" ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noCurriculum.title")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("emptyState.noCurriculum.message")}
              </p>
              <LessonPlansMissingDataCta
                status="missing-curriculum"
                locale={locale}
                scope={missingDataScope}
                onNavigate={handleMissingDataNavigation}
              />
            </div>
          ) : viewState === "no-weeks" ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noWeeks.title")}
              </h3>
              <p className="text-gray-600">{t("emptyState.noWeeks.message")}</p>
            </div>
          ) : viewState === "no-lessons" ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noLessons.title")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("emptyState.noLessons.message")}
              </p>
              <LessonPlansMissingDataCta
                status="no-curriculum-lessons"
                locale={locale}
                scope={missingDataScope}
                onNavigate={handleMissingDataNavigation}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {(validation || validationLoading || validationError) && (
                <LessonPlanValidationPanel
                  validation={validation}
                  isLoading={validationLoading}
                  error={validationError}
                  onRetry={() => void refreshSummaryAndValidation()}
                />
              )}
              <LessonPlansBoard
                academicYearId={academicYearId}
                termId={termId}
                summaryLoading={summaryLoading}
                summaryError={summaryError}
                termStartDate={selectedTerm?.startDate}
                termEndDate={selectedTerm?.endDate}
                teacherSubjectAllocationId={teacherSubjectAllocationId}
                curriculumId={curriculumId}
                subjectId={selectedSubjectId}
                gradeId={selectedGradeId}
                sectionId={selectedSectionId}
                classroomId={displayedClassroomId}
                teacherId={assignedTeacherId}
                lessons={lessons}
                units={units}
                plans={plans}
                weeks={weeks}
                summary={summary}
                validation={validation}
                isReadOnly={isReadOnly}
                librarySearchQuery={librarySearchInput}
                librarySelectedUnitId={libraryQueryState.unitId}
                onLibrarySearchQueryChange={handleLibrarySearchChange}
                onLibrarySelectedUnitIdChange={handleLibraryUnitChange}
                onRefreshPlanDetail={refreshPlanDetail}
                onRefreshSummaryAndValidation={refreshSummaryAndValidation}
                onUpsertPlanItem={upsertPlanItem}
                onRemovePlanItem={removePlanItem}
                onUpsertPlan={upsertPlan}
                onRemovePlan={removePlan}
                onSelectLessonFromLibrary={handleSelectLessonFromLibrary}
                onAddLessonMobile={handleAddLessonFromWeekWithLibrary}
                validationMessages={{
                  noInstructionalDays: t("validation.no_instructional_days"),
                  weekOutsideTerm: t("validation.week_outside_term"),
                  plannedDateOutsideTerm: t(
                    "validation.planned_date_outside_term",
                  ),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawers and Bottom Bar - Always render when mobile */}
      {isMobile && (
        <>
          <FiltersDrawer
            isOpen={filtersDrawerOpen}
            onClose={() => setFiltersDrawerOpen(false)}
            stages={stages}
            grades={filteredGrades}
            sections={filteredSections}
            classrooms={filteredClassrooms}
            subjects={subjects}
            subjectAllocations={subjectAllocations}
            teachers={teachers}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedClassroomId={displayedClassroomId}
            selectedSubjectId={selectedSubjectId}
            assignedTeacherId={assignedTeacherId}
            onApply={handleApplyFilters}
          />

          <LessonLibraryDrawer
            isOpen={libraryQueryState.isOpen}
            onClose={handleCloseLibrary}
            lessons={lessons}
            units={units}
            plans={plans}
            searchQuery={librarySearchInput}
            selectedUnitId={libraryQueryState.unitId}
            onSearchQueryChange={handleLibrarySearchChange}
            onSelectedUnitIdChange={handleLibraryUnitChange}
            onSelectLesson={handleSelectLessonFromLibrary}
            isReadOnly={isReadOnly}
          />

          <MobileBottomBar
            onOpenFilters={() => setFiltersDrawerOpen(true)}
            onOpenLibrary={handleOpenLibrary}
            hasFilters={hasFilters}
            isReadOnly={isReadOnly}
          />
        </>
      )}

      <AddLessonDialog
        isOpen={addLessonDialog.isOpen}
        lesson={addLessonDialog.lesson}
        weeks={weeks}
        preselectedWeekIndex={addLessonDialog.preselectedWeekIndex}
        termStartDate={selectedTerm?.startDate}
        termEndDate={selectedTerm?.endDate}
        academicYearId={academicYearId}
        termId={termId}
        gradeId={selectedGradeId}
        sectionId={selectedSectionId}
        classroomId={displayedClassroomId}
        teacherUserId={assignedTeacherId}
        subjectId={selectedSubjectId}
        teacherSubjectAllocationId={teacherSubjectAllocationId}
        onClose={closeAddLessonDialog}
        onConfirm={handleConfirmAddLesson}
      />

      {showCreatePlanDialog && (
        <CreateLessonPlanDialog
          isOpen
          weeks={weeks}
          plans={plans}
          termStartDate={selectedTerm?.startDate}
          termEndDate={selectedTerm?.endDate}
          loading={creatingPlan}
          onClose={() => setShowCreatePlanDialog(false)}
          onSubmit={handleCreatePlan}
        />
      )}

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={lessonPlanExportRows.length}
      />
      <AutoPlanDialog
        isOpen={showAutoPlanDialog}
        termStartDate={selectedTerm?.startDate}
        termEndDate={selectedTerm?.endDate}
        onClose={() => setShowAutoPlanDialog(false)}
        onPreview={previewAutoPlan}
        onApply={applyAutoPlan}
        showError={showError}
        readiness={autoPlanReadiness}
        previewBlockedMessage={autoPlanPreviewBlockedMessage}
        applyBlockedMessage={autoPlanApplyBlockedMessage}
        hasVisibleLessons={lessons.length > 0}
        locale={locale}
        scope={missingDataScope}
        onNavigate={handleMissingDataNavigation}
      />
    </div>
  );
}
