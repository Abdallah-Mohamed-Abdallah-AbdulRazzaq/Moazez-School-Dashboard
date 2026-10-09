import {
  ACADEMIC_CONTENT_AUDIENCES,
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
  type AcademicContentAudience,
  type AcademicContentLibraryItem,
  type AcademicContentStatus,
  type AcademicSubjectResourceCategory,
  type ListAcademicContentQuery,
} from "../types/contracts";

const DEFAULT_PAGE_SIZE = 10;

export type SubjectResourceView = "table" | "grid";

export interface SubjectResourceFilters {
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
  resourceCategory: AcademicSubjectResourceCategory | "";
  tag: string;
  search: string;
  view: SubjectResourceView;
}

export type SubjectResourceFilterUpdate = Partial<
  Omit<SubjectResourceFilters, "page" | "limit" | "search" | "view">
>;

function positiveInteger(rawValue: string | null, fallback: number) {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function enumValue<T extends string>(
  rawValue: string | null,
  values: readonly T[],
): T | "" {
  return rawValue && values.includes(rawValue as T) ? (rawValue as T) : "";
}

export function readSubjectResourceFilters(
  searchParams: URLSearchParams,
): SubjectResourceFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(
      100,
      positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
    ),
    status: enumValue(
      searchParams.get("contentStatus"),
      ACADEMIC_CONTENT_STATUSES,
    ),
    audience: enumValue(
      searchParams.get("audience"),
      ACADEMIC_CONTENT_AUDIENCES,
    ),
    stageId: searchParams.get("stageId") ?? "",
    gradeId: searchParams.get("gradeId") ?? "",
    sectionId: searchParams.get("sectionId") ?? "",
    classroomId: searchParams.get("classroomId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    teacherUserId: searchParams.get("teacherUserId") ?? "",
    resourceCategory: enumValue(
      searchParams.get("resourceCategory"),
      ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
    ),
    tag: (searchParams.get("tag") ?? "").slice(0, 80),
    search: (searchParams.get("search") ?? "").slice(0, 120),
    view: searchParams.get("view") === "grid" ? "grid" : "table",
  };
}

export function subjectResourceListQuery(
  filters: SubjectResourceFilters,
  academicYearId: string,
  termId: string,
): Omit<ListAcademicContentQuery, "type"> {
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
    resourceCategory: filters.resourceCategory,
    tag: filters.tag,
    search: filters.search,
  };
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ""),
  ) as Omit<ListAcademicContentQuery, "type">;
}

export function subjectResourcePageStats(
  items: AcademicContentLibraryItem[],
  total: number,
) {
  const categories = items.flatMap((item) =>
    item.summary?.type === "SUBJECT_RESOURCE"
      ? [item.summary.resourceCategory]
      : [],
  );
  return {
    total,
    pageItems: items.length,
    publishedOnPage: items.filter((item) => item.status === "PUBLISHED").length,
    categoriesOnPage: new Set(categories).size,
  };
}
