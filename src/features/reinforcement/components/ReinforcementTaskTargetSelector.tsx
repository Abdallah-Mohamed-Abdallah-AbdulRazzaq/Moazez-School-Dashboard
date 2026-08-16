"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { useAuth } from "@/hooks/use-auth";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import type {
  ReinforcementFilterOptions,
  ReinforcementScopeOption,
  ReinforcementTargetPayload,
  ReinforcementTargetScope,
} from "@/features/reinforcement/types";

type Locale = "ar" | "en";

interface TargetOption {
  value: string;
  label: string;
  scopeType: ReinforcementTargetScope;
  searchText?: string;
  enrollmentId?: string;
}

type TargetHierarchyLevel = Exclude<ReinforcementTargetScope, "school">;
type TargetSelection = Partial<Record<ReinforcementTargetScope, string>>;

const targetHierarchy: Record<
  ReinforcementTargetScope,
  TargetHierarchyLevel[]
> = {
  school: [],
  stage: ["stage"],
  grade: ["stage", "grade"],
  section: ["stage", "grade", "section"],
  classroom: ["stage", "grade", "section", "classroom"],
  student: ["stage", "grade", "section", "classroom", "student"],
};

interface NamedOptionRecord {
  id?: string;
  value?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  fullNameAr?: string;
  fullNameEn?: string;
  name_ar?: string;
  name_en?: string;
  full_name_ar?: string;
  full_name_en?: string;
  student_id?: string;
  enrollmentId?: string;
  enrollment?: { id?: string; enrollmentId?: string };
  [key: string]: unknown;
}

export interface ReinforcementTaskTargetSelection extends ReinforcementTargetPayload {
  label?: string;
  enrollmentId?: string;
}

export interface ReinforcementTaskTargetSelectorProps {
  academicYearId?: string;
  termId?: string;
  value?: ReinforcementTaskTargetSelection[];
  onChange: (targets: ReinforcementTaskTargetSelection[]) => void;
  defaultScope?: ReinforcementTargetScope;
  disabled?: boolean;
  className?: string;
}

interface LoadState {
  options: ReinforcementFilterOptions;
  loading: boolean;
  error: string | null;
}

const labels = {
  en: {
    scope: "Target scope",
    target: "Target",
    add: "Add target",
    selected: "Selected targets",
    noTargets: "No targets selected yet.",
    duplicate: "This target is already selected.",
    loading: "Loading target options...",
    error: "Could not load target options.",
    noOptions: "No options available",
    search: "Search...",
    school: "School",
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    student: "Student",
    wholeSchool: "Whole school",
  },
  ar: {
    scope: "نطاق الهدف",
    target: "الهدف",
    add: "إضافة هدف",
    selected: "الأهداف المحددة",
    noTargets: "لا توجد أهداف محددة بعد.",
    duplicate: "هذا الهدف محدد بالفعل.",
    loading: "جارٍ تحميل خيارات الأهداف...",
    error: "تعذر تحميل خيارات الأهداف.",
    noOptions: "لا توجد خيارات متاحة",
    search: "بحث...",
    school: "المدرسة",
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    student: "الطالب",
    wholeSchool: "المدرسة بالكامل",
  },
} satisfies Record<Locale, Record<string, string>>;

const scopeOrder: ReinforcementTargetScope[] = [
  "student",
  "classroom",
  "section",
  "grade",
  "stage",
  "school",
];

const localized = (item: NamedOptionRecord, locale: Locale) =>
  (locale === "ar" ? item.nameAr || item.nameEn : item.nameEn || item.name) ||
  item.name ||
  item.id ||
  "";

const optionValueFor = (item: NamedOptionRecord): string =>
  item.value || item.id || item.student_id || "";

const studentIdFor = (student: NamedOptionRecord): string =>
  student.value || student.id || student.student_id || "";

export const studentLabel = (
  student: NamedOptionRecord,
  locale: Locale,
): string =>
  locale === "ar"
    ? student.full_name_ar ||
      student.fullNameAr ||
      student.nameAr ||
      student.name_ar ||
      student.full_name_en ||
      student.name ||
      studentIdFor(student)
    : student.full_name_en ||
      student.fullNameEn ||
      student.nameEn ||
      student.name_en ||
      student.name ||
      student.full_name_ar ||
      studentIdFor(student);

const enrollmentIdFor = (student?: NamedOptionRecord): string | undefined => {
  return (
    student?.enrollmentId ||
    student?.enrollment?.id ||
    student?.enrollment?.enrollmentId
  );
};

const toSelectOption = (option: TargetOption): SelectOption => ({
  value: option.value,
  label: option.label,
  searchText: option.searchText,
});

const arrayOptionRecords = (
  options: ReinforcementFilterOptions,
  key: keyof ReinforcementFilterOptions,
): NamedOptionRecord[] => {
  const value = options[key];
  return Array.isArray(value) ? (value as NamedOptionRecord[]) : [];
};

const scopeTargetOption = (
  item: ReinforcementScopeOption,
  locale: Locale,
  fallbackLabel?: string,
): TargetOption => {
  const label =
    (locale === "ar"
      ? item.nameAr || item.nameEn
      : item.nameEn || item.nameAr) ||
    fallbackLabel ||
    item.value;
  return {
    value: item.value,
    label,
    scopeType: item.scopeType,
    enrollmentId:
      typeof item.enrollmentId === "string" ? item.enrollmentId : undefined,
    searchText: `${label} ${item.value}`,
  };
};

const fallbackOption = (
  item: NamedOptionRecord,
  scopeType: ReinforcementTargetScope,
  locale: Locale,
): TargetOption | null => {
  const value =
    scopeType === "student" ? studentIdFor(item) : optionValueFor(item);
  if (!value) return null;
  const label =
    scopeType === "student"
      ? studentLabel(item, locale)
      : localized(item, locale);
  return {
    value,
    label,
    scopeType,
    enrollmentId: scopeType === "student" ? enrollmentIdFor(item) : undefined,
    searchText: `${label} ${item.student_id || ""}`,
  };
};

const relationIdFor = (
  item: NamedOptionRecord,
  relation: TargetHierarchyLevel,
): string | undefined => {
  const directValue = item[`${relation}Id`] || item[`${relation}_id`];
  if (typeof directValue === "string") return directValue;

  const nestedValue = item[relation];
  if (nestedValue && typeof nestedValue === "object") {
    const nestedId = (nestedValue as { id?: unknown }).id;
    if (typeof nestedId === "string") return nestedId;
  }

  return undefined;
};

export const filterTargetRecordsByParent = (
  records: NamedOptionRecord[],
  relation: TargetHierarchyLevel,
  parentId?: string,
): NamedOptionRecord[] => {
  if (!parentId) return records;
  return records.filter((record) => {
    const relationId = relationIdFor(record, relation);
    return !relationId || relationId === parentId;
  });
};

const scopeOptionsFor = (
  options: ReinforcementFilterOptions,
  scopeType: ReinforcementTargetScope,
  locale: Locale,
  parentRelation?: TargetHierarchyLevel,
  parentId?: string,
): TargetOption[] => {
  const scoped = options.scopeTargets?.[scopeType];
  if (scoped?.length) {
    return filterTargetRecordsByParent(
      scoped as NamedOptionRecord[],
      parentRelation || "stage",
      parentId,
    )
      .map((item) => fallbackOption(item, scopeType, locale))
      .filter((item): item is TargetOption => Boolean(item));
  }
  const fallbackKey = `${scopeType}s` as keyof ReinforcementFilterOptions;
  return filterTargetRecordsByParent(
    arrayOptionRecords(options, fallbackKey),
    parentRelation || "stage",
    parentId,
  )
    .map((item) => fallbackOption(item, scopeType, locale))
    .filter((item): item is TargetOption => Boolean(item));
};

export default function ReinforcementTaskTargetSelector({
  academicYearId,
  termId,
  value = [],
  onChange,
  defaultScope = "student",
  disabled = false,
  className = "",
}: ReinforcementTaskTargetSelectorProps) {
  const locale = (useLocale() === "ar" ? "ar" : "en") as Locale;
  const { user } = useAuth();
  const schoolId = user?.activeMembership?.schoolId || undefined;
  const copy = labels[locale];
  const isRTL = locale === "ar";
  const [scope, setScope] = useState<ReinforcementTargetScope>(defaultScope);
  const [selection, setSelection] = useState<TargetSelection>({});
  const [duplicateError, setDuplicateError] = useState("");
  const [state, setState] = useState<LoadState>({
    options: {},
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!academicYearId || !termId) {
      Promise.resolve().then(() => {
        setState({ options: {}, loading: false, error: null });
      });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }
    });

    getReinforcementFilterOptions({ academicYearId, termId })
      .then((options) => {
        if (!cancelled) {
          setState({ options, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            options: {},
            loading: false,
            error: error instanceof Error ? error.message : copy.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [academicYearId, copy.error, termId]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setSelection(scope === "school" && schoolId ? { school: schoolId } : {});
    });
    void Promise.resolve().then(() => setDuplicateError(""));
  }, [academicYearId, schoolId, scope, termId]);

  const optionsByScope = useMemo<
    Record<ReinforcementTargetScope, TargetOption[]>
  >(
    () => ({
      school: state.options.scopeTargets?.school?.length
        ? state.options.scopeTargets.school.map((item) =>
            scopeTargetOption(item, locale, copy.wholeSchool),
          )
        : schoolId
          ? [
              {
                value: schoolId,
                label: copy.wholeSchool,
                scopeType: "school" as const,
              },
            ]
          : [],
      stage: scopeOptionsFor(state.options, "stage", locale),
      grade: scopeOptionsFor(
        state.options,
        "grade",
        locale,
        "stage",
        selection.stage,
      ),
      section: scopeOptionsFor(
        state.options,
        "section",
        locale,
        "grade",
        selection.grade,
      ),
      classroom: scopeOptionsFor(
        state.options,
        "classroom",
        locale,
        "section",
        selection.section,
      ),
      student: scopeOptionsFor(
        state.options,
        "student",
        locale,
        "classroom",
        selection.classroom,
      ),
    }),
    [copy.wholeSchool, locale, schoolId, selection, state.options],
  );

  const selectedTargetId =
    selection[scope] || (scope === "school" ? schoolId : "");
  const currentOptions = optionsByScope[scope] || [];
  const scopeOptions = scopeOrder.map((item) => ({
    value: item,
    label: copy[item],
  }));

  const updateSelection = (
    level: ReinforcementTargetScope,
    nextValue: string,
  ) => {
    const levels = targetHierarchy[scope];
    const levelIndex = levels.indexOf(level as TargetHierarchyLevel);
    const nextSelection: TargetSelection = { ...selection, [level]: nextValue };
    levels.slice(levelIndex + 1).forEach((dependentLevel) => {
      delete nextSelection[dependentLevel];
    });
    setSelection(nextSelection);
    setDuplicateError("");
  };

  const addTarget = () => {
    const option = currentOptions.find(
      (item) => item.value === selectedTargetId,
    );
    if (!option) return;

    const exists = value.some(
      (item) => item.scopeType === scope && item.scopeId === option.value,
    );
    if (exists) {
      setDuplicateError(copy.duplicate);
      return;
    }

    setDuplicateError("");
    const finalLevel = targetHierarchy[scope].at(-1);
    if (finalLevel) {
      setSelection((current) => ({ ...current, [finalLevel]: undefined }));
    }
    onChange([
      ...value,
      {
        scopeType: scope,
        scopeId: option.value,
        label: option.label,
        enrollmentId: option.enrollmentId,
      },
    ]);
  };

  const removeTarget = (target: ReinforcementTaskTargetSelection) => {
    onChange(
      value.filter(
        (item) =>
          item.scopeType !== target.scopeType ||
          item.scopeId !== target.scopeId,
      ),
    );
  };

  return (
    <section
      className={`space-y-4 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      aria-busy={state.loading}
    >
      {state.loading && (
        <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{copy.loading}</span>
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 md:items-end">
        <Select
          label={copy.scope}
          value={scope}
          disabled={disabled}
          options={scopeOptions}
          onChange={(nextScope) => {
            const nextScopeValue = nextScope as ReinforcementTargetScope;
            setScope(nextScopeValue);
            setSelection(
              nextScopeValue === "school" && schoolId
                ? { school: schoolId }
                : {},
            );
            setDuplicateError("");
          }}
        />
        {scope === "school" && (
          <Select
            label={copy.target}
            value={selectedTargetId || ""}
            disabled={disabled || state.loading || !academicYearId || !termId}
            options={currentOptions.map(toSelectOption)}
            searchable
            searchPlaceholder={copy.search}
            noOptionsText={copy.noOptions}
            error={duplicateError}
            onChange={(nextValue) => updateSelection("school", nextValue)}
          />
        )}
        {targetHierarchy[scope].map((level, index) => {
          const parentLevel = targetHierarchy[scope][index - 1];
          const parentSelected =
            !parentLevel || Boolean(selection[parentLevel]);
          return (
            <Select
              key={level}
              label={copy[level]}
              value={selection[level] || ""}
              disabled={
                disabled ||
                state.loading ||
                !academicYearId ||
                !termId ||
                !parentSelected
              }
              options={optionsByScope[level].map(toSelectOption)}
              searchable
              searchPlaceholder={copy.search}
              noOptionsText={copy.noOptions}
              error={duplicateError}
              onChange={(nextValue) => updateSelection(level, nextValue)}
            />
          );
        })}
        <Button
          type="button"
          variant="primary"
          disabled={disabled || !selectedTargetId}
          onClick={addTarget}
          className="h-10"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {copy.add}
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">
          {copy.selected}
        </h3>
        {value.length === 0 ? (
          <p className="text-sm text-gray-500">{copy.noTargets}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((target) => (
              <span
                key={`${target.scopeType}:${target.scopeId}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary"
              >
                <span>
                  {copy[target.scopeType]}: {target.label || target.scopeId}
                </span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-primary/10"
                  onClick={() => removeTarget(target)}
                  disabled={disabled}
                  aria-label="Remove target"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
