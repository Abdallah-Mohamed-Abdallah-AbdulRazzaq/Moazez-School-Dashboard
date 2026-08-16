"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Classroom,
  fetchStructureTree,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchCurriculumForScope,
  type Lesson,
  type Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  getLessonPlan,
  getLessonPlanSummary,
  getLessonPlanValidation,
  listLessonPlans,
  listLessonPlanWeeks,
  type LessonPlan,
  type LessonPlanSummary,
  type LessonPlanValidationResponseDto,
  type WeekInfo,
} from "@/features/academics/lesson-plans/services/lessonPlansService";
import type { LessonPlanSummaryQuery } from "@/features/academics/lesson-plans/services/lessonPlansBackendTypes";
import {
  fetchSubjectAllocations,
  fetchSubjects,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
  type Teacher,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";

export type LessonPlansScopeStatus =
  | "loading-options"
  | "missing-academic-year"
  | "missing-term"
  | "missing-grade"
  | "missing-section"
  | "missing-classroom"
  | "missing-subject"
  | "missing-curriculum"
  | "missing-teacher-allocation"
  | "ready";

interface Params {
  academicYearId: string;
  termId: string;
  isInitializing: boolean;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  onLoadError: () => void;
}

export interface RefreshLessonPlansOptions {
  silent?: boolean;
}

export function useLessonPlansData(params: Params) {
  const {
    academicYearId,
    termId,
    isInitializing,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    onLoadError,
  } = params;
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<
    SubjectAllocation[]
  >([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [summary, setSummary] = useState<LessonPlanSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<Error | null>(null);
  const [validation, setValidation] = useState<LessonPlanValidationResponseDto | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<Error | null>(null);
  const [assignedTeacherId, setAssignedTeacherId] = useState("");
  const [teacherSubjectAllocationId, setTeacherSubjectAllocationId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [resolvedClassroomId, setResolvedClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);
  const [scopeStatus, setScopeStatus] = useState<LessonPlansScopeStatus>("loading-options");
  const requestId = useRef(0);
  const summaryRequestId = useRef(0);
  const validationRequestId = useRef(0);

  useEffect(() => {
    void (async () => {
      if (!termId || !academicYearId) {
        setStages([]);
        setGrades([]);
        setLoading(isInitializing);
        return;
      }
      try {
        setLoading(true);
        const [tree, subjectList, subjectAllocationList, teacherList] =
          await Promise.all([
            fetchStructureTree(academicYearId, termId),
            fetchSubjects(),
            fetchSubjectAllocations(termId),
            fetchTeachers(),
          ]);
        setStages(tree.stages);
        setGrades(tree.grades);
        setSections(tree.sections);
        setClassrooms(tree.classrooms);
        setSubjects(subjectList);
        setSubjectAllocations(subjectAllocationList);
        setTeachers(teacherList);
      } catch (error) {
        console.error("Failed to load lesson plans context data:", error);
        onLoadError();
      } finally {
        setLoading(false);
      }
    })();
  }, [academicYearId, isInitializing, onLoadError, termId]);

  const scopedLessonPlansQuery = useCallback(() => {
    if (!termId || !teacherSubjectAllocationId) return null;
    return {
      termId,
      teacherSubjectAllocationId,
      gradeId: selectedGradeId,
      subjectId: selectedSubjectId,
      classroomId: resolvedClassroomId || undefined,
    };
  }, [
    resolvedClassroomId,
    selectedGradeId,
    selectedSubjectId,
    teacherSubjectAllocationId,
    termId,
  ]);

  const withWeekIndex = useCallback(
    (plan: LessonPlan) => ({
      ...plan,
      weekIndex:
        weeks.find(
          (week) =>
            plan.weekStartDate >= week.startDate &&
            plan.weekStartDate <= week.endDate,
        )?.weekIndex ?? plan.weekIndex,
    }),
    [weeks],
  );

  const refreshPlanDetail = useCallback(
    async (planId: string, options: RefreshLessonPlansOptions = {}) => {
      void options.silent;
      const plan = withWeekIndex(await getLessonPlan(planId));
      setPlans((current) => {
        const existingIndex = current.findIndex(
          (candidate) => candidate.id === plan.id,
        );
        if (existingIndex === -1) return [...current, plan];
        return current.map((candidate) =>
          candidate.id === plan.id ? plan : candidate,
        );
      });
      return plan;
    },
    [withWeekIndex],
  );

  const refreshSummaryForQuery = useCallback(
    async (
      query: LessonPlanSummaryQuery,
      options: RefreshLessonPlansOptions = {},
    ) => {
      const currentRequest = ++summaryRequestId.current;
      if (!options.silent) {
        setSummaryLoading(true);
        setSummaryError(null);
      }
      try {
        const planSummary = await getLessonPlanSummary(query);
        if (currentRequest === summaryRequestId.current) {
          setSummary(planSummary);
        }
      } catch (error) {
        if (currentRequest === summaryRequestId.current) {
          console.warn("Failed to refresh lesson plan summary:", error);
          setSummaryError(error instanceof Error ? error : new Error("Failed to load summary"));
        }
      } finally {
        if (currentRequest === summaryRequestId.current) {
          setSummaryLoading(false);
        }
      }
    },
    [],
  );

  const refreshValidationForQuery = useCallback(
    async (
      query: LessonPlanSummaryQuery,
      options: RefreshLessonPlansOptions = {},
    ) => {
      const currentRequest = ++validationRequestId.current;
      if (!options.silent) {
        setValidationLoading(true);
        setValidationError(null);
      }
      try {
        const planValidation = await getLessonPlanValidation(query);
        if (currentRequest === validationRequestId.current) {
          setValidation(planValidation);
        }
      } catch (error) {
        if (currentRequest === validationRequestId.current) {
          console.warn("Failed to refresh lesson plan validation:", error);
          setValidationError(error instanceof Error ? error : new Error("Failed to load validation"));
        }
      } finally {
        if (currentRequest === validationRequestId.current) {
          setValidationLoading(false);
        }
      }
    },
    [],
  );

  const refreshSummary = useCallback(
    async (
      options: RefreshLessonPlansOptions = {},
      explicitQuery?: LessonPlanSummaryQuery,
    ) => {
      const query = explicitQuery || scopedLessonPlansQuery();
      if (!query) return;
      await refreshSummaryForQuery(query, options);
    },
    [refreshSummaryForQuery, scopedLessonPlansQuery],
  );

  const refreshValidation = useCallback(
    async (
      options: RefreshLessonPlansOptions = {},
      explicitQuery?: LessonPlanSummaryQuery,
    ) => {
      const query = explicitQuery || scopedLessonPlansQuery();
      if (!query) return;
      await refreshValidationForQuery(query, options);
    },
    [refreshValidationForQuery, scopedLessonPlansQuery],
  );

  const refreshSummaryAndValidation = useCallback(
    async (
      options: RefreshLessonPlansOptions = {},
      explicitQuery?: LessonPlanSummaryQuery,
    ) => {
      void refreshSummary(options, explicitQuery);
      void refreshValidation(options, explicitQuery);
    },
    [refreshSummary, refreshValidation],
  );

  const refreshSummaryAndValidationForQuery = useCallback(
    (
      query: LessonPlanSummaryQuery,
      options: RefreshLessonPlansOptions = {},
    ) => {
      void refreshSummaryForQuery(query, options);
      void refreshValidationForQuery(query, options);
    },
    [refreshSummaryForQuery, refreshValidationForQuery],
  );

  const refreshWeeks = useCallback(
    async (options: RefreshLessonPlansOptions = {}) => {
      void options.silent;
      if (!termId || !teacherSubjectAllocationId) return;
      const weekList = await listLessonPlanWeeks({
        termId,
        teacherSubjectAllocationId,
      });
      setWeeks(weekList);
    },
    [teacherSubjectAllocationId, termId],
  );

  const upsertPlan = useCallback(
    (plan: LessonPlan) => {
      const nextPlan = withWeekIndex(plan);
      setPlans((current) => {
        const exists = current.some((candidate) => candidate.id === nextPlan.id);
        if (!exists) return [...current, nextPlan];
        return current.map((candidate) =>
          candidate.id === nextPlan.id ? nextPlan : candidate,
        );
      });
    },
    [withWeekIndex],
  );

  const removePlan = useCallback((planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId));
  }, []);

  const upsertPlanItem = useCallback((planId: string, item: LessonPlan["items"][number]) => {
    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== planId) return plan;
        const hasItem = plan.items.some((candidate) => candidate.id === item.id);
        return {
          ...plan,
          items: hasItem
            ? plan.items.map((candidate) =>
                candidate.id === item.id ? item : candidate,
              )
            : [...plan.items, item],
        };
      }),
    );
  }, []);

  const removePlanItem = useCallback((planId: string, itemId: string) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              items: plan.items.filter((item) => item.id !== itemId),
            }
          : plan,
      ),
    );
  }, []);

  const refreshAllLessonPlans = useCallback(async (options: RefreshLessonPlansOptions = {}) => {
    const silent = options.silent === true;
    const currentRequest = ++requestId.current;
    const clearScopedData = () => {
      ++summaryRequestId.current;
      ++validationRequestId.current;
      setPlans([]);
      setWeeks([]);
      setSummary(null);
      setSummaryLoading(false);
      setSummaryError(null);
      setValidation(null);
      setValidationLoading(false);
      setValidationError(null);
      setUnits([]);
      setLessons([]);
      setCurriculumId("");
      setTeacherSubjectAllocationId("");
      setAssignedTeacherId("");
      setResolvedClassroomId("");
      setPlansLoading(false);
      setIsRefreshing(false);
    };
    if (loading) {
      if (!silent) {
        clearScopedData();
        setScopeStatus("loading-options");
      }
      setDataChecked(false);
      return;
    }
    const missingStatus: LessonPlansScopeStatus | null = !academicYearId
      ? "missing-academic-year"
      : !termId
        ? "missing-term"
        : !selectedGradeId
          ? "missing-grade"
          : !selectedSectionId
            ? "missing-section"
            : !selectedSubjectId
              ? "missing-subject"
              : null;
    if (missingStatus) {
      if (!silent) {
        clearScopedData();
        setScopeStatus(missingStatus);
      }
      setDataChecked(true);
      return;
    }
    const sectionClassrooms = classrooms.filter(
      (classroom) => classroom.sectionId === selectedSectionId,
    );
    const classroomId = sectionClassrooms.some(
      (classroom) => classroom.id === selectedClassroomId,
    )
      ? selectedClassroomId
      : "";
    if (sectionClassrooms.length > 0 && !classroomId) {
      if (!silent) {
        clearScopedData();
        setScopeStatus("missing-classroom");
      }
      setDataChecked(true);
      return;
    }
    if (!silent) {
      clearScopedData();
      setPlansLoading(true);
      setDataChecked(false);
    } else {
      setIsRefreshing(true);
    }
    if (!silent) {
      setScopeStatus("loading-options");
    }
    try {
      const [curriculum, allocations] = await Promise.all([
        fetchCurriculumForScope({
          academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
        }),
        fetchTeacherAllocations(termId),
      ]);
      const allocation = allocations.find(
        (candidate) =>
          candidate.termId === termId &&
          candidate.sectionId === selectedSectionId &&
          candidate.subjectId === selectedSubjectId &&
          (classroomId
            ? candidate.classroomId === classroomId
            : !candidate.classroomId),
      );
      if (!curriculum || !allocation || currentRequest !== requestId.current) {
        if (!silent) {
          setPlans([]);
          setWeeks([]);
          setSummary(null);
          setValidation(null);
          setUnits(curriculum?.units ?? []);
          setLessons((curriculum?.units ?? []).flatMap((unit) => unit.lessons));
          setCurriculumId(curriculum?.id ?? "");
          setTeacherSubjectAllocationId(allocation?.id ?? "");
          setAssignedTeacherId(allocation?.teacherId ?? "");
          setResolvedClassroomId(classroomId);
          setScopeStatus(
            !curriculum ? "missing-curriculum" : "missing-teacher-allocation",
          );
        }
        setDataChecked(true);
        return;
      }
      const query = { termId, teacherSubjectAllocationId: allocation.id };
      const summaryQuery = {
        ...query,
        gradeId: selectedGradeId,
        subjectId: selectedSubjectId,
        classroomId: classroomId || undefined,
      };
      
      const [weekList, planList] =
        await Promise.all([
          listLessonPlanWeeks(query),
          listLessonPlans(query),
        ]);
      const detailedPlans = await Promise.all(
        planList.map((plan) => getLessonPlan(plan.id)),
      );
      if (currentRequest !== requestId.current) return;
      
      // Fire summary/validation updates concurrently without blocking page load
      refreshSummaryAndValidationForQuery(summaryQuery, options);
      setResolvedClassroomId(classroomId);
      setAssignedTeacherId(allocation.teacherId ?? "");
      setTeacherSubjectAllocationId(allocation.id);
      setCurriculumId(curriculum.id);
      setUnits(curriculum.units ?? []);
      setLessons((curriculum.units ?? []).flatMap((unit) => unit.lessons));
      setWeeks(weekList);
      setPlans(
        detailedPlans.map((plan) => ({
          ...plan,
          weekIndex:
            weekList.find(
              (week) =>
                plan.weekStartDate >= week.startDate &&
                plan.weekStartDate <= week.endDate,
            )?.weekIndex ?? plan.weekIndex,
        })),
      );
      setDataChecked(true);
      setScopeStatus("ready");
    } catch (error) {
      console.error("Failed to load lesson plans:", error);
      if (silent) {
        throw error;
      }
      onLoadError();
      setDataChecked(true);
    } finally {
      if (currentRequest === requestId.current) {
        setPlansLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [
    academicYearId,
    classrooms,
    loading,
    onLoadError,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    selectedSubjectId,
    termId,
    refreshSummaryAndValidationForQuery,
  ]);

  useEffect(() => {
    void Promise.resolve().then(() =>
      refreshAllLessonPlans().catch(() => undefined),
    );
  }, [refreshAllLessonPlans]);
  return {
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
    isInitialLoading: loading || (plansLoading && plans.length === 0 && weeks.length === 0),
    isRefreshing,
    dataChecked,
    scopeStatus,
    scopeMessage: scopeStatus,
    canLoadLessonPlans: scopeStatus === "ready",
    missingScopeReason: scopeStatus === "ready" ? null : scopeStatus,
    isLoading: loading || (plansLoading && plans.length === 0 && weeks.length === 0),
    refreshAllLessonPlans,
    refreshPlans: refreshAllLessonPlans,
    refreshPlanDetail,
    refreshSummaryAndValidation,
    refreshWeeks,
    upsertPlan,
    removePlan,
    upsertPlanItem,
    removePlanItem,
  };
}
