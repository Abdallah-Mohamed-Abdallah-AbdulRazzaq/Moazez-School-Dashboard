import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  BulkSaveTimetableRequest,
  CreateEntryRequest,
  CreatePeriodRequest,
  ListResponse,
  PublicationResponse,
  TimetableConflictCheckResponse,
  TimetableDashboardAllResponseDto,
  TimetableScopeType,
  TimetableValidationResponse,
  TimetableUnpublishResponse,
  UpdateEntryRequest,
  UpdatePeriodRequest,
  UpsertConfigRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { mapBackendEntryToUi } from "@/features/academics/timetable/services/timetableMappers";
import type { TimetableAdapter } from "@/features/academics/timetable/services/timetableAdapter";
import type {
  TimetableConflict,
  TimetableEntry,
  TimetableValidationResult,
} from "@/features/academics/timetable/types/timetable";

const BASE = "/academics/timetable";

type QueryParamValue = string | number | undefined;

type DashboardTimetableParams = {
  termId: string;
  gradeId?: string;
  classroomId?: string;
};

type ConfigParams = {
  academicYearId: string;
  termId: string;
  scopeType?: TimetableScopeType;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
};

type EntryListParams = {
  timetableConfigId: string;
  classroomId?: string;
  teacherUserId?: string;
  subjectId?: string;
  roomId?: string;
  dayOfWeek?: number;
  status?: "DRAFT" | "ACTIVE" | "CANCELLED";
};

type UnpublishRequest = {
  termId: string;
  gradeId?: string;
  classroomId?: string;
};

type ValidateParams = {
  termId: string;
  gradeId?: string;
  classroomId?: string;
};

export type TimetablePreviewResponse = unknown;
export type TimetableConflictsResponse = unknown;
export type TimetablePublicationResponse = PublicationResponse;

const definedParams = <T extends Record<string, QueryParamValue>>(
  params: T,
): Record<string, string | number> =>
  Object.entries(params).reduce<Record<string, string | number>>(
    (queryParams, [paramName, paramValue]) => {
      if (typeof paramValue !== "undefined") {
        queryParams[paramName] = paramValue;
      }
      return queryParams;
    },
    {},
  );

const requestConfig = <T extends Record<string, QueryParamValue>>(
  params: T,
) => ({
  params: definedParams(params),
});

const timetableConfigParams = (timetableConfigId: string) =>
  requestConfig({ timetableConfigId: timetableConfigId });

const unwrap = <T>(res: T | { data?: T }): T =>
  res && typeof res === "object" && "data" in res && res.data
    ? res.data
    : (res as T);

export const getDashboardTimetable = (
  params: DashboardTimetableParams,
): Promise<TimetableDashboardAllResponseDto> =>
  apiGet<TimetableDashboardAllResponseDto>(
    `${BASE}/all`,
    requestConfig(params),
  ).then(unwrap);

export const getConfig = (
  params: ConfigParams,
): Promise<BackendTimetableConfigDto> =>
  apiGet<BackendTimetableConfigDto>(
    `${BASE}/config`,
    requestConfig(params),
  ).then(unwrap);

export const upsertConfig = (
  payload: UpsertConfigRequest,
): Promise<BackendTimetableConfigDto> =>
  apiPut<BackendTimetableConfigDto>(`${BASE}/config`, payload).then(unwrap);

export const listPeriods = (
  timetableConfigId: string,
): Promise<
  ListResponse<BackendTimetablePeriodDto> | BackendTimetablePeriodDto[]
> =>
  apiGet<ListResponse<BackendTimetablePeriodDto> | BackendTimetablePeriodDto[]>(
    `${BASE}/periods`,
    timetableConfigParams(timetableConfigId),
  ).then(unwrap);

export const createPeriod = (
  payload: CreatePeriodRequest,
): Promise<BackendTimetablePeriodDto> =>
  apiPost<BackendTimetablePeriodDto>(`${BASE}/periods`, payload).then(unwrap);

export const updatePeriod = (
  periodId: string,
  payload: UpdatePeriodRequest,
): Promise<BackendTimetablePeriodDto> =>
  apiPatch<BackendTimetablePeriodDto>(
    `${BASE}/periods/${periodId}`,
    payload,
  ).then(unwrap);

export const deletePeriod = (periodId: string): Promise<void> =>
  apiDelete<void>(`${BASE}/periods/${periodId}`);

export const listEntries = (
  params: EntryListParams,
): Promise<
  ListResponse<BackendTimetableEntryDto> | BackendTimetableEntryDto[]
> =>
  apiGet<ListResponse<BackendTimetableEntryDto> | BackendTimetableEntryDto[]>(
    `${BASE}/entries`,
    requestConfig({
      timetableConfigId: params.timetableConfigId,
      classroomId: params.classroomId,
      teacherUserId: params.teacherUserId,
      subjectId: params.subjectId,
      roomId: params.roomId,
      dayOfWeek: params.dayOfWeek,
      status: params.status,
    }),
  ).then(unwrap);

export const getEntry = (entryId: string): Promise<BackendTimetableEntryDto> =>
  apiGet<BackendTimetableEntryDto>(`${BASE}/entries/${entryId}`).then(unwrap);

export const createEntry = (
  payload: CreateEntryRequest,
): Promise<BackendTimetableEntryDto> =>
  apiPost<BackendTimetableEntryDto>(`${BASE}/entries`, payload).then(unwrap);

export const updateEntry = (
  entryId: string,
  payload: UpdateEntryRequest,
): Promise<BackendTimetableEntryDto> =>
  apiPatch<BackendTimetableEntryDto>(
    `${BASE}/entries/${entryId}`,
    payload,
  ).then(unwrap);

export const deleteEntry = (entryId: string): Promise<void> =>
  apiDelete<void>(`${BASE}/entries/${entryId}`);

export const bulkSaveEntries = (
  payload: BulkSaveTimetableRequest,
): Promise<
  ListResponse<BackendTimetableEntryDto> | BackendTimetableEntryDto[]
> =>
  apiPut<ListResponse<BackendTimetableEntryDto> | BackendTimetableEntryDto[]>(
    `${BASE}/entries/bulk`,
    payload,
  ).then(unwrap);

export const getPreview = (
  timetableConfigId: string,
): Promise<TimetablePreviewResponse> =>
  apiGet<TimetablePreviewResponse>(
    `${BASE}/preview`,
    timetableConfigParams(timetableConfigId),
  ).then(unwrap);

export const getConflicts = (
  timetableConfigId: string,
): Promise<TimetableConflictsResponse> =>
  apiGet<TimetableConflictsResponse>(
    `${BASE}/conflicts`,
    timetableConfigParams(timetableConfigId),
  ).then(unwrap);

export const getPublication = (
  timetableConfigId: string,
): Promise<TimetablePublicationResponse> =>
  apiGet<TimetablePublicationResponse>(
    `${BASE}/publication`,
    timetableConfigParams(timetableConfigId),
  ).then(unwrap);

export const publish = (timetableConfigId: string): Promise<PublicationResponse> =>
  apiPost<PublicationResponse>(`${BASE}/publish`, {
    timetableConfigId: timetableConfigId,
  }).then(unwrap);

export const unpublish = (payload: UnpublishRequest): Promise<TimetableUnpublishResponse> =>
  apiPost<TimetableUnpublishResponse>(`${BASE}/unpublish`, payload).then(unwrap);

export const validate = (
  params: ValidateParams,
): Promise<TimetableValidationResponse> =>
  apiGet<TimetableValidationResponse>(
    `${BASE}/validate`,
    requestConfig(params),
  ).then(unwrap);

export const checkConflicts = (
  payload: BulkSaveTimetableRequest,
): Promise<TimetableConflictCheckResponse> =>
  apiPost<TimetableConflictCheckResponse>(
    `${BASE}/conflicts/check`,
    payload,
  ).then(unwrap);

export const timetableApiAdapter = {
  getDashboardTimetable,
  getConfig,
  upsertConfig,
  listPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  bulkSaveEntries,
  getPreview,
  getConflicts,
  getPublication,
  publish,
  unpublish,
  validate,
  checkConflicts,
};

export const createTimetableApiAdapter = (
  detectConflicts: TimetableAdapter["detectConflicts"],
): TimetableAdapter => ({
  async fetchTimetable(termId, sectionId, classroomId) {
    const response = await getDashboardTimetable({
      termId,
      classroomId,
    });
    const entries =
      response.items.find((item) => item.classroomId === classroomId)
        ?.entries ?? [];
    return entries.map(mapBackendEntryToUi);
  },

  async fetchAllTimetablesForTerm(termId) {
    const response = await getDashboardTimetable({ termId });
    return response.items
      .flatMap((item) => item.entries)
      .map(mapBackendEntryToUi);
  },

  async upsertTimetableEntries() {
    throw new Error(
      "Use bulkSaveEntries with backend timetable metadata for the new timetable API.",
    );
  },

  async deleteTimetableEntry() {
    throw new Error("Use deleteEntry with a backend entry id.");
  },

  async validateTimetable() {
    throw new Error(
      "Use validate with termId and optional grade/classroom filters.",
    );
  },

  async publishTimetable() {
    throw new Error("Use publish with a backend timetableConfigId.");
  },

  async unpublishTimetable(termId, sectionId, classroomId) {
    await unpublish({
      termId,
      classroomId,
    });
  },

  detectConflicts,
});

export const createTimetableConflictRequest = (
  entries: TimetableEntry[],
  sections: Array<{ id: string; nameAr: string; nameEn: string }>,
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>,
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>,
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>,
): {
  entries: TimetableEntry[];
  sections: Array<{ id: string; nameAr: string; nameEn: string }>;
  classrooms: Array<{ id: string; nameAr: string; nameEn: string }>;
  teachers: Array<{ id: string; nameAr: string; nameEn: string }>;
  rooms: Array<{ id: string; nameAr: string; nameEn: string }>;
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>;
} => ({
  entries,
  sections,
  classrooms,
  teachers,
  rooms,
  subjects,
});

export type { TimetableConflict, TimetableEntry, TimetableValidationResult };
