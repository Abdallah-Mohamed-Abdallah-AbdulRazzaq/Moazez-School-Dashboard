"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  Lesson,
  Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  LessonPlan,
  LessonPlanItem,
  WeekInfo,
  LessonPlanSummary,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import LessonLibrary from "./LessonLibrary";
import WeeksBoardDesktop from "./WeeksBoardDesktop";
import WeeksBoardMobile from "./WeeksBoardMobile";
import ProgressSummary from "./ProgressSummary";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import {
  createLessonPlan,
  createLessonPlanItem,
  deleteLessonPlanItem,
  moveLessonPlanItem,
  updateLessonPlanItem,
  startLessonPlanItem,
  completeLessonPlanItem,
  skipLessonPlanItem,
  cancelLessonPlanItem,
  updateLessonPlan,
  activateLessonPlan,
  archiveLessonPlan,
  deleteLessonPlan,
  reorderLessonPlanItem,
  type UpdateLessonPlanRequest,
  type UpdateLessonPlanItemRequest,
  type LessonPlanValidationResponseDto,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import EditLessonPlanDialog from "./EditLessonPlanDialog";
import SkipCancelReasonDialog from "./SkipCancelReasonDialog";
import MoveLessonDialog from "./MoveLessonDialog";
import EditLessonPlanItemDialog from "./EditLessonPlanItemDialog";
import { lessonPlansUiError } from "../services/lessonPlansErrors";
import { isDateOnlyInside } from "../services/lessonPlanDates";
import {
  activeTimetableDates,
  useTimetableConfigForScope,
} from "./TimetableSlotSelect";
import { adjacentReorderCommands } from "./lessonPlanBoardActions";
import {
  deriveIssueWeekIndexes,
  filterLessonPlanWeeks,
  getDateOnlyToday,
  type WeekBoardFilter,
} from "./lessonPlansPresentation";

interface LessonPlansBoardProps {
  academicYearId: string;
  termId: string;
  termStartDate?: string;
  termEndDate?: string;
  teacherSubjectAllocationId: string;
  curriculumId: string;
  subjectId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  teacherId: string;
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  weeks: WeekInfo[];
  summary: LessonPlanSummary | null;
  summaryLoading: boolean;
  summaryError: Error | null;
  validation: LessonPlanValidationResponseDto | null;
  isReadOnly: boolean;
  librarySearchQuery: string;
  librarySelectedUnitId: string;
  onLibrarySearchQueryChange: (value: string) => void;
  onLibrarySelectedUnitIdChange: (value: string) => void;
  onRefreshPlanDetail: (planId: string, options?: { silent?: boolean }) => Promise<LessonPlan>;
  onRefreshSummaryAndValidation: (options?: { silent?: boolean }) => Promise<void>;
  onUpsertPlan: (plan: LessonPlan) => void;
  onRemovePlan: (planId: string) => void;
  onUpsertPlanItem: (planId: string, item: LessonPlanItem) => void;
  onRemovePlanItem: (planId: string, itemId: string) => void;
  onSelectLessonFromLibrary?: (lesson: Lesson) => void;
  onAddLessonMobile?: (weekIndex: number) => void;
  validationMessages: {
    noInstructionalDays: string;
    weekOutsideTerm: string;
    plannedDateOutsideTerm: string;
  };
}

export default function LessonPlansBoard({
  termId,
  termStartDate,
  termEndDate,
  academicYearId,
  subjectId,
  teacherSubjectAllocationId,
  curriculumId,
  gradeId,
  sectionId,
  classroomId,
  teacherId,
  lessons,
  units,
  plans,
  weeks,
  summary,
  summaryLoading,
  summaryError,
  validation,
  isReadOnly,
  librarySearchQuery,
  librarySelectedUnitId,
  onLibrarySearchQueryChange,
  onLibrarySelectedUnitIdChange,
  onRefreshPlanDetail,
  onRefreshSummaryAndValidation,
  onUpsertPlan,
  onRemovePlan,
  onUpsertPlanItem,
  onRemovePlanItem,
  onSelectLessonFromLibrary,
  onAddLessonMobile,
  validationMessages,
}: LessonPlansBoardProps) {
  const t = useTranslations("academics.lessonPlans");
  const { showError, showSuccess } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Local loading state for operations
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingPlanIds, setPendingPlanIds] = useState<Set<string>>(
    () => new Set(),
  );
  const reorderInFlightPlanIds = useRef(new Set<string>());
  const [weekFilter, setWeekFilter] = useState<WeekBoardFilter>("ALL");
  const timetableScope = useMemo(
    () => ({
      academicYearId,
      termId,
      gradeId,
      sectionId,
      classroomId,
      teacherUserId: teacherId,
      subjectId,
      teacherSubjectAllocationId,
    }),
    [
      academicYearId,
      classroomId,
      gradeId,
      sectionId,
      subjectId,
      teacherId,
      teacherSubjectAllocationId,
      termId,
    ],
  );
  const {
    config: timetableConfig,
    error: timetableConfigError,
    isMissing: isTimetableConfigMissing,
  } = useTimetableConfigForScope(
    timetableScope,
    Boolean(classroomId && termId && academicYearId),
  );

  // Dialog states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "remove" | null;
    itemId?: string;
  }>({ isOpen: false, type: null });
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [planConfirmation, setPlanConfirmation] = useState<{
    plan: LessonPlan;
    action: "archive" | "delete";
  } | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{
    itemId: string;
    action: "skip" | "cancel";
  } | null>(null);
  const [moveDialog, setMoveDialog] = useState<{
    itemId: string;
    targetWeek: WeekInfo;
    sortOrder: number;
  } | null>(null);

  // Drag state
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    itemId: string;
    fromWeekIndex: number;
  } | null>(null);

  const markItemPending = useCallback((itemId: string, pending: boolean) => {
    setPendingItemIds((current) => {
      const next = new Set(current);
      if (pending) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }, []);

  const markPlanPending = useCallback((planId: string, pending: boolean) => {
    setPendingPlanIds((current) => {
      const next = new Set(current);
      if (pending) next.add(planId);
      else next.delete(planId);
      return next;
    });
  }, []);

  // Handle drag from library
  const handleDragStartLesson = useCallback(
    (lesson: Lesson) => {
      if (isReadOnly) return;
      setDraggedLesson(lesson);
    },
    [isReadOnly],
  );

  const handleDragEndLesson = useCallback(() => {
    setDraggedLesson(null);
  }, []);

  // Handle drag from week
  const handleDragStartItem = useCallback(
    (itemId: string, weekIndex: number) => {
      if (isReadOnly) return;
      setDraggedItem({ itemId, fromWeekIndex: weekIndex });
    },
    [isReadOnly],
  );

  const handleDragEndItem = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // Handle drop on week
  const handleDropOnWeek = useCallback(
    async (weekIndex: number) => {
      if (isReadOnly || isUpdating) return;
      if (timetableConfigError) {
        showError(t("timetableSlotOptions.loadError"));
        return;
      }
      if (isTimetableConfigMissing) {
        showError(t("timetableSlotOptions.noConfig"));
        return;
      }
      if (draggedLesson && onAddLessonMobile && onSelectLessonFromLibrary) {
        onAddLessonMobile(weekIndex);
        onSelectLessonFromLibrary(draggedLesson);
        setDraggedLesson(null);
        return;
      }
      setIsUpdating(true);
      try {
        if (draggedLesson) {
          // Adding new lesson from library
          const week = weeks.find(
            (candidate) => candidate.weekIndex === weekIndex,
          );
          if (!week) return;
          const activeDays = activeTimetableDates(
            week.instructionalDays.filter(
              (date) =>
                date >= week.startDate &&
                date <= week.endDate &&
                (!termStartDate || date >= termStartDate) &&
                (!termEndDate || date <= termEndDate),
            ),
            timetableConfig,
          );
          const plannedDate = activeDays[0];
          if (!plannedDate) {
            showError(validationMessages.noInstructionalDays);
            return;
          }
          if (
            week.startDate > week.endDate ||
            !isDateOnlyInside(week.startDate, termStartDate, termEndDate) ||
            !isDateOnlyInside(week.endDate, termStartDate, termEndDate)
          ) {
            showError(validationMessages.weekOutsideTerm);
            return;
          }
          if (!isDateOnlyInside(plannedDate, termStartDate, termEndDate)) {
            showError(validationMessages.plannedDateOutsideTerm);
            return;
          }
          let plan = plans.find(
            (candidate) =>
              candidate.weekIndex === weekIndex &&
              candidate.status !== "ARCHIVED",
          );
          if (!plan)
            plan = await createLessonPlan({
              academicYearId,
              termId,
              teacherSubjectAllocationId,
              teacherUserId: teacherId || undefined,
              classroomId: classroomId || undefined,
              subjectId,
              curriculumId,
              title: `${draggedLesson.title} — ${week.startDate}`,
              weekStartDate: week.startDate,
              weekEndDate: week.endDate,
            });
          await createLessonPlanItem({
            lessonPlanId: plan.id,
            payload: {
              unitId: draggedLesson.unitId,
              lessonId: draggedLesson.id,
              plannedDate,
              sortOrder: plan.items.length,
            },
          });
          setDraggedLesson(null); // Clear drag state immediately
          await onRefreshPlanDetail(plan.id, { silent: true });
          void onRefreshSummaryAndValidation({ silent: true });
          showSuccess("Saved successfully");
        } else if (draggedItem) {
          // Moving existing item
          if (draggedItem.fromWeekIndex !== weekIndex) {
            const targetWeek = weeks.find(
              (week) => week.weekIndex === weekIndex,
            );
            if (!targetWeek) {
              showError("Target week not found.");
              return;
            }

            if (targetWeek.instructionalDays.length === 0) {
              showError(validationMessages.noInstructionalDays);
              return;
            }

            const targetPlan = plans.find(
              (plan) =>
                plan.weekIndex === weekIndex && plan.status !== "ARCHIVED",
            );

            setMoveDialog({
              itemId: draggedItem.itemId,
              targetWeek,
              sortOrder: targetPlan?.items.length ?? 0,
            });
            setDraggedItem(null);
          } else {
            setDraggedItem(null); // Clear drag state even if not moved
          }
        }
      } catch (error) {
        showError(lessonPlansUiError(error));
        // Clear drag state on error too
        setDraggedLesson(null);
        setDraggedItem(null);
      } finally {
        setIsUpdating(false);
      }
    },
    [
      isReadOnly,
      isUpdating,
      draggedLesson,
      draggedItem,
      termId,
      termStartDate,
      termEndDate,
      timetableConfig,
      timetableConfigError,
      isTimetableConfigMissing,
      academicYearId,
      subjectId,
      classroomId,
      teacherId,
      teacherSubjectAllocationId,
      curriculumId,
      plans,
      weeks,
      validationMessages,
      showSuccess,
      showError,
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
      onAddLessonMobile,
      onSelectLessonFromLibrary,
      t,
    ],
  );

  const confirmMove = useCallback(
    async (payload: Parameters<typeof moveLessonPlanItem>[1]) => {
      if (!moveDialog) return;
      setIsUpdating(true);
      markItemPending(moveDialog.itemId, true);
      try {
        const movedItem = await moveLessonPlanItem(moveDialog.itemId, payload);
        const sourcePlan = plans.find((candidate) =>
          candidate.items.some((item) => item.id === moveDialog.itemId),
        );
        const planIds = new Set(
          [sourcePlan?.id, movedItem.planId].filter(Boolean) as string[],
        );
        await Promise.all(
          Array.from(planIds).map((planId) =>
            onRefreshPlanDetail(planId, { silent: true }),
          ),
        );
        void onRefreshSummaryAndValidation({ silent: true });
        setMoveDialog(null);
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
        markItemPending(moveDialog.itemId, false);
      }
    },
    [
      markItemPending,
      moveDialog,
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
      plans,
      showError,
      showSuccess,
    ],
  );

  // Handle status change
  const handleStatusChange = useCallback(
    async (
      itemId: string,
      status: "IN_PROGRESS" | "DONE" | "SKIPPED" | "CANCELLED",
    ) => {
      if (isReadOnly || pendingItemIds.has(itemId)) return;
      if (status === "SKIPPED" || status === "CANCELLED") {
        setReasonDialog({
          itemId,
          action: status === "SKIPPED" ? "skip" : "cancel",
        });
        return;
      }

      setIsUpdating(true);
      markItemPending(itemId, true);
      try {
        const plan = plans.find((candidate) =>
          candidate.items.some((item) => item.id === itemId),
        );
        if (!plan) throw new Error("Lesson plan item was not found");
        const command = { lessonPlanId: plan.id, itemId };
        let updatedItem: LessonPlanItem | null = null;
        if (status === "IN_PROGRESS")
          updatedItem = await startLessonPlanItem(command);
        if (status === "DONE")
          updatedItem = await completeLessonPlanItem(command);
        if (updatedItem) onUpsertPlanItem(plan.id, updatedItem);
        else await onRefreshPlanDetail(plan.id, { silent: true });
        void onRefreshSummaryAndValidation({ silent: true });
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
        markItemPending(itemId, false);
      }
    },
    [
      isReadOnly,
      markItemPending,
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
      onUpsertPlanItem,
      pendingItemIds,
      plans,
      showError,
      showSuccess,
    ],
  );

  const handleReasonConfirm = useCallback(
    async (note: string) => {
      if (!reasonDialog || isUpdating) return;
      const plan = plans.find((candidate) =>
        candidate.items.some((item) => item.id === reasonDialog.itemId),
      );
      if (!plan) return;
      setIsUpdating(true);
      markItemPending(reasonDialog.itemId, true);
      try {
        const command = {
          lessonPlanId: plan.id,
          itemId: reasonDialog.itemId,
          payload: { note: note || null },
        };
        const updatedItem =
          reasonDialog.action === "skip"
            ? await skipLessonPlanItem(command)
            : await cancelLessonPlanItem(command);
        onUpsertPlanItem(plan.id, updatedItem);
        setReasonDialog(null);
        void onRefreshSummaryAndValidation({ silent: true });
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
        markItemPending(reasonDialog.itemId, false);
      }
    },
    [
      isUpdating,
      markItemPending,
      onRefreshSummaryAndValidation,
      onUpsertPlanItem,
      plans,
      reasonDialog,
      showError,
      showSuccess,
    ],
  );

  const handleReorder = useCallback(
    async (itemId: string, direction: "up" | "down") => {
      if (isReadOnly || pendingItemIds.has(itemId)) return;
      const plan = plans.find((candidate) =>
        candidate.items.some((item) => item.id === itemId),
      );
      if (!plan || reorderInFlightPlanIds.current.has(plan.id)) return;
      const commands = adjacentReorderCommands(plan, itemId, direction);
      if (commands.length !== 2) return;
      const affectedIds = commands.map((command) => command.itemId);
      if (affectedIds.some((affectedId) => pendingItemIds.has(affectedId))) {
        return;
      }
      reorderInFlightPlanIds.current.add(plan.id);
      affectedIds.forEach((affectedId) =>
        markItemPending(affectedId, true),
      );
      setIsUpdating(true);
      try {
        const results = await Promise.allSettled(
          commands.map((command) => reorderLessonPlanItem(command)),
        );

        let refreshError: unknown;
        try {
          await onRefreshPlanDetail(plan.id, { silent: true });
        } catch (error) {
          refreshError = error;
        }

        const mutationFailure = results.find(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );
        if (mutationFailure) throw mutationFailure.reason;
        if (refreshError) throw refreshError;

        await onRefreshSummaryAndValidation({ silent: true });
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        reorderInFlightPlanIds.current.delete(plan.id);
        setIsUpdating(false);
        affectedIds.forEach((affectedId) =>
          markItemPending(affectedId, false),
        );
      }
    },
    [
      isReadOnly,
      markItemPending,
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
      pendingItemIds,
      plans,
      showError,
      showSuccess,
    ],
  );

  const saveEditedItem = useCallback(
    async (payload: UpdateLessonPlanItemRequest) => {
      if (isUpdating || !editingItemId) return;
      setIsUpdating(true);
      markItemPending(editingItemId, true);
      try {
        const plan = plans.find((candidate) =>
          candidate.items.some((item) => item.id === editingItemId),
        );
        if (!plan) throw new Error("Lesson plan item was not found");
        const updatedItem = await updateLessonPlanItem({
          lessonPlanId: plan.id,
          itemId: editingItemId,
          payload,
        });
        onUpsertPlanItem(plan.id, updatedItem);
        void onRefreshSummaryAndValidation({ silent: true });
        setEditingItemId(null);
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
        markItemPending(editingItemId, false);
      }
    },
    [
      isUpdating,
      plans,
      editingItemId,
      markItemPending,
      onRefreshSummaryAndValidation,
      onUpsertPlanItem,
      showSuccess,
      showError,
    ],
  );

  // Handle remove
  const handleRemove = useCallback((itemId: string) => {
    setConfirmDialog({ isOpen: true, type: "remove", itemId });
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (!confirmDialog.itemId || isUpdating) return;

    setIsUpdating(true);
    markItemPending(confirmDialog.itemId, true);
    try {
      const plan = plans.find((candidate) =>
        candidate.items.some((item) => item.id === confirmDialog.itemId),
      );
      if (!plan) throw new Error("Lesson plan item was not found");
      await deleteLessonPlanItem({
        lessonPlanId: plan.id,
        itemId: confirmDialog.itemId,
      });
      onRemovePlanItem(plan.id, confirmDialog.itemId);
      setConfirmDialog({ isOpen: false, type: null });
      void onRefreshSummaryAndValidation({ silent: true });
      showSuccess("Saved successfully");
    } catch (error) {
      showError(lessonPlansUiError(error));
    } finally {
      setIsUpdating(false);
      markItemPending(confirmDialog.itemId, false);
    }
  }, [
    isUpdating,
    plans,
    confirmDialog.itemId,
    markItemPending,
    onRefreshSummaryAndValidation,
    onRemovePlanItem,
    showSuccess,
    showError,
  ]);

  const refreshAfterPlanMutation = useCallback(
    async (planId: string, mutation: () => Promise<unknown>) => {
      if (isReadOnly || pendingPlanIds.has(planId)) return;
      setIsUpdating(true);
      markPlanPending(planId, true);
      try {
        const result = await mutation();
        if (result) onUpsertPlan(result as LessonPlan);
        else if (result === undefined)
          await onRefreshPlanDetail(planId, { silent: true });
        void onRefreshSummaryAndValidation({ silent: true });
        showSuccess("Saved successfully");
      } catch (error) {
        showError(lessonPlansUiError(error));
      } finally {
        setIsUpdating(false);
        markPlanPending(planId, false);
      }
    },
    [
      isReadOnly,
      markPlanPending,
      onRefreshPlanDetail,
      onRefreshSummaryAndValidation,
      onUpsertPlan,
      pendingPlanIds,
      showError,
      showSuccess,
    ],
  );
  const handleSavePlan = useCallback(
    (payload: UpdateLessonPlanRequest) => {
      if (!editingPlan) return;
      void refreshAfterPlanMutation(editingPlan.id, async () => {
        const updatedPlan = await updateLessonPlan(editingPlan.id, payload);
        setEditingPlan(null);
        return updatedPlan;
      });
    },
    [editingPlan, refreshAfterPlanMutation],
  );
  const handleActivatePlan = useCallback(
    (plan: LessonPlan) =>
      void refreshAfterPlanMutation(plan.id, () => activateLessonPlan(plan.id)),
    [refreshAfterPlanMutation],
  );
  const handleConfirmPlanAction = useCallback(() => {
    if (!planConfirmation) return;
    const { plan, action } = planConfirmation;
    void refreshAfterPlanMutation(plan.id, async () => {
      if (action === "archive") {
        const archivedPlan = await archiveLessonPlan(plan.id);
        setPlanConfirmation(null);
        return archivedPlan;
      }
      await deleteLessonPlan(plan.id);
      onRemovePlan(plan.id);
      setPlanConfirmation(null);
      return null;
    });
  }, [onRemovePlan, planConfirmation, refreshAfterPlanMutation]);

  // Calculate a hash of planned lesson IDs for key generation
  const plannedLessonsHash = useMemo(() => {
    const allLessonIds: string[] = [];
    plans.forEach((plan) => {
      plan.items.forEach((item) => {
        allLessonIds.push(item.lessonId);
      });
    });
    // Sort to ensure consistent hash
    return allLessonIds.sort().join(",");
  }, [plans]);

  const issueWeekIndexes = useMemo(
    () =>
      deriveIssueWeekIndexes({
        plans,
        issues: validation?.issues ?? [],
      }),
    [plans, validation?.issues],
  );
  const today = useMemo(() => getDateOnlyToday(), []);
  const visibleWeeks = useMemo(
    () =>
      filterLessonPlanWeeks({
        weeks,
        plans,
        issueWeekIndexes,
        filter: weekFilter,
        today,
      }),
    [issueWeekIndexes, plans, today, weekFilter, weeks],
  );
  const weekFilterOptions: Array<{ value: WeekBoardFilter; label: string }> = [
    { value: "ALL", label: t("boardFilters.all") },
    {
      value: "CURRENT_UPCOMING",
      label: t("boardFilters.currentUpcoming"),
    },
    { value: "PLANNED", label: t("boardFilters.planned") },
    { value: "ISSUES", label: t("boardFilters.issues") },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      {(summary || summaryLoading || summaryError) && (
        <ProgressSummary 
          summary={summary} 
          isLoading={summaryLoading} 
          error={summaryError} 
          onRetry={() => void onRefreshSummaryAndValidation()} 
        />
      )}

      {/* Main Board */}
      <div className={isMobile ? "space-y-4" : "flex gap-6"}>
        {/* Lesson Library - Desktop Only */}
        {!isMobile && (
          <div className="w-80 shrink-0 self-start sticky top-[calc(var(--header-height)_+_1rem)] z-10">
            <LessonLibrary
              key={plannedLessonsHash}
              lessons={lessons}
              units={units}
              plans={plans}
              searchQuery={librarySearchQuery}
              selectedUnitId={librarySelectedUnitId}
              onSearchQueryChange={onLibrarySearchQueryChange}
              onSelectedUnitIdChange={onLibrarySelectedUnitIdChange}
              onDragStart={handleDragStartLesson}
              onDragEnd={handleDragEndLesson}
              onSelectLesson={onSelectLessonFromLibrary}
              isReadOnly={isReadOnly}
            />
          </div>
        )}

        {/* Weeks Grid/List */}
        <div className="flex-1">
          <p className="mb-3 text-sm text-gray-600">
            {t("week.totalWeeks", { count: weeks.length })}
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {weekFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={weekFilter === option.value ? "primary" : "secondary"}
                size="sm"
                type="button"
                aria-pressed={weekFilter === option.value}
                onClick={() => setWeekFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {weeks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("emptyState.noPlan.message")}</p>
            </div>
          ) : visibleWeeks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-gray-900">
                {t("week.noMatchingWeeks")}
              </p>
            </div>
          ) : isMobile ? (
            <WeeksBoardMobile
              key={plannedLessonsHash}
              weeks={visibleWeeks}
              plans={plans}
              lessons={lessons}
              issueWeekIndexes={issueWeekIndexes}
              today={today}
              isReadOnly={isReadOnly}
              onStatusChange={handleStatusChange}
              onEditPlan={setEditingPlan}
              onActivatePlan={handleActivatePlan}
              onArchivePlan={(plan) =>
                setPlanConfirmation({ plan, action: "archive" })
              }
              onDeletePlan={(plan) =>
                setPlanConfirmation({ plan, action: "delete" })
              }
              onReorder={handleReorder}
              onEditItem={setEditingItemId}
              onRemove={handleRemove}
              onAddLesson={onAddLessonMobile || (() => {})}
              pendingItemIds={pendingItemIds}
              pendingPlanIds={pendingPlanIds}
            />
          ) : (
            <WeeksBoardDesktop
              weeks={visibleWeeks}
              plans={plans}
              lessons={lessons}
              issueWeekIndexes={issueWeekIndexes}
              today={today}
              draggedLesson={draggedLesson}
              draggedItem={draggedItem}
              isReadOnly={isReadOnly}
              onDropOnWeek={handleDropOnWeek}
              onDragStartItem={handleDragStartItem}
              onDragEndItem={handleDragEndItem}
              onStatusChange={handleStatusChange}
              onEditPlan={setEditingPlan}
              onActivatePlan={handleActivatePlan}
              onArchivePlan={(plan) =>
                setPlanConfirmation({ plan, action: "archive" })
              }
              onDeletePlan={(plan) =>
                setPlanConfirmation({ plan, action: "delete" })
              }
              onReorder={handleReorder}
              onEditItem={setEditingItemId}
              onRemove={handleRemove}
              pendingItemIds={pendingItemIds}
              pendingPlanIds={pendingPlanIds}
            />
          )}
        </div>
      </div>

      {editingItemId && (() => {
        const plan = plans.find((candidate) =>
          candidate.items.some((item) => item.id === editingItemId),
        );
        const item = plan?.items.find((candidate) => candidate.id === editingItemId);
        const week = weeks.find((candidate) => candidate.weekIndex === plan?.weekIndex);
        return plan && item && week ? (
          <EditLessonPlanItemDialog
            item={item}
            week={week}
            termStartDate={termStartDate}
            termEndDate={termEndDate}
            academicYearId={academicYearId}
            termId={termId}
            gradeId={gradeId}
            sectionId={sectionId}
            classroomId={classroomId}
            teacherUserId={teacherId}
            subjectId={subjectId}
            teacherSubjectAllocationId={teacherSubjectAllocationId}
            onClose={() => setEditingItemId(null)}
            onSave={saveEditedItem}
            loading={isUpdating}
          />
        ) : null;
      })()}

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null })}
        onConfirm={handleConfirmRemove}
        title={t("confirmRemove.title")}
        description={t("confirmRemove.message")}
        confirmLabel={t("confirmRemove.confirm")}
        cancelLabel={t("confirmRemove.cancel")}
        severity="danger"
      />
      {editingPlan && (
        <EditLessonPlanDialog
          key={editingPlan.id}
          plan={editingPlan}
          termStartDate={termStartDate}
          termEndDate={termEndDate}
          onClose={() => setEditingPlan(null)}
          onSave={handleSavePlan}
          loading={isUpdating}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(planConfirmation)}
        onClose={() => setPlanConfirmation(null)}
        onConfirm={handleConfirmPlanAction}
        title={
          planConfirmation?.action === "delete"
            ? t("planConfirm.deleteTitle")
            : t("planConfirm.archiveTitle")
        }
        description={t("planConfirm.description")}
        confirmLabel={
          planConfirmation?.action === "delete"
            ? t("planConfirm.deleteConfirm")
            : t("planConfirm.archiveConfirm")
        }
        cancelLabel={t("planConfirm.cancel")}
        loading={isUpdating}
        severity={planConfirmation?.action === "delete" ? "danger" : "warning"}
      />
      <SkipCancelReasonDialog
        key={reasonDialog?.itemId ?? "reason-dialog"}
        action={reasonDialog?.action ?? null}
        onClose={() => setReasonDialog(null)}
        onConfirm={handleReasonConfirm}
        loading={isUpdating}
      />
      {moveDialog && (
        <MoveLessonDialog
          isOpen
          targetWeek={moveDialog.targetWeek}
          termStartDate={termStartDate}
          termEndDate={termEndDate}
          academicYearId={academicYearId}
          termId={termId}
          gradeId={gradeId}
          sectionId={sectionId}
          classroomId={classroomId}
          teacherUserId={teacherId}
          subjectId={subjectId}
          teacherSubjectAllocationId={teacherSubjectAllocationId}
          sortOrder={moveDialog.sortOrder}
          loading={isUpdating}
          onClose={() => setMoveDialog(null)}
          onConfirm={confirmMove}
        />
      )}
    </div>
  );
}

