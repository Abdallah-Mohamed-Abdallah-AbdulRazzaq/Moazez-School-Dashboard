"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronRight, X } from "lucide-react";
import { useLocale } from "next-intl";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import {
  type AcademicStructureClassroom,
  type AcademicStructureGrade,
  type AcademicStructureSection,
  type AcademicStructureStage,
  type AcademicStructureTree,
} from "@/features/academics/services/academicStructureApiService";
import {
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type { StudentWithEnrollmentContext } from "@/features/students-guardians/students/services/studentsService";
import type { ReinforcementFilterOptions } from "../types";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";

type Locale = "ar" | "en";

interface NamedRecord {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  [key: string]: unknown;
}

export interface ReinforcementAcademicContextValue {
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  studentId?: string;
  scopeKey?: string;
  enrollmentId?: string;
}

export interface ReinforcementAcademicContextSelection extends ReinforcementAcademicContextValue {
  academicYear?: NamedRecord;
  term?: NamedRecord;
  stage?: AcademicStructureStage;
  grade?: AcademicStructureGrade;
  section?: AcademicStructureSection;
  classroom?: AcademicStructureClassroom;
  subject?: Subject;
  student?: StudentWithEnrollmentContext;
}

export interface ReinforcementAcademicContextFilterProps {
  value?: ReinforcementAcademicContextValue;
  onChange: (selection: ReinforcementAcademicContextSelection) => void;
  className?: string;
  disabled?: boolean;
  showSubject?: boolean;
  showStudent?: boolean;
  showStructure?: boolean;
  showAcademicYearTerm?: boolean;
  showStage?: boolean;
  showGrade?: boolean;
  showSection?: boolean;
  showClassroom?: boolean;
  subjectDependsOnGrade?: boolean;
  filterOptions?: ReinforcementFilterOptions;
}

interface LoadState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = "reinforcement-academic-context";

const labels = {
  en: {
    academicYear: "Academic year",
    term: "Term",
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    subject: "Subject",
    student: "Student",
    select: "Select",
    search: "Search...",
    noOptions: "No options available",
    loading: "Loading context options...",
    empty: "No context options are available.",
    error: "Could not load context options.",
    reset: "Reset",
  },
  ar: {
    academicYear: "العام الدراسي",
    term: "الفصل الدراسي",
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    subject: "المادة",
    student: "الطالب",
    select: "اختر",
    search: "بحث...",
    noOptions: "لا توجد خيارات متاحة",
    loading: "جارٍ تحميل خيارات السياق...",
    empty: "لا توجد خيارات سياق متاحة.",
    error: "تعذر تحميل خيارات السياق.",
    reset: "إعادة تعيين",
  },
} satisfies Record<Locale, Record<string, string>>;

const emptyTree: AcademicStructureTree = {
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
};

const getString = (record: unknown, keys: string[]): string | undefined => {
  if (!record || typeof record !== "object") return undefined;
  const source = record as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
};

const getId = (record: unknown): string =>
  getString(record, ["id", "academicYearId", "yearId", "termId", "studentId"]) ||
  "";

const getLocalizedName = (record: unknown, locale: Locale): string => {
  const primaryKeys =
    locale === "ar"
      ? ["nameAr", "titleAr", "full_name_ar", "fullNameAr", "name"]
      : ["nameEn", "titleEn", "full_name_en", "fullNameEn", "name"];
  return (
    getString(record, primaryKeys) ||
    getString(record, ["name", "title", "label", "code", "id"]) ||
    ""
  );
};

const toOption = (record: unknown, locale: Locale): SelectOption | null => {
  const value = getId(record);
  if (!value) return null;
  const label = getLocalizedName(record, locale) || value;
  return {
    value,
    label,
    searchText: `${label} ${getLocalizedName(record, locale === "ar" ? "en" : "ar")}`,
  };
};

const compactOptions = (options: Array<SelectOption | null>): SelectOption[] =>
  options.filter((option): option is SelectOption => Boolean(option));

export const subjectsForStage = (
  allocations: SubjectAllocation[],
  grades: AcademicStructureGrade[],
  stageId?: string,
  gradeId?: string,
): Subject[] => {
  const stageGradeIds = new Set(
    grades
      .filter(
        (grade) =>
          (!stageId || grade.stageId === stageId) &&
          (!gradeId || grade.id === gradeId),
      )
      .map((grade) => grade.id),
  );
  const subjectsById = new Map<string, Subject>();

  allocations.forEach((allocation) => {
    if (!stageGradeIds.has(allocation.gradeId) || !allocation.subject) return;
    subjectsById.set(allocation.subject.id, {
      id: allocation.subject.id,
      name: allocation.subject.nameEn || allocation.subject.nameAr,
      nameAr: allocation.subject.nameAr,
      nameEn: allocation.subject.nameEn,
      code: allocation.subject.code,
      color: allocation.subject.color,
      isActive: true,
    });
  });

  return Array.from(subjectsById.values());
};

const studentIdFor = (student: StudentWithEnrollmentContext): string =>
  student.id || student.student_id || "";

const enrollmentIdFor = (
  student?: StudentWithEnrollmentContext,
): string | undefined => {
  const enrollment = student?.enrollment as
    | (StudentWithEnrollmentContext["enrollment"] & { id?: string })
    | undefined;
  return enrollment?.id || enrollment?.enrollmentId;
};

const studentOption = (
  student: StudentWithEnrollmentContext,
  locale: Locale,
): SelectOption | null => {
  const value = studentIdFor(student);
  if (!value) return null;
  const label =
    locale === "ar"
      ? student.full_name_ar || student.full_name_en || student.name || value
      : student.full_name_en || student.name || student.full_name_ar || value;
  return {
    value,
    label,
    searchText: `${student.full_name_en || ""} ${student.full_name_ar || ""} ${student.student_id || ""}`,
  };
};

const studentMatchesContext = (
  student: StudentWithEnrollmentContext,
  value: ReinforcementAcademicContextValue,
): boolean => {
  const record = student as StudentWithEnrollmentContext & Record<string, unknown>;
  const enrollment = (student.enrollment || {}) as Record<string, unknown>;
  const relationId = (key: string) =>
    String(record[key] || enrollment[key] || "");

  return (
    (!value.stageId || relationId("stageId") === value.stageId) &&
    (!value.gradeId || relationId("gradeId") === value.gradeId) &&
    (!value.sectionId || relationId("sectionId") === value.sectionId) &&
    (!value.classroomId || relationId("classroomId") === value.classroomId)
  );
};

export const isStudentSelectorDisabled = ({
  disabled,
  loading,
  classroomId,
}: {
  disabled: boolean;
  loading: boolean;
  classroomId?: string;
}) => disabled || loading || !classroomId;

/* ─── Skeleton placeholder ─── */
function SelectSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full" />
    </div>
  );
}

/* ─── Breadcrumb ─── */
function CascadeBreadcrumb({
  items,
  isRTL,
}: {
  items: { label: string; value: string }[];
  isRTL: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Selection breadcrumb"
      className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-2"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          )}
          <span className="font-medium text-gray-700">{item.value}</span>
        </span>
      ))}
    </nav>
  );
}

/* ─── localStorage helpers ─── */
function loadPersistedContext(): Pick<
  ReinforcementAcademicContextValue,
  "academicYearId" | "termId"
> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        academicYearId: parsed.academicYearId || undefined,
        termId: parsed.termId || undefined,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function persistContext(academicYearId?: string, termId?: string) {
  try {
    if (academicYearId || termId) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ academicYearId, termId }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export default function ReinforcementAcademicContextFilter({
  value = {},
  onChange,
  className = "",
  disabled = false,
  showSubject = true,
  showStudent = true,
  showStructure = true,
  showAcademicYearTerm = true,
  showStage = true,
  showGrade = true,
  showSection = true,
  showClassroom = true,
  subjectDependsOnGrade = false,
  filterOptions,
}: ReinforcementAcademicContextFilterProps) {
  const locale = (useLocale() === "ar" ? "ar" : "en") as Locale;
  const copy = labels[locale];
  const isRTL = locale === "ar";
  const restoredRef = useRef(false);

  const [years, setYears] = useState<LoadState<NamedRecord[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const [terms, setTerms] = useState<LoadState<NamedRecord[]>>({
    data: [],
    loading: false,
    error: null,
  });
  const [tree, setTree] = useState<LoadState<AcademicStructureTree>>({
    data: emptyTree,
    loading: false,
    error: null,
  });
  const [subjectAllocations, setSubjectAllocations] = useState<
    LoadState<SubjectAllocation[]>
  >({
    data: [],
    loading: false,
    error: null,
  });
  const [students, setStudents] = useState<
    LoadState<StudentWithEnrollmentContext[]>
  >({
    data: [],
    loading: false,
    error: null,
  });
  const [loadedFilterOptions, setLoadedFilterOptions] =
    useState<ReinforcementFilterOptions | null>(null);
  const resolvedFilterOptions = filterOptions || loadedFilterOptions;

  useEffect(() => {
    if (!filterOptions) {
      void Promise.resolve().then(() => setLoadedFilterOptions(null));
    }
  }, [filterOptions, value.academicYearId, value.termId]);

  /* ─── Build the selection object ─── */
  const buildSelection = useCallback(
    (
      next: ReinforcementAcademicContextValue,
    ): ReinforcementAcademicContextSelection => {
      const nextStudent = students.data.find(
        (item) => studentIdFor(item) === next.studentId,
      );
      return {
        ...next,
        enrollmentId: next.enrollmentId || enrollmentIdFor(nextStudent),
        academicYear: years.data.find(
          (item) => getId(item) === next.academicYearId,
        ),
        term: terms.data.find((item) => getId(item) === next.termId),
        stage: tree.data.stages.find((item) => item.id === next.stageId),
        grade: tree.data.grades.find((item) => item.id === next.gradeId),
        section: tree.data.sections.find((item) => item.id === next.sectionId),
        classroom: tree.data.classrooms.find(
          (item) => item.id === next.classroomId,
        ),
        subject: subjectsForStage(
          subjectAllocations.data,
          tree.data.grades,
          next.stageId,
          subjectDependsOnGrade ? next.gradeId : undefined,
        ).find((item) => item.id === next.subjectId),
        student: nextStudent,
      };
    },
    [
      subjectAllocations.data,
      subjectDependsOnGrade,
      students.data,
      terms.data,
      tree.data,
      years.data,
    ],
  );

  const emit = useCallback(
    (patch: ReinforcementAcademicContextValue) => {
      const next: ReinforcementAcademicContextValue = { ...value, ...patch };
      onChange(buildSelection(next));
    },
    [buildSelection, onChange, value],
  );

  /* ─── Persist year+term to localStorage ─── */
  useEffect(() => {
    if (!showAcademicYearTerm) {
      void Promise.resolve().then(() => {
        setYears({ data: [], loading: false, error: null });
      });
      return;
    }

    persistContext(value.academicYearId, value.termId);
  }, [showAcademicYearTerm, value.academicYearId, value.termId]);

  /* ─── Restore from localStorage on mount ─── */
  useEffect(() => {
    if (!showAcademicYearTerm || restoredRef.current) return;
    restoredRef.current = true;
    const hasValue = value.academicYearId || value.termId;
    if (hasValue) return;
    const persisted = loadPersistedContext();
    if (persisted?.academicYearId) {
      onChange(
        buildSelection({
          academicYearId: persisted.academicYearId,
          termId: persisted.termId,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAcademicYearTerm]);

  /* ─── Fetch academic years ─── */
  useEffect(() => {
    if (resolvedFilterOptions) {
      void Promise.resolve().then(() => {
        setYears({
          data: (resolvedFilterOptions.academicYears || []) as NamedRecord[],
          loading: false,
          error: null,
        });
      });
      return;
    }
    void Promise.resolve().then(() => {
      setYears((current) => ({ ...current, loading: true, error: null }));
    });
  }, [copy.error, resolvedFilterOptions, showAcademicYearTerm]);

  /* ─── Fetch terms ─── */
  useEffect(() => {
    if (resolvedFilterOptions) {
      void Promise.resolve().then(() => {
        setTerms({
          data: (resolvedFilterOptions.terms || []) as NamedRecord[],
          loading: false,
          error: null,
        });
      });
      return;
    }

    if (!value.academicYearId || !value.termId) {
      void Promise.resolve().then(() => {
        setTerms({ data: [], loading: false, error: null });
      });
      return;
    }

    void Promise.resolve().then(() => {
      setTerms((current) => ({ ...current, loading: true, error: null }));
    });
    return;
  }, [
    copy.error,
    resolvedFilterOptions,
    showAcademicYearTerm,
    value.academicYearId,
    value.termId,
  ]);

  /* ─── Fetch tree, subjects, students ─── */
  useEffect(() => {
    if (resolvedFilterOptions) {
      void Promise.resolve().then(() => {
        setYears({
          data: (resolvedFilterOptions.academicYears || []) as NamedRecord[],
          loading: false,
          error: null,
        });
        setTerms({
          data: (resolvedFilterOptions.terms || []) as NamedRecord[],
          loading: false,
          error: null,
        });
        setTree({
          data: {
            stages: (resolvedFilterOptions.stages ||
              []) as AcademicStructureStage[],
            grades: (resolvedFilterOptions.grades ||
              []) as AcademicStructureGrade[],
            sections: (resolvedFilterOptions.sections ||
              []) as AcademicStructureSection[],
            classrooms: (resolvedFilterOptions.classrooms ||
              []) as AcademicStructureClassroom[],
          },
          loading: false,
          error: null,
        });
        setStudents({
          data: (resolvedFilterOptions.students ||
            []) as StudentWithEnrollmentContext[],
          loading: false,
          error: null,
        });
      });
      return;
    }

    if (!value.academicYearId || !value.termId) {
      void Promise.resolve().then(() => {
        setTree({ data: emptyTree, loading: false, error: null });
        setSubjectAllocations({ data: [], loading: false, error: null });
        setStudents({ data: [], loading: false, error: null });
      });
      return;
    }
    if (resolvedFilterOptions) return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      setTree((current) => ({ ...current, loading: true, error: null }));
      setStudents((current) => ({ ...current, loading: true, error: null }));
    });
    getReinforcementFilterOptions({
      academicYearId: value.academicYearId,
      termId: value.termId,
    })
      .then((options) => {
        if (!cancelled) setLoadedFilterOptions(options);
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : copy.error;
          setTree({ data: emptyTree, loading: false, error: message });
          setStudents({ data: [], loading: false, error: message });
        }
      });

    return () => { cancelled = true; };
  }, [
    copy.error,
    resolvedFilterOptions,
    showStructure,
    showStudent,
    showSubject,
    value.academicYearId,
    value.termId,
  ]);

  /* Subject availability is owned by term allocations.  The selected grade
   * narrows those allocations, and its stage is validated through the
   * academic-structure tree in subjectsForStage. */
  useEffect(() => {
    if (!showSubject || !value.termId) {
      void Promise.resolve().then(() => {
        setSubjectAllocations({ data: [], loading: false, error: null });
      });
      return;
    }

    let cancelled = false;
      void Promise.resolve().then(() => {
        setSubjectAllocations({ data: [], loading: true, error: null });
      });
    fetchSubjectAllocations(value.termId)
      .then((allocations) => {
        if (!cancelled) {
          setSubjectAllocations({ data: allocations, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSubjectAllocations({
            data: [],
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [copy.error, showSubject, value.termId]);

  const filteredSubjects = useMemo(
    () =>
      subjectsForStage(
        subjectAllocations.data,
        tree.data.grades,
        value.stageId,
        subjectDependsOnGrade ? value.gradeId : undefined,
      ),
    [
      subjectAllocations.data,
      subjectDependsOnGrade,
      tree.data.grades,
      value.gradeId,
      value.stageId,
    ],
  );

  useEffect(() => {
    if (
      tree.loading ||
      subjectAllocations.loading ||
      !value.subjectId ||
      filteredSubjects.some((subject) => subject.id === value.subjectId)
    ) {
      return;
    }

    emit({ subjectId: undefined });
  }, [
    emit,
    filteredSubjects,
    subjectAllocations.loading,
    tree.loading,
    value.subjectId,
  ]);

  const filteredGrades = tree.data.grades.filter(
    (grade) => !value.stageId || grade.stageId === value.stageId,
  );
  const filteredSections = tree.data.sections.filter(
    (section) => !value.gradeId || section.gradeId === value.gradeId,
  );
  const filteredClassrooms = tree.data.classrooms.filter(
    (classroom) => !value.sectionId || classroom.sectionId === value.sectionId,
  );

  const filteredStudents = useMemo(
    () =>
      students.data.filter((student) =>
        studentMatchesContext(student, {
          stageId: value.stageId,
          gradeId: value.gradeId,
          sectionId: value.sectionId,
          classroomId: value.classroomId,
        }),
      ),
    [students.data, value.classroomId, value.gradeId, value.sectionId, value.stageId],
  );

  useEffect(() => {
    if (!value.studentId || filteredStudents.some((student) => studentIdFor(student) === value.studentId)) {
      return;
    }
    emit({ studentId: undefined, enrollmentId: undefined });
  }, [emit, filteredStudents, value.studentId]);

  /* ─── Derived state ─── */
  const selected = useMemo<ReinforcementAcademicContextSelection>(
    () => buildSelection(value),
    [buildSelection, value],
  );

  const hasAnySelection = Boolean(
    value.academicYearId ||
    value.termId ||
    value.stageId ||
    value.gradeId ||
    value.sectionId ||
    value.classroomId ||
    value.subjectId ||
    value.studentId,
  );

  const showSecondarySelects = Boolean(
    showStructure && value.academicYearId && value.termId,
  );

  const loading =
    years.loading ||
    terms.loading ||
    tree.loading ||
    subjectAllocations.loading ||
    students.loading;
  const error =
    years.error ||
    terms.error ||
    tree.error ||
    subjectAllocations.error ||
    students.error;
  const isEmpty = !loading && !error && years.data.length === 0;

  /* ─── Breadcrumb items ─── */
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (selected.academicYear) {
      items.push({
        label: copy.academicYear,
        value: getLocalizedName(selected.academicYear, locale),
      });
    }
    if (selected.term) {
      items.push({
        label: copy.term,
        value: getLocalizedName(selected.term, locale),
      });
    }
    if (selected.stage) {
      items.push({
        label: copy.stage,
        value: getLocalizedName(selected.stage, locale),
      });
    }
    if (selected.grade) {
      items.push({
        label: copy.grade,
        value: getLocalizedName(selected.grade, locale),
      });
    }
    if (selected.section) {
      items.push({
        label: copy.section,
        value: getLocalizedName(selected.section, locale),
      });
    }
    if (selected.classroom) {
      items.push({
        label: copy.classroom,
        value: getLocalizedName(selected.classroom, locale),
      });
    }
    if (selected.subject) {
      items.push({
        label: copy.subject,
        value: getLocalizedName(selected.subject, locale),
      });
    }
    if (selected.student) {
      items.push({
        label: copy.student,
        value: getLocalizedName(selected.student, locale),
      });
    }
    return items;
  }, [selected, copy, locale]);

  /* ─── Reset handler ─── */
  const handleReset = () => {
    if (!showAcademicYearTerm) {
      onChange(
        buildSelection({
          academicYearId: value.academicYearId,
          termId: value.termId,
          stageId: undefined,
          gradeId: undefined,
          sectionId: undefined,
          classroomId: undefined,
          subjectId: undefined,
          studentId: undefined,
          enrollmentId: undefined,
        }),
      );
      return;
    }

    persistContext(undefined, undefined);
    onChange(
      buildSelection({
        academicYearId: undefined,
        termId: undefined,
        stageId: undefined,
        gradeId: undefined,
        sectionId: undefined,
        classroomId: undefined,
        subjectId: undefined,
        studentId: undefined,
        enrollmentId: undefined,
      }),
    );
  };

  return (
    <section
      className={`space-y-3 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      aria-busy={loading}
    >
      {/* Status banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error || copy.error}</span>
        </div>
      )}
      {isEmpty && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {copy.empty}
        </div>
      )}

      {/* Breadcrumb + Reset */}
      {(breadcrumbItems.length > 0 || hasAnySelection) && (
        <div className="flex items-center justify-between gap-2">
          <CascadeBreadcrumb items={breadcrumbItems} isRTL={isRTL} />
          {hasAnySelection && (
            <button
              type="button"
              onClick={handleReset}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title={copy.reset}
            >
              <X className="h-3 w-3" />
              <span>{copy.reset}</span>
            </button>
          )}
        </div>
      )}

      {/* Primary selects: Year + Term (always shown) */}
      {showAcademicYearTerm && (
        <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2">
        {years.loading ? (
          <SelectSkeleton label={copy.academicYear} />
        ) : (
          <Select
            label={copy.academicYear}
            value={value.academicYearId || ""}
            disabled={disabled || years.loading}
            options={compactOptions(
              years.data.map((item) => toOption(item, locale)),
            )}
            placeholder={`${copy.select} ${copy.academicYear}`}
            searchable
            searchPlaceholder={copy.search}
            noOptionsText={copy.noOptions}
            onChange={(academicYearId) =>
              emit({
                academicYearId,
                termId: undefined,
                stageId: undefined,
                gradeId: undefined,
                sectionId: undefined,
                classroomId: undefined,
                subjectId: undefined,
                studentId: undefined,
                enrollmentId: undefined,
              })
            }
          />
        )}

        {value.academicYearId && terms.loading ? (
          <SelectSkeleton label={copy.term} />
        ) : (
          <Select
            label={copy.term}
            value={value.termId || ""}
            disabled={disabled || !value.academicYearId || terms.loading}
            options={compactOptions(
              terms.data.map((item) => toOption(item, locale)),
            )}
            placeholder={`${copy.select} ${copy.term}`}
            searchable
            searchPlaceholder={copy.search}
            noOptionsText={copy.noOptions}
            onChange={(termId) =>
              emit({
                termId,
                stageId: undefined,
                gradeId: undefined,
                sectionId: undefined,
                classroomId: undefined,
                subjectId: undefined,
                studentId: undefined,
                enrollmentId: undefined,
              })
            }
          />
        )}
        </div>
      )}

      {/* Secondary selects: Stage/Grade/Section/Classroom (after Term selected) */}
      {showSecondarySelects && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tree.loading ? (
            <>
              {showStage && <SelectSkeleton label={copy.stage} />}
              {showGrade && <SelectSkeleton label={copy.grade} />}
              {showSection && <SelectSkeleton label={copy.section} />}
              {showClassroom && <SelectSkeleton label={copy.classroom} />}
            </>
          ) : (
            <>
              {showStage && <Select
                label={copy.stage}
                value={value.stageId || ""}
                disabled={disabled || tree.loading}
                options={compactOptions(
                  tree.data.stages.map((item) => toOption(item, locale)),
                )}
                placeholder={`${copy.select} ${copy.stage}`}
                searchable
                searchPlaceholder={copy.search}
                noOptionsText={copy.noOptions}
                onChange={(stageId) =>
                  emit({
                    stageId,
                    gradeId: undefined,
                    sectionId: undefined,
                    classroomId: undefined,
                    studentId: undefined,
                    enrollmentId: undefined,
                  })
                }
              />}
              {showGrade && <Select
                label={copy.grade}
                value={value.gradeId || ""}
                disabled={disabled || tree.loading || !value.stageId}
                options={compactOptions(
                  filteredGrades.map((item) => toOption(item, locale)),
                )}
                placeholder={`${copy.select} ${copy.grade}`}
                searchable
                searchPlaceholder={copy.search}
                noOptionsText={copy.noOptions}
                onChange={(gradeId) =>
                  emit({
                    gradeId,
                    sectionId: undefined,
                    classroomId: undefined,
                    studentId: undefined,
                    enrollmentId: undefined,
                  })
                }
              />}

              {showSection && <Select
                label={copy.section}
                value={value.sectionId || ""}
                disabled={disabled || tree.loading || !value.gradeId}
                options={compactOptions(
                  filteredSections.map((item) => toOption(item, locale)),
                )}
                placeholder={`${copy.select} ${copy.section}`}
                searchable
                searchPlaceholder={copy.search}
                noOptionsText={copy.noOptions}
                onChange={(sectionId) =>
                  emit({
                    sectionId,
                    classroomId: undefined,
                    studentId: undefined,
                    enrollmentId: undefined,
                  })
                }
              />}
              {showClassroom && <Select
                label={copy.classroom}
                value={value.classroomId || ""}
                disabled={disabled || tree.loading || !value.sectionId}
                options={compactOptions(
                  filteredClassrooms.map((item) => toOption(item, locale)),
                )}
                placeholder={`${copy.select} ${copy.classroom}`}
                searchable
                searchPlaceholder={copy.search}
                noOptionsText={copy.noOptions}
                onChange={(classroomId) => emit({ classroomId })}
              />}
            </>
          )}

          {/* Subject + Student (after Term selected, if props allow) */}
          {showSubject &&
            (subjectAllocations.loading ? (
              <SelectSkeleton label={copy.subject} />
            ) : (
              <Select
                label={copy.subject}
                value={value.subjectId || ""}
                disabled={
                  disabled ||
                  subjectAllocations.loading ||
                  !value.stageId ||
                  (subjectDependsOnGrade && !value.gradeId)
                }
                options={compactOptions(
                  filteredSubjects.map((item) => toOption(item, locale)),
                )}
                placeholder={`${copy.select} ${copy.subject}`}
                searchable
                searchPlaceholder={copy.search}
                noOptionsText={copy.noOptions}
                onChange={(subjectId) => emit({ subjectId })}
              />
            ))}
          {showStudent &&
            (students.loading ? (
              <SelectSkeleton label={copy.student} />
            ) : (
              <Select
                label={copy.student}
                value={selected.studentId || ""}
                disabled={isStudentSelectorDisabled({
                  disabled,
                  loading: students.loading,
                  classroomId: value.classroomId,
                })}
                options={compactOptions(
                  filteredStudents.map((item) => studentOption(item, locale)),
                )}
                placeholder={`${copy.select} ${copy.student}`}
                searchable
                searchPlaceholder={copy.search}
                noOptionsText={copy.noOptions}
                onChange={(studentId) => {
                  const student = filteredStudents.find(
                    (item) => studentIdFor(item) === studentId,
                  );
                  emit({ studentId, enrollmentId: enrollmentIdFor(student) });
                }}
              />
            ))}
        </div>
      )}
    </section>
  );
}
