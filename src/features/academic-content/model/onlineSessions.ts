import {
  ACADEMIC_CONTENT_AUDIENCES,
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
  type AcademicContentAudience,
  type AcademicContentLibraryItem,
  type AcademicContentOnlineSessionSummary,
  type AcademicContentStatus,
  type AcademicOnlineSessionPlatform,
  type ListAcademicContentQuery,
} from "../types/contracts";
import { validDateOnlyFilter } from "./academicContentListFilters";

const DEFAULT_PAGE_SIZE = 10;

export type OnlineSessionDatePreset =
  "" | "today" | "tomorrow" | "next7Days" | "custom";
export type OnlineSessionTemporalState =
  "incomplete" | "live" | "upcoming" | "ended";

export interface OnlineSessionFilters {
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
  platform: AcademicOnlineSessionPlatform | "";
  tag: string;
  dateFrom: string;
  dateTo: string;
  datePreset: OnlineSessionDatePreset;
  search: string;
}

export type OnlineSessionFilterUpdate = Partial<
  Omit<OnlineSessionFilters, "page" | "limit" | "search">
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

export function readOnlineSessionFilters(
  searchParams: URLSearchParams,
): OnlineSessionFilters {
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
    platform: enumValue(
      searchParams.get("sessionPlatform"),
      ACADEMIC_ONLINE_SESSION_PLATFORMS,
    ),
    tag: (searchParams.get("tag") ?? "").slice(0, 80),
    dateFrom: validDateOnlyFilter(searchParams.get("sessionDateFrom")),
    dateTo: validDateOnlyFilter(searchParams.get("sessionDateTo")),
    datePreset: enumValue(searchParams.get("sessionDatePreset"), [
      "today",
      "tomorrow",
      "next7Days",
      "custom",
    ] as const),
    search: (searchParams.get("search") ?? "").slice(0, 120),
  };
}

function localDayInstant(dateOnly: string, endOfDay: boolean) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const instant = new Date(year, month - 1, day + (endOfDay ? 1 : 0));
  if (endOfDay) instant.setMilliseconds(-1);
  return instant.toISOString();
}

export function onlineSessionListQuery(
  filters: OnlineSessionFilters,
  academicYearId: string,
  termId: string,
): Omit<ListAcademicContentQuery, "type"> {
  const validDateTo =
    filters.dateTo && (!filters.dateFrom || filters.dateTo >= filters.dateFrom)
      ? filters.dateTo
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
    sessionPlatform: filters.platform,
    tag: filters.tag,
    sessionStartAtFrom: filters.dateFrom
      ? localDayInstant(filters.dateFrom, false)
      : "",
    sessionStartAtTo: validDateTo ? localDayInstant(validDateTo, true) : "",
    search: filters.search,
  };
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ""),
  ) as Omit<ListAcademicContentQuery, "type">;
}

function dateOnly(date: Date) {
  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return offsetDate.toISOString().slice(0, 10);
}

export function onlineSessionPresetRange(
  preset: OnlineSessionDatePreset,
  now = new Date(),
) {
  if (!preset || preset === "custom") return { dateFrom: "", dateTo: "" };
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "tomorrow") start.setDate(start.getDate() + 1);
  const end = new Date(start);
  if (preset === "next7Days") end.setDate(end.getDate() + 6);
  return { dateFrom: dateOnly(start), dateTo: dateOnly(end) };
}

export function onlineSessionSummary(
  item: AcademicContentLibraryItem,
): AcademicContentOnlineSessionSummary | null {
  return item.summary?.type === "ONLINE_SESSION" ? item.summary : null;
}

export function onlineSessionTemporalState(
  item: AcademicContentLibraryItem,
  now = new Date(),
): OnlineSessionTemporalState {
  const summary = onlineSessionSummary(item);
  if (!summary) return "incomplete";
  const current = now.getTime();
  if (current < new Date(summary.startAt).getTime()) return "upcoming";
  if (current < new Date(summary.endAt).getTime()) return "live";
  return "ended";
}

export function onlineSessionDurationMinutes(item: AcademicContentLibraryItem) {
  const summary = onlineSessionSummary(item);
  if (!summary) return null;
  return Math.max(
    1,
    Math.ceil(
      (new Date(summary.endAt).getTime() -
        new Date(summary.startAt).getTime()) /
        60_000,
    ),
  );
}

export function onlineSessionPageStats(
  items: AcademicContentLibraryItem[],
  total: number,
  now = new Date(),
) {
  const states = items.map((item) => onlineSessionTemporalState(item, now));
  return {
    total,
    upcomingOnPage: states.filter((state) => state === "upcoming").length,
    liveOnPage: states.filter((state) => state === "live").length,
    endedOnPage: states.filter((state) => state === "ended").length,
    draftOnPage: items.filter((item) => item.status === "DRAFT").length,
  };
}
