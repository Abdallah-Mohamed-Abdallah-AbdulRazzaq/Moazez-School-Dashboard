"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, RotateCcw, AlertCircle, Users, Trash2 } from "lucide-react";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import { IconButton, Tooltip } from "@mui/material";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import FilterBar from "./FilterBar";
import TeacherSelect from "./TeacherSelect";
import BulkActionDialog from "./BulkActionDialog";
import AllocationMatrixTable, { MatrixColumn, MatrixRow } from "../../components/shared/AllocationMatrixTable";
import {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  Teacher,
  TeacherAllocation,
  clearSubjectAllocations,
  saveTeacherAllocationChanges,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { teacherAllocationUiError } from "@/features/academics/teacher-allocation/services/teacherAllocationErrors";
import TeacherAllocationTechnicalDetails from "./TeacherAllocationTechnicalDetails";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  ExportColumn,
  ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";
import { CheckCircle } from "lucide-react";

interface AllocationMatrixViewProps {
  termId: string;
  yearName?: string;
  termName?: string;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherRoleId: string;
  teacherAllocations: TeacherAllocation[];
  isReadOnly: boolean;
  onRefresh: () => Promise<void>;
  onValidate: () => void;
  onAllocationsChange?: (allocations: TeacherAllocation[]) => void;
}

type TargetRow = MatrixRow & {
  section: Section;
  classroom: Classroom;
};

type SectionWarningRow = MatrixRow & {
  section: Section;
};

type ClearSubjectScope = "grade" | "classrooms";

interface OperationError {
  message: string;
  traceId?: string;
  details: string[];
}

interface SummaryCard {
  label: string;
  value: string | number;
  tone: "neutral" | "success" | "warning" | "danger";
}

function localizedName(
  record: { name?: string; nameAr?: string; nameEn?: string },
  locale: string
) {
  return locale === "ar"
    ? (record.nameAr || record.nameEn || record.name || "-")
    : (record.nameEn || record.nameAr || record.name || "-");
}

function findClassroomAllocation(
  allocations: TeacherAllocation[],
  target: { sectionId: string; classroomId: string; subjectId: string }
) {
  return allocations.find(
    (allocation) =>
      allocation.sectionId === target.sectionId &&
      allocation.classroomId === target.classroomId &&
      allocation.subjectId === target.subjectId
  );
}

function teacherAllocationCellKey(classroomId: string, subjectId: string) {
  return `${classroomId}:${subjectId}`;
}

function isSubjectRegisteredForGrade(
  allocations: SubjectAllocation[],
  gradeId: string,
  subjectId: string,
) {
  return allocations.some(
    (allocation) =>
      allocation.gradeId === gradeId &&
      allocation.subjectId === subjectId &&
      allocation.weeklyHours > 0,
  );
}

function teacherIdForCell(
  allocations: TeacherAllocation[],
  target: { sectionId: string; classroomId: string; subjectId: string },
) {
  return findClassroomAllocation(allocations, target)?.teacherId || null;
}

function summaryCardClass(tone: SummaryCard["tone"]) {
  if (tone === "success") {
    return "border-green-200 bg-green-50 text-green-800";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-gray-200 bg-white text-gray-900";
}

export default function AllocationMatrixView({
  termId,
  yearName,
  termName,
  grades,
  sections,
  classrooms,
  subjects,
  subjectAllocations,
  teachers,
  teacherRoleId,
  teacherAllocations,
  isReadOnly,
  onRefresh,
  onValidate,
  onAllocationsChange,
}: AllocationMatrixViewProps) {
  const t = useTranslations("academics.teacherAllocation");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const isRTL = locale === "ar";
  const queryState = useMemo(
    () => ({
      selectedGradeId: searchParams.get("grade") || "",
      selectedSectionId: searchParams.get("section") || "",
      selectedClassroomId: searchParams.get("classroom") || "",
      selectedSubjectId: searchParams.get("subject") || "",
      showOnlyMissing: searchParams.get("missing") === "1",
      highlightedCellKey: searchParams.get("highlightCell") || "",
    }),
    [searchParams]
  );
  const {
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    showOnlyMissing,
    highlightedCellKey,
  } = queryState;

  const [localAllocations, setLocalAllocations] =
    useState<TeacherAllocation[]>(teacherAllocations);
  const [originalAllocations, setOriginalAllocations] =
    useState<TeacherAllocation[]>(teacherAllocations);
  const previousTeacherAllocationsRef = useRef(teacherAllocations);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingSubject, setIsClearingSubject] = useState(false);
  const [operationError, setOperationError] = useState<OperationError | null>(null);
  const [failedCellKeys, setFailedCellKeys] = useState<Set<string>>(new Set());

  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionGrade, setBulkActionGrade] = useState<Grade | null>(null);
  const [bulkActionSubject, setBulkActionSubject] = useState<Subject | null>(null);
  const [bulkActionTeacher, setBulkActionTeacher] = useState<Teacher | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (previousTeacherAllocationsRef.current === teacherAllocations) {
      return;
    }
    previousTeacherAllocationsRef.current = teacherAllocations;

    void Promise.resolve().then(() => {
      setLocalAllocations(teacherAllocations);
      setOriginalAllocations(teacherAllocations);
    });
  }, [teacherAllocations]);

  useEffect(() => {
    onAllocationsChange?.(localAllocations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAllocations]);

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        selectedGradeId: string;
        selectedSectionId: string;
        selectedClassroomId: string;
        selectedSubjectId: string;
        showOnlyMissing: boolean;
        highlightedCellKey: string;
      }>,
      historyMode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const mergedState = {
        selectedGradeId:
          nextState.selectedGradeId ?? queryState.selectedGradeId,
        selectedSectionId:
          nextState.selectedSectionId ?? queryState.selectedSectionId,
        selectedClassroomId:
          nextState.selectedClassroomId ?? queryState.selectedClassroomId,
        selectedSubjectId:
          nextState.selectedSubjectId ?? queryState.selectedSubjectId,
        showOnlyMissing:
          nextState.showOnlyMissing ?? queryState.showOnlyMissing,
        highlightedCellKey:
          nextState.highlightedCellKey ?? queryState.highlightedCellKey,
      };

      const entries: Array<[string, string]> = [
        ["grade", mergedState.selectedGradeId],
        ["section", mergedState.selectedSectionId],
        ["classroom", mergedState.selectedClassroomId],
        ["subject", mergedState.selectedSubjectId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      if (mergedState.showOnlyMissing) {
        params.set("missing", "1");
      } else {
        params.delete("missing");
      }

      if (mergedState.highlightedCellKey) {
        params.set("highlightCell", mergedState.highlightedCellKey);
      } else {
        params.delete("highlightCell");
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
    [queryState, router, searchParams]
  );

  const allocationsEqual = useCallback((left: TeacherAllocation, right: TeacherAllocation) => {
    return (
      left.sectionId === right.sectionId &&
      left.subjectId === right.subjectId &&
      (left.classroomId || "") === (right.classroomId || "") &&
      left.teacherId === right.teacherId
    );
  }, []);

  const isDirty = useMemo(() => {
    if (localAllocations.length !== originalAllocations.length) return true;

    return localAllocations.some((localAllocation) => {
      const original = originalAllocations.find(
        (originalAllocation) =>
          originalAllocation.sectionId === localAllocation.sectionId &&
          originalAllocation.subjectId === localAllocation.subjectId &&
          (originalAllocation.classroomId || "") === (localAllocation.classroomId || "")
      );
      return !original || !allocationsEqual(localAllocation, original);
    });
  }, [allocationsEqual, localAllocations, originalAllocations]);

  const filteredSections = useMemo(() => {
    let filteredSectionList = sections;

    if (selectedGradeId) {
      filteredSectionList = filteredSectionList.filter((section) => section.gradeId === selectedGradeId);
    }

    if (selectedSectionId) {
      filteredSectionList = filteredSectionList.filter((section) => section.id === selectedSectionId);
    }

    return filteredSectionList;
  }, [sections, selectedGradeId, selectedSectionId]);

  useEffect(() => {
    if (grades.length === 0 && sections.length === 0 && classrooms.length === 0) {
      return;
    }

    const normalizedGradeId = grades.some((grade) => grade.id === selectedGradeId)
      ? selectedGradeId
      : "";
    const normalizedSectionId = sections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId)
    )
      ? selectedSectionId
      : "";
    const normalizedClassroomId = classrooms.some((classroom) => {
      const classroomSection = sections.find((section) => section.id === classroom.sectionId);
      return (
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId) &&
        (!normalizedGradeId || classroomSection?.gradeId === normalizedGradeId)
      );
    })
      ? selectedClassroomId
      : "";

    if (
      normalizedGradeId === selectedGradeId &&
      normalizedSectionId === selectedSectionId &&
      normalizedClassroomId === selectedClassroomId
    ) {
      return;
    }

    syncQueryParams(
      {
        selectedGradeId: normalizedGradeId,
        selectedSectionId: normalizedSectionId,
        selectedClassroomId: normalizedClassroomId,
      },
      "replace"
    );
  }, [
    classrooms,
    grades,
    sections,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    syncQueryParams,
  ]);

  const allocatedFilterSubjects = useMemo(() => {
    const weeklySubjectIds = new Set(
      subjectAllocations
        .filter(
          (subjectAllocation) =>
            subjectAllocation.weeklyHours > 0 &&
            (!selectedGradeId || subjectAllocation.gradeId === selectedGradeId),
        )
        .map((subjectAllocation) => subjectAllocation.subjectId),
    );

    return subjects.filter((subject) => weeklySubjectIds.has(subject.id));
  }, [selectedGradeId, subjectAllocations, subjects]);

  const filteredSubjects = useMemo(() => {
    if (!selectedSubjectId) {
      return allocatedFilterSubjects;
    }

    return allocatedFilterSubjects.filter((subject) => subject.id === selectedSubjectId);
  }, [allocatedFilterSubjects, selectedSubjectId]);

  const teacherLoads = useMemo(() => {
    const loads = new Map<string, number>();

    localAllocations.forEach((allocation) => {
      if (!allocation.teacherId) return;

      const section = sections.find((sectionCandidate) => sectionCandidate.id === allocation.sectionId);
      if (!section) return;

      const subjectAllocation = subjectAllocations.find(
        (subjectAllocationCandidate) =>
          subjectAllocationCandidate.gradeId === section.gradeId &&
          subjectAllocationCandidate.subjectId === allocation.subjectId
      );

      if (!subjectAllocation || subjectAllocation.weeklyHours <= 0) return;

      const currentLoad = loads.get(allocation.teacherId) || 0;
      loads.set(allocation.teacherId, currentLoad + subjectAllocation.weeklyHours);
    });

    return loads;
  }, [localAllocations, sections, subjectAllocations]);

  const getAllocation = useCallback(
    (sectionId: string, subjectId: string, classroomId: string) => {
      const allocation = findClassroomAllocation(localAllocations, {
        sectionId,
        classroomId,
        subjectId,
      });
      return allocation?.teacherId || null;
    },
    [localAllocations]
  );

  const setAllocation = useCallback(
    (sectionId: string, subjectId: string, teacherId: string | null, classroomId: string) => {
      setLocalAllocations((previous) => {
        const existing = previous.find(
          (allocation) =>
            allocation.sectionId === sectionId &&
            allocation.subjectId === subjectId &&
            allocation.classroomId === classroomId
        );

        if (existing) {
          return previous.map((allocation) =>
            allocation.sectionId === sectionId &&
            allocation.subjectId === subjectId &&
            allocation.classroomId === classroomId
              ? { ...allocation, teacherId, classroomId }
              : allocation
          );
        }

        if (!teacherId) {
          return previous;
        }

        return [
          ...previous,
          {
            id: `temp-${Date.now()}-${Math.random()}`,
            termId,
            sectionId,
            classroomId,
            subjectId,
            teacherId,
          },
        ];
      });
      setFailedCellKeys((previousFailedKeys) => {
        const nextCellKey = teacherAllocationCellKey(classroomId, subjectId);
        if (!previousFailedKeys.has(nextCellKey)) {
          return previousFailedKeys;
        }
        const nextFailedKeys = new Set(previousFailedKeys);
        nextFailedKeys.delete(nextCellKey);
        return nextFailedKeys;
      });
      setOperationError(null);
    },
    [termId]
  );

  const getMissingCount = useCallback(
    (sectionId: string, classroomId: string) => {
      return filteredSubjects.filter((subject) => {
        const allocation = findClassroomAllocation(localAllocations, {
          sectionId,
          classroomId,
          subjectId: subject.id,
        });
        return !allocation || !allocation.teacherId;
      }).length;
    },
    [filteredSubjects, localAllocations]
  );

  const handleSave = async () => {
    setIsSaving(true);
    setOperationError(null);
    try {
      await saveTeacherAllocationChanges({
        termId,
        localAllocations,
        originalAllocations,
      });
      await onRefresh();
      setOriginalAllocations(localAllocations);
      setFailedCellKeys(new Set());
    } catch (error) {
      console.error("Failed to save allocations:", error);
      const uiError = teacherAllocationUiError(
        error,
        "Failed to save teacher allocations.",
      );
      setOperationError(uiError);
      setFailedCellKeys(new Set(changedCellKeys));
      showError(uiError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSubject = async () => {
    if (!selectedSubject || !clearSubjectScope) return;

    const subjectName = localizedName(selectedSubject, locale);
    const targetText = clearSubjectScope === "grade"
      ? t("clearSubject.targetGrade")
      : t("clearSubject.targetClassrooms", { count: clearSubjectClassroomIds.length });
    const confirmed = window.confirm(
      t("clearSubject.confirm", { subject: subjectName, target: targetText }),
    );
    if (!confirmed) return;

    setIsClearingSubject(true);
    setOperationError(null);
    try {
      const response = await clearSubjectAllocations({
        termId,
        subjectId: selectedSubject.id,
        gradeId: clearSubjectScope === "grade" ? selectedGradeId : undefined,
        classroomIds:
          clearSubjectScope === "classrooms"
            ? clearSubjectClassroomIds
            : undefined,
      });
      await onRefresh();
      showSuccess(t("clearSubject.success", { count: response.deletedCount }));
    } catch (error) {
      console.error("Failed to clear subject allocations:", error);
      const uiError = teacherAllocationUiError(
        error,
        "Failed to clear subject allocations.",
      );
      setOperationError(uiError);
      showError(uiError.message);
    } finally {
      setIsClearingSubject(false);
    }
  };

  const handleReset = () => {
    setLocalAllocations(originalAllocations);
    setOperationError(null);
    setFailedCellKeys(new Set());
  };

  const matrixRows = useMemo<TargetRow[]>(() => {
    const getGradeName = (gradeId: string) => {
      const grade = grades.find((gradeCandidate) => gradeCandidate.id === gradeId);
      return grade ? localizedName(grade, locale) : "-";
    };

    const rows: TargetRow[] = filteredSections.flatMap((section) => {
      const sectionClassrooms = classrooms.filter(
        (classroom) => classroom.sectionId === section.id,
      );
      const visibleClassrooms = sectionClassrooms.filter(
        (classroom) => !selectedClassroomId || classroom.id === selectedClassroomId,
      );

      return visibleClassrooms
        .map((classroom) => {
          const sectionName = localizedName(section, locale);
          const classroomName = localizedName(classroom, locale);
          return {
            id: classroom.id,
            section,
            classroom,
            label: classroomName,
            secondaryLabel: `${getGradeName(section.gradeId)} / ${sectionName}`,
          } satisfies TargetRow;
        });
    });

    if (!showOnlyMissing) return rows;
    return rows.filter((row) => getMissingCount(row.section.id, row.classroom.id) > 0);
  }, [classrooms, filteredSections, getMissingCount, grades, locale, selectedClassroomId, showOnlyMissing]);

  const sectionWarningRows = useMemo<SectionWarningRow[]>(() => {
    if (selectedClassroomId) return [];

    return filteredSections
      .filter((section) => !classrooms.some((classroom) => classroom.sectionId === section.id))
      .map((section) => {
        const grade = grades.find((gradeCandidate) => gradeCandidate.id === section.gradeId);
        return {
          id: section.id,
          section,
          label: localizedName(section, locale),
          secondaryLabel: grade ? localizedName(grade, locale) : "-",
        };
      });
  }, [classrooms, filteredSections, grades, locale, selectedClassroomId]);

  const matrixColumns = useMemo<(MatrixColumn & { subject: Subject })[]>(() => {
    return filteredSubjects.map((subject) => ({
      id: subject.id,
      subject,
      label: locale === "ar"
        ? (subject.nameAr || subject.nameEn || subject.name)
        : (subject.nameEn || subject.nameAr || subject.name),
      code: subject.code,
      minWidth: "250px",
    }));
  }, [filteredSubjects, locale]);

  const changedCellKeys = new Set<string>();
  matrixRows.forEach((row) => {
    matrixColumns.forEach((column) => {
      const target = {
        sectionId: row.section.id,
        classroomId: row.classroom.id,
        subjectId: column.subject.id,
      };
      const originalTeacherId = teacherIdForCell(originalAllocations, target);
      const localTeacherId = teacherIdForCell(localAllocations, target);
      if (originalTeacherId !== localTeacherId) {
        changedCellKeys.add(teacherAllocationCellKey(row.classroom.id, column.subject.id));
      }
    });
  });

  useEffect(() => {
    if (!highlightedCellKey) {
      return;
    }

    const highlightedCell = document.getElementById(`allocation-cell-${highlightedCellKey}`);
    highlightedCell?.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: "smooth",
    });
  }, [highlightedCellKey, matrixRows, matrixColumns]);

  const selectedSubject = selectedSubjectId
    ? subjects.find((subject) => subject.id === selectedSubjectId) || null
    : null;

  const clearSubjectClassroomIds = (() => {
    const sectionIds = new Set(filteredSections.map((section) => section.id));
    return classrooms
      .filter((classroom) => sectionIds.has(classroom.sectionId))
      .filter((classroom) => !selectedClassroomId || classroom.id === selectedClassroomId)
      .map((classroom) => classroom.id);
  })();

  const clearSubjectScope: ClearSubjectScope | null = selectedSectionId || selectedClassroomId
    ? "classrooms"
    : selectedGradeId
      ? "grade"
      : null;

  const canClearSubject = Boolean(
    selectedSubject &&
      clearSubjectScope &&
      !isReadOnly &&
      !isDirty &&
      !isClearingSubject &&
      (clearSubjectScope === "grade" || clearSubjectClassroomIds.length > 0),
  );

  const allocatedCellCount = useMemo(() => {
    return matrixRows.reduce((totalAllocatedCells, row) => {
      const allocatedSubjects = matrixColumns.filter((column) => {
        const teacherId = teacherIdForCell(localAllocations, {
          sectionId: row.section.id,
          classroomId: row.classroom.id,
          subjectId: column.subject.id,
        });
        return Boolean(teacherId);
      });
      return totalAllocatedCells + allocatedSubjects.length;
    }, 0);
  }, [localAllocations, matrixColumns, matrixRows]);

  const totalCellCount = matrixRows.length * matrixColumns.length;
  const missingCellCount = Math.max(totalCellCount - allocatedCellCount, 0);
  const validationStatus = operationError
    ? t("summaryCards.validationStatus.saveFailed")
    : missingCellCount > 0
      ? t("summaryCards.validationStatus.needsReview")
      : t("summaryCards.validationStatus.complete");
  const summaryCards: SummaryCard[] = [
    { label: t("summaryCards.totalClassrooms"), value: matrixRows.length, tone: "neutral" },
    { label: t("summaryCards.subjectsWithWeeklyHours"), value: matrixColumns.length, tone: "neutral" },
    { label: t("summaryCards.allocatedCells"), value: allocatedCellCount, tone: "success" },
    {
      label: t("summaryCards.missingCells"),
      value: missingCellCount,
      tone: missingCellCount > 0 ? "warning" : "success",
    },
    { label: t("summaryCards.teacherAllocationRows"), value: teacherAllocations.length, tone: "neutral" },
    {
      label: t("summaryCards.validationStatus.label"),
      value: validationStatus,
      tone: operationError ? "danger" : missingCellCount > 0 ? "warning" : "success",
    },
  ];

  const completionPercentage = useMemo(() => {
    const totalCells = matrixRows.length * filteredSubjects.length;
    if (totalCells === 0) return 0;

    const filledCells = matrixRows.reduce((count, row) => {
      return count + filteredSubjects.filter((subject) => {
        const allocation = findClassroomAllocation(localAllocations, {
          sectionId: row.section.id,
          classroomId: row.classroom.id,
          subjectId: subject.id,
        });
        return Boolean(allocation?.teacherId);
      }).length;
    }, 0);

    return Math.round((filledCells / totalCells) * 100);
  }, [filteredSubjects, localAllocations, matrixRows]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName,
      termName,
      exportDate: formatExportDate(locale),
    };

    if (selectedGradeId) {
      const grade = grades.find((gradeCandidate) => gradeCandidate.id === selectedGradeId);
      if (grade) metadata.gradeName = locale === "ar" ? grade.nameAr : grade.nameEn;
    }

    if (selectedSectionId) {
      const section = sections.find((sectionCandidate) => sectionCandidate.id === selectedSectionId);
      if (section) metadata.sectionName = locale === "ar" ? section.nameAr : section.nameEn;
    }

    if (selectedClassroomId) {
      const classroom = classrooms.find((classroomCandidate) => classroomCandidate.id === selectedClassroomId);
      if (classroom) metadata.classroomName = locale === "ar" ? classroom.nameAr : classroom.nameEn;
    }

    const columns: ExportColumn[] = [
      { key: "section", label: t("matrix.columns.section") },
      { key: "grade", label: t("matrix.columns.grade") },
      { key: "classroom", label: t("filters.classroom") },
      ...filteredSubjects.map((subject) => ({
        key: `subject_${subject.id}`,
        label: locale === "ar" ? subject.nameAr : subject.nameEn,
      })),
    ];

    const rows = matrixRows.map((row) => {
      const grade = grades.find((gradeCandidate) => gradeCandidate.id === row.section.gradeId);
      const record: Record<string, unknown> = {
        section: locale === "ar" ? row.section.nameAr : row.section.nameEn,
        grade: grade ? (locale === "ar" ? grade.nameAr : grade.nameEn) : "",
        classroom: locale === "ar" ? row.classroom.nameAr : row.classroom.nameEn,
      };

      filteredSubjects.forEach((subject) => {
        const allocation = findClassroomAllocation(localAllocations, {
          sectionId: row.section.id,
          classroomId: row.classroom.id,
          subjectId: subject.id,
        });
        const teacher = allocation?.teacherId
          ? teachers.find((teacherCandidate) => teacherCandidate.id === allocation.teacherId)
          : null;
        record[`subject_${subject.id}`] = teacher
          ? locale === "ar"
            ? teacher.nameAr
            : teacher.nameEn
          : "";
      });

      return record;
    });

    const filename = generateExportFilename(
      "teacher-allocation",
      termId,
      selectedClassroomId || selectedSectionId || selectedGradeId || undefined
    );

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename,
      format,
      columns,
      rows,
      locale,
      jsonData: {
        title: t("title"),
        metadata,
        rows,
      },
    });
  };

  const handleOpenBulkAction = (gradeId: string, subjectId: string, teacherId: string | null) => {
    if (!teacherId || !selectedGradeId) return;

    const grade = grades.find((gradeCandidate) => gradeCandidate.id === gradeId);
    const subject = subjects.find((subjectCandidate) => subjectCandidate.id === subjectId);
    const teacher = teachers.find((teacherCandidate) => teacherCandidate.id === teacherId);

    if (grade && subject && teacher) {
      setBulkActionGrade(grade);
      setBulkActionSubject(subject);
      setBulkActionTeacher(teacher);
      setBulkActionDialogOpen(true);
    }
  };

  const renderCell = (row: TargetRow, column: MatrixColumn & { subject: Subject }) => {
    const teacherId = getAllocation(row.section.id, column.subject.id, row.classroom.id);
    const cellKey = teacherAllocationCellKey(row.classroom.id, column.subject.id);
    const isSubjectRegistered = isSubjectRegisteredForGrade(
      subjectAllocations,
      row.section.gradeId,
      column.subject.id,
    );
    const isMissing = !teacherId;
    const isChanged = changedCellKeys.has(cellKey);
    const didSaveFail = failedCellKeys.has(cellKey);
    const isHighlighted = highlightedCellKey === cellKey;
    const cellToneClass = didSaveFail
      ? "border-red-300 bg-red-50"
      : isHighlighted
        ? "border-sky-400 bg-sky-50"
        : isChanged
          ? "border-amber-300 bg-amber-50"
          : isMissing
            ? "border-gray-200 bg-gray-50"
            : "border-transparent bg-white";

    return (
      <div
        id={`allocation-cell-${cellKey}`}
        className={`min-h-[68px] border-2 px-4 py-3 transition-colors ${cellToneClass}`}
      >
        <TeacherSelect
          teachers={teachers}
          teacherRoleId={teacherRoleId}
          value={teacherId}
          onChange={(newTeacherId) => setAllocation(row.section.id, column.subject.id, newTeacherId, row.classroom.id)}
          disabled={isReadOnly || !isSubjectRegistered}
          teacherLoads={teacherLoads}
          size="small"
        />
      </div>
    );
  };

  const renderColumnHeader = (column: MatrixColumn & { subject: Subject }) => {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <span className={isRTL ? "text-right" : "text-left"}>{column.label}</span>
          {column.code && (
            <span className="inline-flex">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                {column.code}
              </span>
            </span>
          )}
        </div>
        {selectedGradeId && !selectedSectionId && !isReadOnly && (
          <Tooltip title={t("actions.applyToAllSections")} arrow>
            <IconButton
              size="small"
              onClick={() => {
                const firstRow = matrixRows[0];
                if (!firstRow) return;
                const teacherId = getAllocation(firstRow.section.id, column.subject.id, firstRow.classroom.id);
                if (teacherId) {
                  handleOpenBulkAction(selectedGradeId, column.subject.id, teacherId);
                }
              }}
              sx={{
                padding: "4px",
                color: "var(--color-primary, #006D82)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-100, #e0f2f5)",
                },
              }}
            >
              <Users className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    );
  };

  const handleBulkActionSuccess = async () => {
    await onRefresh();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <FilterBar
        grades={grades}
        sections={sections}
        classrooms={classrooms}
        subjects={allocatedFilterSubjects}
        selectedGradeId={selectedGradeId}
        selectedSectionId={selectedSectionId}
        selectedClassroomId={selectedClassroomId}
        selectedSubjectId={selectedSubjectId}
        showOnlyMissing={showOnlyMissing}
        onGradeChange={(gradeId) =>
          syncQueryParams(
            {
              selectedGradeId: gradeId,
              selectedSectionId: "",
              selectedClassroomId: "",
              selectedSubjectId: "",
            },
            "push"
          )
        }
        onSectionChange={(sectionId) =>
          syncQueryParams(
            {
              selectedSectionId: sectionId,
              selectedClassroomId: "",
            },
            "push"
          )
        }
        onClassroomChange={(classroomId) =>
          syncQueryParams({ selectedClassroomId: classroomId }, "push")
        }
        onSubjectChange={(subjectId) =>
          syncQueryParams({ selectedSubjectId: subjectId }, "push")
        }
        onShowOnlyMissingChange={(show) =>
          syncQueryParams({ showOnlyMissing: show }, "push")
        }
        onValidate={onValidate}
      />

      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t("matrix.title")}</h2>
              <div className="flex items-center gap-6 text-sm text-gray-600 mt-1 flex-wrap">
                <span>
                  {t("filters.classroom")}: <strong>{matrixRows.length}</strong>
                </span>
                <span>
                  {t("matrix.summary.subjects")}: <strong>{filteredSubjects.length}</strong>
                </span>
                <span>
                  {t("matrix.summary.completion")}: <strong>{completionPercentage}%</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <div className="flex items-center gap-2 text-sm text-amber-600 mr-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t("unsavedChanges.message")}</span>
                </div>
              )}
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={matrixRows.length === 0 || filteredSubjects.length === 0}
              >
                {t("actions.export")}
              </Button>
              <Button
                onClick={handleClearSubject}
                variant="danger"
                leftIcon={<Trash2 className="w-4 h-4" />}
                disabled={!canClearSubject}
                loading={isClearingSubject}
              >
                {clearSubjectScope === "classrooms"
                  ? t("clearSubject.classrooms")
                  : t("clearSubject.grade")}
              </Button>
              <Button
                onClick={handleReset}
                variant="secondary"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                disabled={!isDirty || isReadOnly}
              >
                {t("actions.reset")}
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                disabled={!isDirty || isReadOnly || isSaving}
              >
                {isSaving
                  ? t("actions.saving")
                  : changedCellKeys.size > 0
                    ? `${t("actions.save")} (${changedCellKeys.size})`
                    : t("actions.save")}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((summaryCard) => (
              <div
                key={summaryCard.label}
                className={`rounded-md border px-3 py-2 ${summaryCardClass(summaryCard.tone)}`}
              >
                <div className="text-xs font-medium text-gray-500">{summaryCard.label}</div>
                <div className="mt-1 text-lg font-semibold">{summaryCard.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto">
            {sectionWarningRows.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
                {sectionWarningRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 border-b border-amber-200 px-4 py-3 text-sm text-amber-900 last:border-b-0"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-amber-950">{row.label}</div>
                      <div>{row.secondaryLabel} - {t("emptyState.noClassroomsInSection")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {operationError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <div>{operationError.message}</div>
                    <TeacherAllocationTechnicalDetails
                      traceId={operationError.traceId}
                      details={operationError.details}
                    />
                  </div>
                </div>
              </div>
            )}

            {teacherAllocations.length === 0 && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {t("emptyState.noAllocations")}
              </div>
            )}

            {matrixRows.length === 0 ? (
              sectionWarningRows.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">{t("emptyState.noGrades.message")}</p>
                </div>
              ) : null
            ) : filteredSubjects.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500">{t("emptyState.noSubjects.message")}</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <AllocationMatrixTable
                  rows={matrixRows}
                  columns={matrixColumns}
                  rowHeaderLabel={t("filters.classroom")}
                  totalColumnLabel={t("matrix.missingCount")}
                  showPagination
                  itemsPerPage={10}
                  renderCell={renderCell}
                  renderColumnHeader={renderColumnHeader}
                  renderRowTotal={(row) => {
                    const typedRow = row as TargetRow;
                    const missingCount = getMissingCount(typedRow.section.id, typedRow.classroom.id);
                    return (
                      <div className="flex items-center justify-center">
                        {missingCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-200 text-primary-900">
                            {missingCount}
                          </span>
                        ) : (
                          <span className="text-green-600"><CheckCircle className="w-7 h-7" /></span>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <BulkActionDialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
        termId={termId}
        grade={bulkActionGrade}
        subject={bulkActionSubject}
        teacher={bulkActionTeacher}
        sections={sections}
        classrooms={classrooms}
        onSuccess={handleBulkActionSuccess}
      />

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("actions.export")}
        subtitle={t("matrix.title")}
        datasetCount={matrixRows.length}
      />
    </div>
  );
}
