"use client";

import { useCallback, useState } from "react";
import type { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import {
  createLessonPlan,
  createLessonPlanItem,
  autoPlanLessons,
  type AutoPlanLessonPlanRequest,
  type LessonPlan,
  type LessonPlanItem,
  type WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import { lessonPlansUiError } from "@/features/academics/lesson-plans/services/lessonPlansErrors";
import { isDateOnlyInside } from "@/features/academics/lesson-plans/services/lessonPlanDates";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import { dayOfWeekFromDateOnly } from "../components/TimetableSlotSelect";

interface Params {
  academicYearId: string;
  termId: string;
  termStartDate?: string;
  termEndDate?: string;
  selectedSubjectId: string;
  selectedClassroomId: string;
  assignedTeacherId: string;
  teacherSubjectAllocationId: string;
  curriculumId: string;
  classroomRequired: boolean;
  lessons: Lesson[];
  plans: LessonPlan[];
  weeks: WeekInfo[];
  refreshPlans: (options?: { silent?: boolean }) => Promise<void>;
  refreshPlanDetail: (planId: string, options?: { silent?: boolean }) => Promise<LessonPlan>;
  refreshSummaryAndValidation: (options?: { silent?: boolean }) => Promise<void>;
  upsertPlanItem: (planId: string, item: LessonPlanItem) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  onLessonSelected?: () => void;
  validationMessages: {
    missingWeek: string;
    noInstructionalDays: string;
    weekOutsideTerm: string;
    plannedDateOutsideTerm: string;
  };
}

export function useLessonPlanMutations(params: Params) {
  const [addLessonDialog, setAddLessonDialog] = useState<{
    isOpen: boolean;
    lesson: Lesson | null;
    preselectedWeekIndex?: number;
  }>({ isOpen: false, lesson: null });
  const handleSelectLessonFromLibrary = useCallback(
    (lesson: Lesson) => {
      setAddLessonDialog((current) => ({
        isOpen: true,
        lesson,
        preselectedWeekIndex: current.preselectedWeekIndex,
      }));
      params.onLessonSelected?.();
    },
    [params],
  );
  const handleAddLessonFromWeek = useCallback(
    (weekIndex: number) =>
      setAddLessonDialog((current) => ({
        ...current,
        preselectedWeekIndex: weekIndex,
      })),
    [],
  );
  const closeAddLessonDialog = useCallback(
    () => setAddLessonDialog({ isOpen: false, lesson: null }),
    [],
  );
  const handleConfirmAddLesson = useCallback(
    async (
      lessonId: string,
      weekIndex: number,
      selectedPlannedDate: string,
      timetableEntry: BackendTimetableEntryDto | null = null,
    ) => {
      const lesson = params.lessons.find(
        (candidate) => candidate.id === lessonId,
      );
      const week = params.weeks.find(
        (candidate) => candidate.weekIndex === weekIndex,
      );
      if (
        !lesson ||
        !week ||
        !params.teacherSubjectAllocationId ||
        !params.curriculumId ||
        (params.classroomRequired && !params.selectedClassroomId)
      ) {
        params.showError(params.validationMessages.missingWeek);
        return;
      }
      if (week.instructionalDays.length === 0) {
        params.showError(params.validationMessages.noInstructionalDays);
        return;
      }
      const plannedDate = selectedPlannedDate;
      if (
        week.startDate > week.endDate ||
        !isDateOnlyInside(
          week.startDate,
          params.termStartDate,
          params.termEndDate,
        ) ||
        !isDateOnlyInside(
          week.endDate,
          params.termStartDate,
          params.termEndDate,
        )
      ) {
        params.showError(params.validationMessages.weekOutsideTerm);
        return;
      }
      if (
        !plannedDate ||
        !week.instructionalDays.includes(plannedDate) ||
        plannedDate < week.startDate ||
        plannedDate > week.endDate ||
        !isDateOnlyInside(plannedDate, params.termStartDate, params.termEndDate)
      ) {
        params.showError(params.validationMessages.plannedDateOutsideTerm);
        return;
      }
      try {
        let plan = params.plans.find(
          (candidate) =>
            candidate.weekIndex === weekIndex &&
            candidate.status !== "ARCHIVED",
        );
        if (!plan)
          plan = await createLessonPlan({
            academicYearId: params.academicYearId,
            termId: params.termId,
            teacherSubjectAllocationId: params.teacherSubjectAllocationId,
            teacherUserId: params.assignedTeacherId || undefined,
            classroomId: params.selectedClassroomId || undefined,
            subjectId: params.selectedSubjectId || undefined,
            curriculumId: params.curriculumId,
            title: `${lesson.title} — ${week.startDate}`,
            weekStartDate: week.startDate,
            weekEndDate: week.endDate,
          });
        const createdItem = await createLessonPlanItem({
          lessonPlanId: plan.id,
          payload: {
            unitId: lesson.unitId,
            lessonId: lesson.id,
            plannedDate,
            dayOfWeek:
              timetableEntry?.dayOfWeek ?? dayOfWeekFromDateOnly(plannedDate),
            ...(timetableEntry
              ? {
                  timetableEntryId: timetableEntry.id,
                  periodId: timetableEntry.periodId,
                  periodLabel: timetableEntry.period.label,
                }
              : {}),
            sortOrder: plan.items.length,
          },
        });
        if (params.plans.some((candidate) => candidate.id === plan.id)) {
          params.upsertPlanItem(plan.id, createdItem);
        } else {
          await params.refreshPlanDetail(plan.id, { silent: true });
        }
        void params.refreshSummaryAndValidation({ silent: true });
        params.showSuccess("Saved successfully");
        setAddLessonDialog({ isOpen: false, lesson: null });
      } catch (error) {
        params.showError(lessonPlansUiError(error));
      }
    },
    [params],
  );
  const previewAutoPlan = useCallback(
    (
      payload: Omit<
        AutoPlanLessonPlanRequest,
        "termId" | "teacherSubjectAllocationId" | "dryRun"
      >,
    ) =>
      autoPlanLessons({
        ...payload,
        termId: params.termId,
        teacherSubjectAllocationId: params.teacherSubjectAllocationId,
        dryRun: true,
      }),
    [params.teacherSubjectAllocationId, params.termId],
  );
  const applyAutoPlan = useCallback(
    async (
      payload: Omit<
        AutoPlanLessonPlanRequest,
        "termId" | "teacherSubjectAllocationId" | "dryRun"
      >,
    ) => {
      const response = await autoPlanLessons({
        ...payload,
        termId: params.termId,
        teacherSubjectAllocationId: params.teacherSubjectAllocationId,
        dryRun: false,
      });
      await params.refreshPlans({ silent: true });
      return response;
    },
    [params],
  );
  return {
    addLessonDialog,
    handleSelectLessonFromLibrary,
    handleAddLessonFromWeek,
    handleConfirmAddLesson,
    closeAddLessonDialog,
    previewAutoPlan,
    applyAutoPlan,
  };
}
