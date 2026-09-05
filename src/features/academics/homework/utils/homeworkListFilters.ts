import type { HomeworkAssignmentListFilters } from "../services/homeworkApi.types";

interface HomeworkListFilterQuery {
  get(name: string): string | null;
}

interface BuildHomeworkListFiltersInput {
  academicYearId?: string;
  termId?: string;
  searchParams: HomeworkListFilterQuery;
}

export interface HomeworkListFilterValues {
  search: string;
  status: string;
  mode: string;
  classroomId: string;
  teacherUserId: string;
  teacherSubjectAllocationId: string;
  dueFrom: string;
  dueTo: string;
}

const FILTER_PARAMETER_NAMES = {
  search: "search",
  status: "homeworkStatus",
  mode: "mode",
  classroomId: "classroom",
  teacherUserId: "teacher",
  teacherSubjectAllocationId: "allocation",
  dueFrom: "dueFrom",
  dueTo: "dueTo",
} as const;

export function buildHomeworkListFilters({
  academicYearId,
  termId,
  searchParams,
}: BuildHomeworkListFiltersInput): HomeworkAssignmentListFilters {
  return {
    academicYearId: academicYearId || undefined,
    termId: termId || undefined,
    search: searchParams.get(FILTER_PARAMETER_NAMES.search) || undefined,
    status: searchParams.get(FILTER_PARAMETER_NAMES.status) || undefined,
    mode: searchParams.get(FILTER_PARAMETER_NAMES.mode) || undefined,
    classroomId: searchParams.get(FILTER_PARAMETER_NAMES.classroomId) || undefined,
    teacherUserId: searchParams.get(FILTER_PARAMETER_NAMES.teacherUserId) || undefined,
    teacherSubjectAllocationId:
      searchParams.get(FILTER_PARAMETER_NAMES.teacherSubjectAllocationId) ||
      undefined,
    dueFrom: searchParams.get(FILTER_PARAMETER_NAMES.dueFrom) || undefined,
    dueTo: searchParams.get(FILTER_PARAMETER_NAMES.dueTo) || undefined,
    page: Number(searchParams.get("page") || "1"),
    limit: Number(searchParams.get("limit") || "25"),
  };
}

export function updateHomeworkListFilterParams(
  searchParams: URLSearchParams,
  filters: HomeworkListFilterValues,
) {
  const nextSearchParams = new URLSearchParams(searchParams);

  for (const [filterName, parameterName] of Object.entries(
    FILTER_PARAMETER_NAMES,
  ) as Array<[keyof HomeworkListFilterValues, string]>) {
    const filterValue = filters[filterName].trim();
    if (filterValue) nextSearchParams.set(parameterName, filterValue);
    else nextSearchParams.delete(parameterName);
  }

  nextSearchParams.delete("page");
  return nextSearchParams;
}

export function resetHomeworkListFilterParams(searchParams: URLSearchParams) {
  return updateHomeworkListFilterParams(searchParams, {
    search: "",
    status: "",
    mode: "",
    classroomId: "",
    teacherUserId: "",
    teacherSubjectAllocationId: "",
    dueFrom: "",
    dueTo: "",
  });
}
