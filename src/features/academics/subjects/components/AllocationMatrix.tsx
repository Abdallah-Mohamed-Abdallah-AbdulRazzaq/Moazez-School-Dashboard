"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, RotateCcw } from "lucide-react";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import AllocationMatrixTable, {
  MatrixColumn,
  MatrixRow,
} from "../../components/shared/AllocationMatrixTable";
import {
  Subject,
  SubjectAllocation,
  bulkUpsertSubjectAllocations,
} from "@/features/academics/subjects/services/subjectsService";
import {
  Grade,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  ExportColumn,
  ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";

interface AllocationMatrixProps {
  stages: Stage[];
  grades: Grade[];
  subjects: Subject[];
  allocations: SubjectAllocation[];
  termId: string;
  yearName?: string;
  termName?: string;
  isLoading?: boolean;
  isReadOnly: boolean;
  onAllocationsChange: (allocations: SubjectAllocation[]) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaveError: (error: unknown) => void;
  onRefresh: () => Promise<void>;
}

export default function AllocationMatrix({
  stages,
  grades,
  subjects,
  allocations,
  termId,
  yearName,
  termName,
  isLoading = false,
  isReadOnly,
  onDirtyChange,
  onSaveError,
  onRefresh,
}: AllocationMatrixProps) {
  const t = useTranslations("academics.subjects.matrix");
  const locale = useLocale();
  const periodLabel = locale === "ar" ? "حصص" : "Periods";
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryState = useMemo(
    () => ({
      stageFilter: searchParams.get("stage") || "",
      gradeFilter: searchParams.get("gradeId") || "",
      subjectFilter: searchParams.get("subjectId") || "",
      showOnlyMissing: searchParams.get("missing") === "1",
    }),
    [searchParams],
  );
  const { stageFilter, gradeFilter, subjectFilter, showOnlyMissing } =
    queryState;

  const [localAllocations, setLocalAllocations] = useState<SubjectAllocation[]>(
    allocations,
  );
  const [originalAllocations, setOriginalAllocations] = useState<
    SubjectAllocation[]
  >(allocations);
  const previousAllocationsRef = useRef(allocations);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize local allocations
  useEffect(() => {
    if (previousAllocationsRef.current === allocations) {
      return;
    }
    previousAllocationsRef.current = allocations;
    void Promise.resolve().then(() => {
      setLocalAllocations(allocations);
      setOriginalAllocations(allocations);
    });
  }, [allocations]);

  const getAllocation = (gradeId: string, subjectId: string): number => {
    const allocation = localAllocations.find(
      (a) => a.gradeId === gradeId && a.subjectId === subjectId,
    );
    return allocation?.weeklyHours || 0;
  };

  // Track dirty state
  const isDirty = useMemo(() => {
    if (localAllocations.length !== originalAllocations.length) return true;

    return localAllocations.some((local) => {
      const original = originalAllocations.find(
        (o) => o.gradeId === local.gradeId && o.subjectId === local.subjectId,
      );
      return !original || original.weeklyHours !== local.weeklyHours;
    });
  }, [localAllocations, originalAllocations]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const syncQueryParams = (
    nextState: Partial<{
      stageFilter: string;
      gradeFilter: string;
      subjectFilter: string;
      showOnlyMissing: boolean;
    }>,
    historyMode: "push" | "replace" = "push",
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const mergedState = {
      stageFilter: nextState.stageFilter ?? queryState.stageFilter,
      gradeFilter: nextState.gradeFilter ?? queryState.gradeFilter,
      subjectFilter: nextState.subjectFilter ?? queryState.subjectFilter,
      showOnlyMissing: nextState.showOnlyMissing ?? queryState.showOnlyMissing,
    };

    if (mergedState.stageFilter) {
      params.set("stage", mergedState.stageFilter);
    } else {
      params.delete("stage");
    }

    if (mergedState.gradeFilter) {
      params.set("gradeId", mergedState.gradeFilter);
    } else {
      params.delete("gradeId");
    }

    if (mergedState.subjectFilter) {
      params.set("subjectId", mergedState.subjectFilter);
    } else {
      params.delete("subjectId");
    }

    if (mergedState.showOnlyMissing) {
      params.set("missing", "1");
    } else {
      params.delete("missing");
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
  };

  // Filter grades by stage
  const stageFilteredGrades = useMemo(() => {
    if (!stageFilter) return grades;
    return grades.filter((g) => g.stageId === stageFilter);
  }, [grades, stageFilter]);

  const selectedGrades = useMemo(() => {
    if (!gradeFilter) return stageFilteredGrades;
    return stageFilteredGrades.filter((grade) => grade.id === gradeFilter);
  }, [gradeFilter, stageFilteredGrades]);

  const selectedSubjects = useMemo(() => {
    if (!subjectFilter) return subjects;
    return subjects.filter((subject) => subject.id === subjectFilter);
  }, [subjectFilter, subjects]);

  const stagesData = useMemo(() => {
    const stageIds = new Set(grades.map((grade) => grade.stageId));
    return stages.filter((stage) => stageIds.has(stage.id));
  }, [grades, stages]);

  const stageOptions = [
    { value: "", label: t("filters.all_stages") },
    ...stagesData.map((stage) => ({
      value: stage.id,
      label:
        locale === "ar"
          ? stage.nameAr || stage.nameEn || stage.name
          : stage.nameEn || stage.nameAr || stage.name,
    })),
  ];

  const gradeOptions = [
    { value: "", label: t("filters.all_grades") },
    ...stageFilteredGrades.map((grade) => ({
      value: grade.id,
      label:
        locale === "ar"
          ? grade.nameAr || grade.nameEn || grade.name
          : grade.nameEn || grade.nameAr || grade.name,
    })),
  ];

  const subjectOptions = [
    { value: "", label: t("filters.all_subjects") },
    ...subjects.map((subject) => ({
      value: subject.id,
      label:
        locale === "ar"
          ? subject.nameAr || subject.nameEn || subject.name
          : subject.nameEn || subject.nameAr || subject.name,
    })),
  ];

  useEffect(() => {
    if (!stageFilter) {
      return;
    }

    const isValidStage = stagesData.some((stage) => stage.id === stageFilter);
    if (isValidStage) {
      return;
    }

    syncQueryParams({ stageFilter: "" }, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter, stagesData]);

  useEffect(() => {
    if (!gradeFilter) {
      return;
    }

    const isValidGrade = stageFilteredGrades.some(
      (grade) => grade.id === gradeFilter,
    );
    if (isValidGrade) {
      return;
    }

    syncQueryParams({ gradeFilter: "" }, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeFilter, stageFilteredGrades]);

  useEffect(() => {
    if (!subjectFilter) {
      return;
    }

    const isValidSubject = subjects.some(
      (subject) => subject.id === subjectFilter,
    );
    if (isValidSubject) {
      return;
    }

    syncQueryParams({ subjectFilter: "" }, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, subjects]);

  const filteredGrades = useMemo(() => {
    if (!showOnlyMissing) {
      return selectedGrades;
    }

    return selectedGrades.filter((grade) =>
      selectedSubjects.some((subject) => {
        const allocation = localAllocations.find(
          (item) => item.gradeId === grade.id && item.subjectId === subject.id,
        );
        return (allocation?.weeklyHours || 0) <= 0;
      }),
    );
  }, [showOnlyMissing, selectedGrades, selectedSubjects, localAllocations]);

  const setAllocation = (
    gradeId: string,
    subjectId: string,
    weeklyHours: number,
  ) => {
    const value = Math.max(0, Math.min(80, weeklyHours));

    setLocalAllocations((prev) => {
      const existing = prev.find(
        (a) => a.gradeId === gradeId && a.subjectId === subjectId,
      );

      if (existing) {
        return prev.map((a) =>
          a.gradeId === gradeId && a.subjectId === subjectId
            ? { ...a, weeklyHours: value }
            : a,
        );
      } else {
        return [...prev, { gradeId, subjectId, weeklyHours: value }];
      }
    });
  };

  const getGradeTotal = (gradeId: string): number => {
    return selectedSubjects.reduce((sum, subject) => {
      return sum + getAllocation(gradeId, subject.id);
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await bulkUpsertSubjectAllocations(termId, localAllocations);
      await onRefresh();
      setOriginalAllocations(localAllocations);
      onDirtyChange(false);
    } catch (error) {
      console.error("Failed to save allocations:", error);
      onSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalAllocations(originalAllocations);
    onDirtyChange(false);
  };

  // Export handler
  const handleExport = (format: AcademicsExportFormat) => {
    // Prepare title
    const title = t("title");

    // Prepare metadata
    const metadata: ExportMetadata = {
      yearName,
      termName,
      exportDate: formatExportDate(locale),
    };

    // Add grade filter if selected
    if (stageFilter) {
      const stage = stagesData.find((s) => s.id === stageFilter);
      if (stage) {
        metadata.gradeName = locale === "ar" ? stage.nameAr : stage.nameEn;
      }
    }

    // Prepare columns
    const columns: ExportColumn[] = [
      { key: "grade", label: t("columns.grade") },
      ...selectedSubjects.map((subject) => ({
        key: `subject_${subject.id}`,
        label: locale === "ar" ? subject.nameAr : subject.nameEn,
      })),
    ];

    // Prepare rows
    const rows = filteredGrades.map((grade) => {
      const row: Record<string, unknown> = {
        grade: locale === "ar" ? grade.nameAr : grade.nameEn,
      };

      selectedSubjects.forEach((subject) => {
        const hours = getAllocation(grade.id, subject.id);
        row[`subject_${subject.id}`] = hours || "";
      });

      return row;
    });

    // Generate filename
    const filename = generateExportFilename(
      "subjects-allocation",
      termId,
      stageFilter || undefined,
    );

    // Export with title and metadata
    exportAcademicsData({
      title,
      metadata,
      filename,
      format,
      columns,
      rows,
      locale,
    });
  };

  const completionPercentage = useMemo(() => {
    const totalCells = filteredGrades.length * selectedSubjects.length;
    if (totalCells === 0) return 0;

    const filledCells = filteredGrades.reduce((count, grade) => {
      return (
        count +
        selectedSubjects.filter((subject) => {
          const allocation = localAllocations.find(
            (a) => a.gradeId === grade.id && a.subjectId === subject.id,
          );
          return (allocation?.weeklyHours || 0) > 0;
        }).length
      );
    }, 0);

    return Math.round((filledCells / totalCells) * 100);
  }, [filteredGrades, selectedSubjects, localAllocations]);

  const getCellId = (gradeId: string, subjectId: string) =>
    `${gradeId}-${subjectId}`;

  // Prepare matrix data
  const matrixRows: (MatrixRow & { gradeId: string })[] = useMemo(() => {
    return filteredGrades.map((grade) => ({
      id: grade.id,
      gradeId: grade.id,
      label:
        locale === "ar"
          ? grade.nameAr || grade.nameEn || grade.name
          : grade.nameEn || grade.nameAr || grade.name,
    }));
  }, [filteredGrades, locale]);

  const matrixColumns: (MatrixColumn & { subjectId: string })[] =
    useMemo(() => {
      return selectedSubjects.map((subject) => ({
        id: subject.id,
        subjectId: subject.id,
        label:
          locale === "ar"
            ? subject.nameAr || subject.nameEn || subject.name
            : subject.nameEn || subject.nameAr || subject.name,
        code: subject.code,
      }));
    }, [selectedSubjects, locale]);

  const renderCell = (
    row: MatrixRow & { gradeId: string },
    column: MatrixColumn & { subjectId: string },
  ) => {
    const value = getAllocation(row.gradeId, column.subjectId);
    const originalValue =
      originalAllocations.find(
        (a) => a.gradeId === row.gradeId && a.subjectId === column.subjectId,
      )?.weeklyHours || 0;
    const isChanged = originalValue !== value;
    const cellId = getCellId(row.gradeId, column.subjectId);
    const isFocused = focusedCell === cellId;

    return (
      <div
        className="relative flex items-center justify-center gap-1.5 px-2 py-3 w-full h-full transition-all"
        style={{
          backgroundColor: isChanged
            ? "var(--color-hover-50)"
            : isFocused
              ? "var(--color-primary-200)"
              : isReadOnly
                ? "var(--color-primary-100)"
                : "transparent",
          boxShadow: isFocused
            ? "inset 0 0 0 2px var(--color-primary-500)"
            : "none",
        }}
        onMouseEnter={(e) => {
          if (!isReadOnly && !isFocused && !isChanged) {
            e.currentTarget.style.backgroundColor = "var(--color-primary-200)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isReadOnly && !isFocused && !isChanged) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <input
          type="number"
          min="0"
          max="80"
          step="1"
          value={value || ""}
          onChange={(e) => {
            const val =
              e.target.value === "" ? 0 : parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              setAllocation(row.gradeId, column.subjectId, val);
            }
          }}
          onFocus={() => setFocusedCell(cellId)}
          onBlur={() => setFocusedCell(null)}
          disabled={isReadOnly}
          placeholder="—"
          className="w-12 text-sm text-center border-0 focus:outline-none bg-transparent"
          style={{
            appearance: "textfield",
            MozAppearance: "textfield",
            WebkitAppearance: "none",
            fontFamily: "inherit",
            color: isChanged
              ? "var(--color-accent-900)"
              : value === 0
                ? "var(--color-gray-400)"
                : isReadOnly
                  ? "var(--color-gray-500)"
                  : "var(--foreground)",
            fontWeight: isChanged ? "600" : "normal",
            cursor: isReadOnly ? "not-allowed" : "text",
          }}
        />
        {value > 0 && (
          <span
            className="text-xs text-gray-500 select-none whitespace-nowrap"
            style={{
              color: isChanged
                ? "var(--color-accent-700)"
                : isReadOnly
                  ? "var(--color-gray-400)"
                  : "var(--color-gray-500)",
              fontWeight: isChanged ? "600" : "normal",
            }}
          >
            {periodLabel}
          </span>
        )}
        {isChanged && !isFocused && (
          <div
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--color-accent-500)" }}
            title="Modified"
          />
        )}
      </div>
    );
  };

  const getRowTotal = (row: MatrixRow & { gradeId: string }) => {
    return getGradeTotal(row.gradeId);
  };

  const renderRowTotal = (row: MatrixRow & { gradeId: string }) => {
    const total = getGradeTotal(row.gradeId);
    if (!total) return "—";
    return (
      <span className="inline-flex items-center gap-1.5 justify-center">
        <span>{total}</span>
        <span className="text-xs font-normal text-gray-500 select-none">
          {periodLabel}
        </span>
      </span>
    );
  };

  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-6">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-24 h-24 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("empty_state.no_subjects.title")}
          </h3>
          <p className="text-gray-600">
            {t("empty_state.no_subjects.message")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-gray-50)" }}
    >
      {/* Toolbar */}
      <div
        className="p-4 border-b shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--color-neutral-200)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-primary-900)" }}
          >
            {t("title")}
          </h2>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              disabled={
                isLoading || filteredGrades.length === 0 || subjects.length === 0
              }
            >
              {t("actions.export")}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              disabled={isLoading || !isDirty || isReadOnly}
            >
              {t("actions.reset")}
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              disabled={isLoading || !isDirty || isReadOnly || isSaving}
            >
              {isSaving ? t("actions.saving") : t("actions.save")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-48">
            <Select
              label={t("filters.stage")}
              value={stageFilter}
              onChange={(value) =>
                syncQueryParams({ stageFilter: value, gradeFilter: "" }, "push")
              }
              options={stageOptions}
              selectSize="sm"
            />
          </div>

          <div className="w-48">
            <Select
              label={t("filters.grade")}
              value={gradeFilter}
              onChange={(value) =>
                syncQueryParams({ gradeFilter: value }, "push")
              }
              options={gradeOptions}
              selectSize="sm"
            />
          </div>

          <div className="w-48">
            <Select
              label={t("filters.subject")}
              value={subjectFilter}
              onChange={(value) =>
                syncQueryParams({ subjectFilter: value }, "push")
              }
              options={subjectOptions}
              selectSize="sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyMissing}
              onChange={(e) =>
                syncQueryParams({ showOnlyMissing: e.target.checked }, "push")
              }
              className="rounded"
              style={{ borderColor: "var(--color-border)" }}
            />
            <span style={{ color: "var(--color-gray-700)" }}>
              {t("filters.show_missing")}
            </span>
          </label>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span style={{ color: "var(--color-gray-600)" }}>
              {t("summary.subjects")}:{" "}
            </span>
            <span
              className="font-medium"
              style={{ color: "var(--color-primary-900)" }}
            >
              {selectedSubjects.length}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--color-gray-600)" }}>
              {t("summary.grades")}:{" "}
            </span>
            <span
              className="font-medium"
              style={{ color: "var(--color-primary-900)" }}
            >
              {filteredGrades.length}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--color-gray-600)" }}>
              {t("summary.completion")}:{" "}
            </span>
            <span
              className="font-medium"
              style={{ color: "var(--color-primary-900)" }}
            >
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-4">
          {isLoading ? (
            <AllocationMatrixSkeleton
              ariaLabel="loading"
              columnCount={Math.max(2, Math.min(selectedSubjects.length + 2, 6))}
              rowCount={Math.max(3, Math.min(filteredGrades.length || 5, 8))}
            />
          ) : (
            <AllocationMatrixTable
              rows={matrixRows}
              columns={matrixColumns}
              rowHeaderLabel={t("table.grade")}
              totalColumnLabel={t("table.total")}
              renderCell={renderCell}
              getRowTotal={getRowTotal}
              renderRowTotal={renderRowTotal}
            />
          )}
        </div>
      </div>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("actions.export")}
        subtitle={t("title")}
        datasetCount={filteredGrades.length}
      />
    </div>
  );
}

function AllocationMatrixSkeleton({
  ariaLabel,
  columnCount,
  rowCount,
}: {
  ariaLabel: string;
  columnCount: number;
  rowCount: number;
}) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className="overflow-hidden rounded-lg border border-[var(--color-primary-100)] bg-white shadow-sm"
    >
      <div className="grid animate-pulse" style={{ gridTemplateColumns: `200px repeat(${columnCount}, minmax(140px, 1fr))` }}>
        {Array.from({ length: columnCount + 1 }).map((_, columnIndex) => (
          <div
            key={`header-${columnIndex}`}
            className="border-b border-[var(--color-primary-100)] bg-[var(--color-primary-100)] px-4 py-3"
          >
            <div className="h-4 rounded bg-[var(--color-primary-200)]" />
          </div>
        ))}
        {Array.from({ length: rowCount }).flatMap((_, rowIndex) =>
          Array.from({ length: columnCount + 1 }).map((__, columnIndex) => (
            <div
              key={`row-${rowIndex}-column-${columnIndex}`}
              className="border-b border-[var(--color-primary-100)] px-4 py-4"
            >
              <div
                className="h-5 rounded bg-gray-100"
                style={{ width: columnIndex === 0 ? "70%" : "50%" }}
              />
            </div>
          )),
        )}
      </div>
    </div>
  );
}
