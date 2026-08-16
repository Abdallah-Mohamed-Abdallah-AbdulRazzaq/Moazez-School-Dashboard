"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Medal,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, EmptyState, KPICardV2, Select } from "@/components/ui";
import DatePicker from "@/components/ui/input/DatePicker";
import type { SelectOption } from "@/components/ui/input/Select";
import { isApiError } from "@/lib/api-error";
import { useAcademicYearTermContext } from "@/features/academics/hooks/useAcademicYearTermContext";
import {
  fetchAcademicStructureTree,
  type AcademicStructureClassroom,
  type AcademicStructureGrade,
  type AcademicStructureSection,
  type AcademicStructureStage,
} from "@/features/academics/services/academicStructureApiService";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import type {
  Student,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import { heroJourneySectionBanners } from "../config/heroJourneySectionBanners";
import { getHeroJourneyOverview } from "../services/heroJourneyService";
import type {
  HeroJourneyOverviewActivity,
  HeroJourneyOverviewMetrics,
  HeroJourneyOverviewTopStudent,
} from "../types";
import HeroJourneyPageHeader from "./HeroJourneyPageHeader";

type DateRangePreset = "today" | "7" | "30" | "custom";

type ScopeFilters = {
  dateRange: DateRangePreset;
  dateFrom: string;
  dateTo: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  studentId: string;
};

const progressColors = {
  notStarted: "bg-slate-300",
  inProgress: "bg-sky-400",
  completed: "bg-teal-500",
  cancelled: "bg-amber-400",
} as const;

const eventIcons = {
  mission_started: Activity,
  objective_completed: ClipboardCheck,
  mission_completed: CheckCircle2,
  xp_granted: Sparkles,
  badge_awarded: Award,
} as const;

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDatePickerValue = (value: string) =>
  value ? new Date(`${value}T00:00:00`) : null;

const buildDefaultFilters = (): ScopeFilters => {
  const today = new Date();
  const dateFrom = new Date(today);
  dateFrom.setDate(today.getDate() - 29);

  return {
    dateRange: "30",
    dateFrom: toIsoDate(dateFrom),
    dateTo: toIsoDate(today),
    stageId: "",
    gradeId: "",
    sectionId: "",
    classroomId: "",
    studentId: "",
  };
};

const getLocalizedName = (
  item:
    | AcademicStructureStage
    | AcademicStructureGrade
    | AcademicStructureSection
    | AcademicStructureClassroom
    | null
    | undefined,
  locale: string,
) => {
  if (!item) return "";
  if (locale === "ar") return item.nameAr || item.name || item.nameEn || "";
  return item.nameEn || item.name || item.nameAr || "";
};

const getStudentDisplayName = (
  student: Student | undefined,
  locale: string,
) => {
  if (!student) return "";
  if (locale === "ar") {
    return (
      student.full_name_ar || student.name || student.full_name_en || student.id
    );
  }
  return (
    student.full_name_en || student.name || student.full_name_ar || student.id
  );
};

const formatNumber = (value: number, locale: string) =>
  new Intl.NumberFormat(locale).format(value);

const formatPercent = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value);

function updateDateRange(
  preset: DateRangePreset,
  current: ScopeFilters,
): ScopeFilters {
  if (preset === "custom") {
    return { ...current, dateRange: preset };
  }

  const today = new Date();
  const dateFrom = new Date(today);
  if (preset === "7") {
    dateFrom.setDate(today.getDate() - 6);
  } else if (preset === "30") {
    dateFrom.setDate(today.getDate() - 29);
  }

  return {
    ...current,
    dateRange: preset,
    dateFrom: toIsoDate(preset === "today" ? today : dateFrom),
    dateTo: toIsoDate(today),
  };
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-10" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-64" />
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-gray-500">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SegmentedBar({
  items,
}: {
  items: Array<{
    key: string;
    label: string;
    value: number;
    className: string;
  }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
        {items.map((item) => (
          <div
            key={item.key}
            className={item.className}
            style={{
              width:
                total > 0
                  ? `${Math.max((item.value / total) * 100, 3)}%`
                  : "0%",
            }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-gray-600">
              <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionStatusDonut({
  overview,
  locale,
  labels,
}: {
  overview: HeroJourneyOverviewMetrics;
  locale: string;
  labels: {
    missions: string;
    published: string;
    draft: string;
    archived: string;
    withXpReward: string;
    withBadgeReward: string;
    withoutRewards: string;
  };
}) {
  const total = Math.max(overview.missions.total, 0);
  const publishedPercent =
    total > 0 ? (overview.missions.published / total) * 100 : 0;
  const draftPercent = total > 0 ? (overview.missions.draft / total) * 100 : 0;
  const archivedPercent =
    total > 0 ? (overview.missions.archived / total) * 100 : 0;
  const rewardless = Math.max(
    overview.missions.total -
      Math.max(
        overview.missions.withBadgeReward,
        overview.missions.withXpReward,
      ),
    0,
  );
  const background = `conic-gradient(#10b981 0 ${publishedPercent}%, #94a3b8 ${publishedPercent}% ${publishedPercent + draftPercent}%, #f59e0b ${publishedPercent + draftPercent}% ${publishedPercent + draftPercent + archivedPercent}%, #e5e7eb 0)`;

  return (
    <div className="grid gap-5 md:grid-cols-[160px_1fr]">
      <div
        className="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
        style={{ background }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
          <span className="text-2xl font-bold text-gray-900">
            {formatNumber(total, locale)}
          </span>
          <span className="text-xs text-gray-500">{labels.missions}</span>
        </div>
      </div>
      <div className="space-y-3">
        <SegmentedBar
          items={[
            {
              key: "published",
              label: labels.published,
              value: overview.missions.published,
              className: "bg-emerald-500",
            },
            {
              key: "draft",
              label: labels.draft,
              value: overview.missions.draft,
              className: "bg-slate-400",
            },
            {
              key: "archived",
              label: labels.archived,
              value: overview.missions.archived,
              className: "bg-amber-400",
            },
          ]}
        />
        <div className="grid gap-2 pt-2 text-sm text-gray-600 sm:grid-cols-3">
          <span>{`${labels.withXpReward}: ${formatNumber(overview.missions.withXpReward, locale)}`}</span>
          <span>{`${labels.withBadgeReward}: ${formatNumber(overview.missions.withBadgeReward, locale)}`}</span>
          <span>{`${labels.withoutRewards}: ${formatNumber(rewardless, locale)}`}</span>
        </div>
      </div>
    </div>
  );
}

function TopStudentsList({
  students,
  locale,
  onStudentClick,
  emptyMessage,
  labels,
}: {
  students: HeroJourneyOverviewTopStudent[];
  locale: string;
  onStudentClick: (studentId: string) => void;
  emptyMessage: string;
  labels: {
    rank: string;
    student: string;
    completed: string;
    heroXp: string;
    badges: string;
    avgProgress: string;
  };
}) {
  if (students.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        icon={<Trophy className="h-8 w-8" />}
        className="py-8"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="hidden grid-cols-[56px_1.5fr_repeat(4,minmax(90px,1fr))] gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500 lg:grid">
        <span>{labels.rank}</span>
        <span>{labels.student}</span>
        <span className="text-right">{labels.completed}</span>
        <span className="text-right">{labels.heroXp}</span>
        <span className="text-right">{labels.badges}</span>
        <span className="text-right">{labels.avgProgress}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {students.map((row, index) => (
          <button
            key={row.studentId}
            type="button"
            onClick={() => onStudentClick(row.studentId)}
            className="grid w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none lg:grid-cols-[56px_1.5fr_repeat(4,minmax(90px,1fr))]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-700">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-900">
                {locale === "ar" && row.student.nameAr
                  ? row.student.nameAr
                  : row.student.name}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {row.student.code || row.student.admissionNo || row.studentId}
              </span>
            </span>
            <span className="text-sm text-gray-700 lg:text-right">
              {formatNumber(row.completedMissions, locale)}
            </span>
            <span className="text-sm text-gray-700 lg:text-right">
              {formatNumber(row.totalHeroXp, locale)}
            </span>
            <span className="text-sm text-gray-700 lg:text-right">
              {formatNumber(row.badgesCount, locale)}
            </span>
            <span className="text-sm font-semibold text-gray-900 lg:text-right">
              {formatPercent(row.averageProgressPercent, locale)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const [unit, seconds] = ranges.find(
    ([, secondsPerUnit]) => Math.abs(diffSeconds) >= secondsPerUnit,
  ) || ["second", 1];

  return formatter.format(Math.round(diffSeconds / seconds), unit);
}

function RecentActivityFeed({
  items,
  locale,
  emptyMessage,
  studentNames,
  labels,
}: {
  items: HeroJourneyOverviewActivity[];
  locale: string;
  emptyMessage: string;
  studentNames: Map<string, string>;
  labels: {
    noStudentReference: string;
    missionReference: string;
    noMissionReference: string;
    events: Record<string, string>;
  };
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        icon={<Activity className="h-8 w-8" />}
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = eventIcons[item.type as keyof typeof eventIcons] || Circle;
        const studentName = item.studentId
          ? studentNames.get(item.studentId) || item.studentId
          : labels.noStudentReference;
        const eventLabel =
          labels.events[item.type] || item.type.replaceAll("_", " ");

        return (
          <div
            key={item.id}
            className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
            title={new Date(item.occurredAt).toLocaleString(locale)}
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {eventLabel}
                </p>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(item.occurredAt, locale)}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-gray-600">
                {studentName}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {item.missionId
                  ? `${labels.missionReference}: ${item.missionId}`
                  : labels.noMissionReference}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HeroJourneyOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("heroJourney");
  const { hasPermission, isPermissionsReady } = usePermissions();
  const canViewHero =
    isPermissionsReady && hasPermission("reinforcement.hero.view");
  const {
    academicYearId,
    termId,
    isInitializing: isAcademicContextInitializing,
  } = useAcademicYearTermContext();
  const defaultFilters = useMemo(() => buildDefaultFilters(), []);
  const filterUrlModeByKey = useMemo(
    () =>
      ({
        dateRange: "replace",
        dateFrom: "replace",
        dateTo: "replace",
        stageId: "replace",
        gradeId: "replace",
        sectionId: "replace",
        classroomId: "replace",
        studentId: "replace",
      }) as const,
    [],
  );
  const filterDebouncedKeys = useMemo(() => [], []);
  const filterShouldOmit = useMemo(() => ({}), []);
  const normalizeFilterUrlValues = useCallback(
    (values: ScopeFilters) => {
      if (["today", "7", "30", "custom"].includes(values.dateRange)) {
        return null;
      }

      return updateDateRange(defaultFilters.dateRange, defaultFilters);
    },
    [defaultFilters],
  );
  const {
    values: filters,
    setValue: setFilterQueryValue,
    setValues: setFilterQueryValues,
    reset: resetFilterQueryValues,
  } = useUrlQueryState<ScopeFilters>({
    defaults: defaultFilters,
    debouncedKeys: filterDebouncedKeys,
    modeByKey: filterUrlModeByKey,
    shouldOmit: filterShouldOmit,
    normalize: normalizeFilterUrlValues,
  });
  const [overview, setOverview] = useState<HeroJourneyOverviewMetrics | null>(
    null,
  );
  const [structure, setStructure] = useState<{
    stages: AcademicStructureStage[];
    grades: AcademicStructureGrade[];
    sections: AcademicStructureSection[];
    classrooms: AcademicStructureClassroom[];
  }>({ stages: [], grades: [], sections: [], classrooms: [] });
  const [activeEnrollments, setActiveEnrollments] = useState<
    Array<StudentEnrollment & { id: string }>
  >([]);
  const [studentsById, setStudentsById] = useState<Map<string, Student>>(
    () => new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentFilterError, setStudentFilterError] = useState<string | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);

  const stageOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("overviewFilters.allStages") },
      ...structure.stages.map((stage) => ({
        value: stage.id,
        label: getLocalizedName(stage, locale) || stage.id,
      })),
    ],
    [locale, structure.stages, t],
  );

  const gradeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("overviewFilters.allGrades") },
      ...structure.grades
        .filter(
          (grade) => !filters.stageId || grade.stageId === filters.stageId,
        )
        .map((grade) => ({
          value: grade.id,
          label: getLocalizedName(grade, locale) || grade.id,
        })),
    ],
    [filters.stageId, locale, structure.grades, t],
  );

  const sectionOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("overviewFilters.allSections") },
      ...structure.sections
        .filter(
          (section) => !filters.gradeId || section.gradeId === filters.gradeId,
        )
        .map((section) => ({
          value: section.id,
          label: getLocalizedName(section, locale) || section.id,
        })),
    ],
    [filters.gradeId, locale, structure.sections, t],
  );

  const classroomOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("overviewFilters.allClassrooms") },
      ...structure.classrooms
        .filter(
          (classroom) =>
            !filters.sectionId || classroom.sectionId === filters.sectionId,
        )
        .map((classroom) => ({
          value: classroom.id,
          label: getLocalizedName(classroom, locale) || classroom.id,
        })),
    ],
    [filters.sectionId, locale, structure.classrooms, t],
  );

  const studentOptions = useMemo<SelectOption[]>(() => {
    const seen = new Set<string>();
    const filteredEnrollments = activeEnrollments.filter((enrollment) => {
      if (filters.gradeId && enrollment.gradeId !== filters.gradeId)
        return false;
      if (filters.sectionId && enrollment.sectionId !== filters.sectionId) {
        return false;
      }
      if (
        filters.classroomId &&
        enrollment.classroomId !== filters.classroomId
      ) {
        return false;
      }
      if (seen.has(enrollment.studentId)) return false;
      seen.add(enrollment.studentId);
      return true;
    });

    return [
      { value: "", label: t("overviewFilters.allStudents") },
      ...filteredEnrollments.map((enrollment) => {
        const student = studentsById.get(enrollment.studentId);
        const label =
          getStudentDisplayName(student, locale) || enrollment.studentId;

        return {
          value: enrollment.studentId,
          label,
          searchText: [
            label,
            student?.full_name_en,
            student?.full_name_ar,
            student?.student_id,
            enrollment.studentId,
            enrollment.grade,
            enrollment.section,
            enrollment.classroom,
          ]
            .filter(Boolean)
            .join(" "),
        };
      }),
    ];
  }, [
    activeEnrollments,
    filters.classroomId,
    filters.gradeId,
    filters.sectionId,
    locale,
    studentsById,
    t,
  ]);

  const studentNames = useMemo(() => {
    const names = new Map<string, string>();
    activeEnrollments.forEach((enrollment) => {
      const student = studentsById.get(enrollment.studentId);
      const name = getStudentDisplayName(student, locale);
      if (name) names.set(enrollment.studentId, name);
    });
    overview?.topStudents.forEach((row) => {
      names.set(
        row.studentId,
        locale === "ar" && row.student.nameAr
          ? row.student.nameAr
          : row.student.name,
      );
    });
    return names;
  }, [activeEnrollments, locale, overview?.topStudents, studentsById]);

  useEffect(() => {
    if (!canViewHero) return;

    if (!filters.studentId || isOptionsLoading) return;
    const hasSelectedStudent = studentOptions.some(
      (option) => option.value === filters.studentId,
    );
    if (hasSelectedStudent) return;

    queueMicrotask(() => {
      setStudentFilterError(t("overviewState.studentEnrollmentNotFound"));
      setFilterQueryValue("studentId", null, "replace");
    });
  }, [
    filters.studentId,
    canViewHero,
    isOptionsLoading,
    setFilterQueryValue,
    studentOptions,
    t,
  ]);

  useEffect(() => {
    if (
      !canViewHero ||
      !isPermissionsReady ||
      isAcademicContextInitializing ||
      !academicYearId ||
      !termId
    )
      return;
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setIsOptionsLoading(true);
    });
    Promise.all([
      fetchAcademicStructureTree({ yearId: academicYearId, termId }),
      fetchEnrollments({ academicYearId, status: "active" }),
      fetchAllStudents({ status: "Active" }),
    ])
      .then(([tree, enrollments, students]) => {
        if (cancelled) return;
        setStructure({
          stages: tree.stages,
          grades: tree.grades,
          sections: tree.sections,
          classrooms: tree.classrooms,
        });
        setActiveEnrollments(enrollments);
        setStudentsById(
          new Map(students.map((student) => [student.id, student])),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setStructure({
            stages: [],
            grades: [],
            sections: [],
            classrooms: [],
          });
          setActiveEnrollments([]);
          setStudentsById(new Map());
        }
      })
      .finally(() => {
        if (!cancelled) setIsOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    academicYearId,
    canViewHero,
    isAcademicContextInitializing,
    isPermissionsReady,
    termId,
  ]);

  useEffect(() => {
    let cancelled = false;

    if (!canViewHero || !isPermissionsReady || isAcademicContextInitializing)
      return;
    if (!academicYearId || !termId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setIsLoading(false);
        setOverview(null);
        setError(t("messages.selectAcademicContext"));
      });
      return;
    }

    queueMicrotask(() => {
      if (cancelled) return;
      setIsLoading(true);
      setError(null);
      if (!filters.studentId) {
        setStudentFilterError(null);
      }
    });

    void getHeroJourneyOverview({
      academicYearId,
      yearId: academicYearId,
      termId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      stageId: filters.stageId || undefined,
      sectionId: filters.sectionId || undefined,
      classroomId: filters.classroomId || undefined,
      studentId: filters.studentId || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setOverview(result);
          setStudentFilterError(null);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          if (
            filters.studentId &&
            isApiError(requestError) &&
            requestError.code === "not_found" &&
            requestError.message
              .toLowerCase()
              .includes("student enrollment not found")
          ) {
            setStudentFilterError(t("overviewState.studentEnrollmentNotFound"));
            setFilterQueryValue("studentId", null, "replace");
            return;
          }

          setOverview(null);
          setError(t("overviewState.loadFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    academicYearId,
    canViewHero,
    filters.classroomId,
    filters.dateFrom,
    filters.dateTo,
    filters.gradeId,
    filters.sectionId,
    filters.stageId,
    filters.studentId,
    isAcademicContextInitializing,
    isPermissionsReady,
    reloadKey,
    setFilterQueryValue,
    t,
    termId,
  ]);

  const setFilterValue = useCallback(
    <K extends keyof ScopeFilters>(key: K, value: ScopeFilters[K]) => {
      const next = { ...filters, [key]: value };
      if (key === "stageId") {
        next.gradeId = "";
        next.sectionId = "";
        next.classroomId = "";
        next.studentId = "";
      }
      if (key === "gradeId") {
        next.sectionId = "";
        next.classroomId = "";
        next.studentId = "";
      }
      if (key === "sectionId") {
        next.classroomId = "";
        next.studentId = "";
      }
      if (key === "classroomId") {
        next.studentId = "";
      }
      setFilterQueryValues(next, "replace");
    },
    [filters, setFilterQueryValues],
  );

  const resetFilters = () => resetFilterQueryValues(undefined, "replace");

  if (!isPermissionsReady) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (!canViewHero) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
      >
        {t("accessDenied")}
      </div>
    );
  }

  const hasOverviewData =
    overview &&
    (overview.missions.total > 0 ||
      overview.progress.totalProgress > 0 ||
      overview.rewards.totalHeroXp > 0 ||
      overview.topStudents.length > 0 ||
      overview.recentActivity.length > 0);

  const kpiCards = overview
    ? [
        {
          key: "missions",
          title: t("overviewKpi.totalMissions"),
          value: overview.missions.total,
          subtitle: `${t("status.published")}: ${overview.missions.published} · ${t("status.draft")}: ${overview.missions.draft} · ${t("status.archived")}: ${overview.missions.archived}`,
          icon: BarChart3,
          iconColor: "#036b80",
          iconBgColor: "#e6f4f6",
        },
        {
          key: "completion",
          title: t("overviewKpi.completionRate"),
          value: formatPercent(overview.progress.completionRate, locale),
          valueSuffix: "%",
          icon: Target,
          iconColor: "#0284c7",
          iconBgColor: "#eff6ff",
        },
        {
          key: "xp",
          title: t("overviewKpi.totalHeroXp"),
          value: overview.rewards.totalHeroXp,
          icon: Trophy,
          iconColor: "#7c3aed",
          iconBgColor: "#f5f3ff",
        },
        {
          key: "badges",
          title: t("overviewKpi.badgesAwarded"),
          value: overview.rewards.badgesAwarded,
          icon: Award,
          iconColor: "#b45309",
          iconBgColor: "#fffbeb",
        },
        {
          key: "objectives",
          title: t("overviewKpi.requiredObjectives"),
          value: `${formatNumber(overview.objectives.completedRequired, locale)}/${formatNumber(overview.objectives.totalRequired, locale)}`,
          icon: ClipboardCheck,
          iconColor: "#0f766e",
          iconBgColor: "#ecfdf5",
        },
        {
          key: "studentsWithBadges",
          title: t("overviewKpi.studentsWithBadges"),
          value: overview.rewards.studentsWithBadges,
          icon: Medal,
          iconColor: "#be123c",
          iconBgColor: "#fff1f2",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <HeroJourneyPageHeader
        title={t("overview")}
        description={t("overviewDescription")}
        bannerImageSrc={heroJourneySectionBanners.overview}
        actions={<Button
            type="button"
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => setReloadKey((value) => value + 1)}
            loading={isLoading}
          >
            {t("overviewState.refresh")}
          </Button>}
      />

      <section className="sticky top-0 z-20 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {t("overviewFilters.title")}
            </h2>
            <p className="text-xs text-gray-500">
              {t("overviewFilters.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={resetFilters}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            {t("overviewFilters.reset")}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Select
            label={t("overviewFilters.dateRange")}
            value={filters.dateRange}
            options={[
              { value: "today", label: t("overviewFilters.today") },
              { value: "7", label: t("overviewFilters.last7Days") },
              { value: "30", label: t("overviewFilters.last30Days") },
              { value: "custom", label: t("overviewFilters.custom") },
            ]}
            onChange={(value) =>
              setFilterQueryValues(
                updateDateRange(value as DateRangePreset, filters),
                "replace",
              )
            }
          />
          <Select
            label={t("missionForm.labels.stage")}
            value={filters.stageId}
            options={stageOptions}
            onChange={(value) => setFilterValue("stageId", value)}
            disabled={isOptionsLoading}
            searchable
          />
          <Select
            label={t("missionForm.labels.grade")}
            value={filters.gradeId}
            options={gradeOptions}
            onChange={(value) => setFilterValue("gradeId", value)}
            disabled={isOptionsLoading || !filters.stageId}
            searchable
          />
          <Select
            label={t("missionForm.labels.section")}
            value={filters.sectionId}
            options={sectionOptions}
            onChange={(value) => setFilterValue("sectionId", value)}
            disabled={isOptionsLoading || !filters.gradeId}
            searchable
          />
          <Select
            label={t("missionForm.labels.classroom")}
            value={filters.classroomId}
            options={classroomOptions}
            onChange={(value) => setFilterValue("classroomId", value)}
            disabled={isOptionsLoading || !filters.sectionId}
            searchable
          />
          <Select
            label={t("overviewFilters.student")}
            value={filters.studentId}
            options={studentOptions}
            onChange={(value) => setFilterValue("studentId", value)}
            disabled={isOptionsLoading}
            searchable
          />
        </div>
        {filters.dateRange === "custom" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <DatePicker
              label={t("overviewFilters.dateFrom")}
              value={toDatePickerValue(filters.dateFrom)}
              onChange={(value) =>
                setFilterValue("dateFrom", value ? toIsoDate(value) : "")
              }
              maxDate={toDatePickerValue(filters.dateTo) ?? undefined}
            />
            <DatePicker
              label={t("overviewFilters.dateTo")}
              value={toDatePickerValue(filters.dateTo)}
              onChange={(value) =>
                setFilterValue("dateTo", value ? toIsoDate(value) : "")
              }
              minDate={toDatePickerValue(filters.dateFrom) ?? undefined}
            />
          </div>
        ) : null}
        {studentFilterError ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {studentFilterError}
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <OverviewSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 text-red-700">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{t("overviewState.errorTitle")}</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setReloadKey((value) => value + 1)}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              {t("overviewState.refresh")}
            </Button>
          </div>
        </div>
      ) : !hasOverviewData || !overview ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={<BarChart3 className="h-10 w-10" />}
            title={t("overviewState.emptyTitle")}
            message={t("overviewState.emptyDescription")}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetFilters}
                >
                  {t("overviewFilters.reset")}
                </Button>
                <Link href={`/${locale}/hero-journey/missions`}>
                  <Button type="button" variant="primary">
                    {t("actions.createMission")}
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpiCards.map((card) => (
              <KPICardV2
                key={card.key}
                title={card.title}
                value={card.value}
                valueSuffix={card.valueSuffix}
                subtitle={card.subtitle}
                icon={card.icon}
                iconColor={card.iconColor}
                iconBgColor={card.iconBgColor}
                showChart={false}
                className="bg-white"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <AnalyticsCard
              title={t("overviewSections.missionStatus")}
              description={t("overviewSections.missionStatusDescription")}
              action={
                <Link href={`/${locale}/hero-journey/missions`}>
                  <Button type="button" variant="ghost" size="sm">
                    {t("missions")}
                  </Button>
                </Link>
              }
            >
              <MissionStatusDonut
                overview={overview}
                locale={locale}
                labels={{
                  missions: t("missions"),
                  published: t("status.published"),
                  draft: t("status.draft"),
                  archived: t("status.archived"),
                  withXpReward: t("overviewSections.withXpReward"),
                  withBadgeReward: t("overviewSections.withBadgeReward"),
                  withoutRewards: t("overviewSections.withoutRewards"),
                }}
              />
            </AnalyticsCard>

            <AnalyticsCard
              title={t("overviewSections.studentProgress")}
              description={t("overviewSections.studentProgressDescription")}
            >
              <div className="mb-5">
                <p className="text-4xl font-bold text-gray-900">
                  {formatPercent(overview.progress.completionRate, locale)}%
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {t("overviewSections.studentProgressHelper")}
                </p>
              </div>
              <SegmentedBar
                items={[
                  {
                    key: "notStarted",
                    label: t("overviewProgress.notStarted"),
                    value: overview.progress.notStarted,
                    className: progressColors.notStarted,
                  },
                  {
                    key: "inProgress",
                    label: t("overviewProgress.inProgress"),
                    value: overview.progress.inProgress,
                    className: progressColors.inProgress,
                  },
                  {
                    key: "completed",
                    label: t("overviewProgress.completed"),
                    value: overview.progress.completed,
                    className: progressColors.completed,
                  },
                  {
                    key: "cancelled",
                    label: t("overviewProgress.cancelled"),
                    value: overview.progress.cancelled,
                    className: progressColors.cancelled,
                  },
                ]}
              />
              {overview.progress.notStarted >
              overview.progress.inProgress + overview.progress.completed ? (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t("overviewSections.notStartedWarning")}
                </p>
              ) : null}
            </AnalyticsCard>

            <AnalyticsCard
              title={t("overviewSections.requiredObjectives")}
              description={t("overviewSections.requiredObjectivesDescription")}
            >
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(
                      overview.objectives.completedRequired,
                      locale,
                    )}
                    <span className="text-lg text-gray-400">
                      /{formatNumber(overview.objectives.totalRequired, locale)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("overviewSections.completedRequired")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-teal-700">
                    {formatPercent(
                      overview.objectives.averageProgressPercent,
                      locale,
                    )}
                    %
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("overviewSections.averageProgress")}
                  </p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{
                    width:
                      overview.objectives.totalRequired > 0
                        ? `${Math.min((overview.objectives.completedRequired / overview.objectives.totalRequired) * 100, 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </AnalyticsCard>

            <AnalyticsCard
              title={t("overviewSections.rewards")}
              description={t("overviewSections.rewardsDescription")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-violet-700">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("overviewSections.xpImpact")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatNumber(overview.rewards.totalHeroXp, locale)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("overviewSections.xpGrantedMissions", {
                      count: overview.rewards.xpGrantedMissions,
                    })}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-amber-700">
                    <Award className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("overviewSections.badgeImpact")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatNumber(overview.rewards.badgesAwarded, locale)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("overviewSections.studentsWithBadges", {
                      count: overview.rewards.studentsWithBadges,
                    })}
                  </p>
                </div>
              </div>
            </AnalyticsCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <AnalyticsCard title={t("overviewSections.topStudents")}>
              <TopStudentsList
                students={overview.topStudents}
                locale={locale}
                emptyMessage={t("overviewState.noTopStudents")}
                onStudentClick={(studentId) => {
                  const hasStudentInCurrentScope = studentOptions.some(
                    (option) => option.value === studentId,
                  );
                  if (!hasStudentInCurrentScope) {
                    setStudentFilterError(
                      t("overviewState.studentEnrollmentNotFound"),
                    );
                    return;
                  }
                  setFilterValue("studentId", studentId);
                }}
                labels={{
                  rank: t("overviewLeaderboard.rank"),
                  student: t("overviewLeaderboard.student"),
                  completed: t("overviewLeaderboard.completed"),
                  heroXp: t("overviewLeaderboard.heroXp"),
                  badges: t("overviewLeaderboard.badges"),
                  avgProgress: t("overviewLeaderboard.avgProgress"),
                }}
              />
            </AnalyticsCard>

            <AnalyticsCard title={t("overviewSections.recentActivity")}>
              <RecentActivityFeed
                items={[...overview.recentActivity].sort(
                  (left, right) =>
                    new Date(right.occurredAt).getTime() -
                    new Date(left.occurredAt).getTime(),
                )}
                locale={locale}
                emptyMessage={t("overviewState.noRecentActivity")}
                studentNames={studentNames}
                labels={{
                  noStudentReference: t("overviewActivity.noStudentReference"),
                  missionReference: t("overviewActivity.missionReference"),
                  noMissionReference: t("overviewActivity.noMissionReference"),
                  events: {
                    mission_started: t(
                      "overviewActivity.events.missionStarted",
                    ),
                    objective_completed: t(
                      "overviewActivity.events.objectiveCompleted",
                    ),
                    mission_completed: t(
                      "overviewActivity.events.missionCompleted",
                    ),
                    xp_granted: t("overviewActivity.events.xpGranted"),
                    badge_awarded: t("overviewActivity.events.badgeAwarded"),
                  },
                }}
              />
            </AnalyticsCard>
          </div>
        </>
      )}
    </div>
  );
}
