import {
  ACADEMIC_CONTENT_AUDIENCES,
  ACADEMIC_CONTENT_STATUSES,
  type AcademicContentAudience,
  type AcademicContentStatus,
  type ListAcademicContentQuery,
} from "../types/contracts";
import { validDateOnlyFilter } from "./academicContentListFilters";

const DEFAULT_PAGE_SIZE = 10;

export type WeeklyPlanView = "table" | "calendar";

export interface WeeklyPlanFilters {
  page: number;
  limit: number;
  status: AcademicContentStatus | "";
  audience: AcademicContentAudience | "";
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
  teacherUserId: string;
  tag: string;
  weeklyDateFrom: string;
  weeklyDateTo: string;
  search: string;
  view: WeeklyPlanView;
}

export type WeeklyPlanFilterUpdate = Partial<
  Omit<WeeklyPlanFilters, "page" | "limit" | "search" | "view">
>;

export const WEEKLY_PLAN_COUNT_DEFINITIONS = [
  { key: "total", status: undefined },
  { key: "draft", status: "DRAFT" },
  { key: "scheduled", status: "SCHEDULED" },
  { key: "published", status: "PUBLISHED" },
] as const;

export type WeeklyPlanCountKey =
  (typeof WEEKLY_PLAN_COUNT_DEFINITIONS)[number]["key"];

function positiveInteger(rawValue: string | null, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function statusFilter(rawValue: string | null): AcademicContentStatus | "" {
  return rawValue &&
    ACADEMIC_CONTENT_STATUSES.includes(rawValue as AcademicContentStatus)
    ? (rawValue as AcademicContentStatus)
    : "";
}

function audienceFilter(rawValue: string | null): AcademicContentAudience | "" {
  return rawValue &&
    ACADEMIC_CONTENT_AUDIENCES.includes(rawValue as AcademicContentAudience)
    ? (rawValue as AcademicContentAudience)
    : "";
}

export function readWeeklyPlanFilters(
  searchParams: URLSearchParams,
): WeeklyPlanFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(
      100,
      positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
    ),
    status: statusFilter(searchParams.get("contentStatus")),
    audience: audienceFilter(searchParams.get("audience")),
    stageId: searchParams.get("stageId") ?? "",
    gradeId: searchParams.get("gradeId") ?? "",
    sectionId: searchParams.get("sectionId") ?? "",
    classroomId: searchParams.get("classroomId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    teacherUserId: searchParams.get("teacherUserId") ?? "",
    tag: (searchParams.get("tag") ?? "").slice(0, 80),
    weeklyDateFrom: validDateOnlyFilter(searchParams.get("weeklyDateFrom")),
    weeklyDateTo: validDateOnlyFilter(searchParams.get("weeklyDateTo")),
    search: (searchParams.get("search") ?? "").slice(0, 120),
    view: searchParams.get("view") === "calendar" ? "calendar" : "table",
  };
}

export function weeklyPlanListQuery(
  filters: WeeklyPlanFilters,
  academicYearId: string,
  termId: string,
): Omit<ListAcademicContentQuery, "type"> {
  const weeklyDateTo =
    filters.weeklyDateTo &&
    (!filters.weeklyDateFrom || filters.weeklyDateTo >= filters.weeklyDateFrom)
      ? filters.weeklyDateTo
      : "";
  const query = {
    academicYearId,
    termId,
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    audience: filters.audience,
    stageId: filters.stageId,
    gradeId: filters.gradeId,
    sectionId: filters.sectionId,
    classroomId: filters.classroomId,
    subjectId: filters.subjectId,
    teacherUserId: filters.teacherUserId,
    tag: filters.tag,
    weeklyDateFrom: filters.weeklyDateFrom,
    weeklyDateTo,
    search: filters.search,
  };
  return Object.fromEntries(
    Object.entries(query).filter(([, queryValue]) => queryValue !== ""),
  ) as Omit<ListAcademicContentQuery, "type">;
}
