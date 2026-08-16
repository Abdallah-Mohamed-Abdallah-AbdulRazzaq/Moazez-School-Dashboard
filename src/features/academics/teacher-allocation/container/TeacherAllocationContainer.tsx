// Container component for Teacher Allocation Page
// Handles data fetching, state management, and business logic

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherDirectory,
  fetchTeacherAllocations,
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TeacherAllocationValidationResponse } from "@/features/academics/teacher-allocation/services/teacherAllocationApi.types";
import type { TeacherLoadViewModel } from "@/features/academics/teacher-allocation/services/teacherAllocationMappers";
import TeacherAllocationView from "../views/TeacherAllocationView";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";
import { usePermissions } from "@/hooks/usePermissions";
import { teacherAllocationUiError } from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";

type TeacherAllocationQueryState = {
  activeTab: "matrix" | "load";
};

export default function TeacherAllocationContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty } = useDirtyKey("teacher-allocation");
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
  } = useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("academics.structure.view");
  const canManage = hasPermission("academics.structure.manage");

  // Context data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherRoleId, setTeacherRoleId] = useState("");
  const [teacherAllocations, setTeacherAllocations] = useState<TeacherAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(canView);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrorTraceId, setApiErrorTraceId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [, setValidationSummary] =
    useState<TeacherAllocationValidationResponse | null>(null);
  const [, setTeacherLoads] = useState<TeacherLoadViewModel[] | null>(null);

  // UI State
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const queryState = useMemo<TeacherAllocationQueryState>(
    () => ({
      activeTab: searchParams.get("tab") === "load" ? "load" : "matrix",
    }),
    [searchParams]
  );

  const isTermClosed = termStatus === "closed";
  const isReadOnly = isTermClosed || !canManage;

  const loadTeacherAllocationData = useCallback(async () => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    if (!academicYearId || !termId) {
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiErrorTraceId(undefined);
    try {
      const [
        structureData,
        subjectsData,
        subjectAllocsData,
        teacherDirectory,
        teacherAllocsData,
      ] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchSubjects(),
        fetchSubjectAllocations(termId),
        fetchTeacherDirectory(),
        fetchTeacherAllocations(termId),
      ]);

      setGrades(structureData.grades);
      setSections(structureData.sections);
      setClassrooms(structureData.classrooms);
      setSubjects(subjectsData);
      setSubjectAllocations(subjectAllocsData);
      setTeachers(teacherDirectory.teachers);
      setTeacherRoleId(teacherDirectory.roleId);
      setTeacherAllocations(teacherAllocsData);
      setValidationSummary(null);
      setTeacherLoads(null);
      clearDirty();
    } catch (error) {
      console.error("Failed to load teacher allocation data:", error);
      const uiError = teacherAllocationUiError(
        error,
        "Failed to load teacher allocation data.",
      );
      setApiError(uiError.message);
      setApiErrorTraceId(uiError.traceId);
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, canView, clearDirty, termId]);

  // Load data when year/term changes
  useEffect(() => {
    if (!canView) {
      return;
    }
    void Promise.resolve().then(loadTeacherAllocationData);
  }, [canView, loadTeacherAllocationData]);

  const contextBarActions = useMemo(
    () => ({
      showPromoteCarryOver: false,
      disablePromoteCarryOver: true,
    }),
    []
  );

  useAcademicContextBarActions(contextBarActions);

  const handleValidate = () => {
    setValidationPanelOpen(true);
  };

  const handleAllocationsChange = useCallback(
    (allocations: TeacherAllocation[]) => {
      const hasChanges =
        JSON.stringify(allocations) !== JSON.stringify(teacherAllocations);
      if (hasChanges) {
        markDirty();
      } else {
        clearDirty();
      }
    },
    [teacherAllocations, markDirty, clearDirty]
  );

  const refreshData = async () => {
    if (!termId) return;
    setIsSaving(true);
    setApiError(null);
    setApiErrorTraceId(undefined);
    try {
      const [subjectAllocsData, teacherAllocsData] = await Promise.all([
        fetchSubjectAllocations(termId),
        fetchTeacherAllocations(termId),
      ]);
      setSubjectAllocations(subjectAllocsData);
      setTeacherAllocations(teacherAllocsData);
      setValidationSummary(null);
      setTeacherLoads(null);
      clearDirty();
    } catch (error) {
      console.error("Failed to refresh teacher allocation data:", error);
      const uiError = teacherAllocationUiError(
        error,
        "Failed to refresh teacher allocation data.",
      );
      setApiError(uiError.message);
      setApiErrorTraceId(uiError.traceId);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabChange = (tab: "matrix" | "load") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "load") {
      params.set("tab", "load");
    } else {
      params.delete("tab");
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `?${nextQuery}` : "?";
    router.push(nextUrl, { scroll: false });
  };

  const handleCloseValidationPanel = () => {
    setValidationPanelOpen(false);
  };

  // Pass everything to presenter
  return (
    <TeacherAllocationView
      academicYearId={academicYearId}
      termId={termId}
      academicYears={academicYears}
      terms={terms}
      canView={canView}
      grades={grades}
      sections={sections}
      classrooms={classrooms}
      subjects={subjects}
      subjectAllocations={subjectAllocations}
      teachers={teachers}
      teacherRoleId={teacherRoleId}
      teacherAllocations={teacherAllocations}
      isLoading={isLoading}
      apiError={apiError}
      apiErrorTraceId={apiErrorTraceId}
      isSaving={isSaving}
      activeTab={queryState.activeTab}
      validationPanelOpen={validationPanelOpen}
      isReadOnly={isReadOnly}
      isTermClosed={isTermClosed}
      onValidate={handleValidate}
      onAllocationsChange={handleAllocationsChange}
      onRefresh={refreshData}
      onRetry={loadTeacherAllocationData}
      onTabChange={handleTabChange}
      onCloseValidationPanel={handleCloseValidationPanel}
    />
  );
}
