// Container component for Subjects Allocation Page
// Handles data fetching, state management, and business logic

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import {
  fetchStructureTree,
  type Grade,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import SubjectsAllocationView from "../views/SubjectsAllocationView";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";
import { usePermissions } from "@/hooks/usePermissions";
import { subjectAllocationUiError } from "@/features/academics/subjects/services/subjectAllocationErrors";

type SubjectsAllocationQueryState = {
  activeTab: "subjects" | "matrix";
  gradeId?: string;
  subjectId?: string;
};

export default function SubjectsAllocationContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty } = useDirtyKey("subjects-allocation");
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
  } = useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("academics.subjects.view");
  const canManage = hasPermission("academics.subjects.manage");

  // Data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(canView);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrorTraceId, setApiErrorTraceId] = useState<string | undefined>();
  const hasLoadedData = useRef(false);

  // UI State
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const queryState = useMemo<SubjectsAllocationQueryState>(
    () => ({
      activeTab: searchParams.get("tab") === "matrix" ? "matrix" : "subjects",
      gradeId: searchParams.get("gradeId") || undefined,
      subjectId: searchParams.get("subjectId") || undefined,
    }),
    [searchParams]
  );

  const isTermClosed = termStatus === "closed";
  const isReadOnly = isTermClosed || !canManage;

  const loadSubjectAllocationData = useCallback(async () => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    if (!academicYearId || !termId) {
      setIsLoading(false);
      return;
    }

    const isReloadingMatrix = hasLoadedData.current;
    if (isReloadingMatrix) {
      setIsMatrixLoading(true);
    } else {
      setIsLoading(true);
    }
    setApiError(null);
    setApiErrorTraceId(undefined);
    try {
      const [structureData, subjectsData, allocationsData] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchSubjects(),
        fetchSubjectAllocations(termId, {
          gradeId: queryState.gradeId,
          subjectId: queryState.subjectId,
        }),
      ]);

      setStages(structureData.stages || []);
      setGrades(structureData.grades);
      setSubjects(subjectsData);
      setAllocations(allocationsData);
      clearDirty();
      hasLoadedData.current = true;
    } catch (error) {
      console.error("Failed to load subject allocation data:", error);
      const uiError = subjectAllocationUiError(
        error,
        "Failed to load subject allocation data.",
      );
      setApiError(uiError.message);
      setApiErrorTraceId(uiError.traceId);
    } finally {
      setIsLoading(false);
      setIsMatrixLoading(false);
    }
  }, [
    academicYearId,
    canView,
    clearDirty,
    queryState.gradeId,
    queryState.subjectId,
    termId,
  ]);

  // Load data when year/term changes
  useEffect(() => {
    if (!canView) {
      return;
    }
    void Promise.resolve().then(loadSubjectAllocationData);
  }, [canView, loadSubjectAllocationData]);

  const contextBarActions = useMemo(
    () => ({
      showPromoteCarryOver: false,
    }),
    [],
  );

  useAcademicContextBarActions(contextBarActions);

  const handleTabChange = (tab: "subjects" | "matrix") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "matrix") {
      params.set("tab", "matrix");
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

  const refreshData = async () => {
    if (!termId) return;
    setApiError(null);
    setApiErrorTraceId(undefined);
    try {
      const [subjectsData, allocationsData] = await Promise.all([
        fetchSubjects(),
        fetchSubjectAllocations(termId, {
          gradeId: queryState.gradeId,
          subjectId: queryState.subjectId,
        }),
      ]);
      setSubjects(subjectsData);
      setAllocations(allocationsData);
      clearDirty();
    } catch (error) {
      console.error("Failed to refresh subject allocation data:", error);
      const uiError = subjectAllocationUiError(
        error,
        "Failed to refresh subject allocation data.",
      );
      setApiError(uiError.message);
      setApiErrorTraceId(uiError.traceId);
      throw error;
    }
  };

  const handleSaveError = useCallback((error: unknown) => {
    const uiError = subjectAllocationUiError(
      error,
      "Failed to save subject allocations.",
    );
    setApiError(uiError.message);
    setApiErrorTraceId(uiError.traceId);
  }, []);

  const handleAddSubject = () => {
    setEditingSubject(null);
    setShowSubjectDialog(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setShowSubjectDialog(true);
  };

  const handleSubjectSuccess = async () => {
    await refreshData();
    setShowSubjectDialog(false);
    setEditingSubject(null);
  };

  const handleAllocationsChange = useCallback(
    (newAllocations: SubjectAllocation[]) => {
      setAllocations(newAllocations);
      markDirty();
    },
    [markDirty]
  );

  const handleDirtyChange = useCallback(
    (isDirty: boolean) => {
      if (isDirty) {
        markDirty();
      } else {
        clearDirty();
      }
    },
    [markDirty, clearDirty]
  );

  const handleCloseSubjectDialog = () => {
    setShowSubjectDialog(false);
    setEditingSubject(null);
  };

  // Pass everything to presenter
  return (
    <SubjectsAllocationView
      academicYearId={academicYearId}
      termId={termId}
      academicYears={academicYears}
      terms={terms}
      canView={canView}
      stages={stages}
      grades={grades}
      subjects={subjects}
      allocations={allocations}
      isLoading={isLoading}
      isMatrixLoading={isMatrixLoading}
      apiError={apiError}
      apiErrorTraceId={apiErrorTraceId}
      activeTab={queryState.activeTab}
      showSubjectDialog={showSubjectDialog}
      editingSubject={editingSubject}
      isReadOnly={isReadOnly}
      isTermClosed={isTermClosed}
      onTabChange={handleTabChange}
      onAddSubject={handleAddSubject}
      onEditSubject={handleEditSubject}
      onSubjectSuccess={handleSubjectSuccess}
      onAllocationsChange={handleAllocationsChange}
      onDirtyChange={handleDirtyChange}
      onSaveError={handleSaveError}
      onRefresh={refreshData}
      onRetry={loadSubjectAllocationData}
      onCloseSubjectDialog={handleCloseSubjectDialog}
    />
  );
}
