import { apiGet, apiPut } from "@/lib/api";
import type {
  BackendTimetableConfigDto,
  TimetableConfigEnvelopeDto,
  TimetableScopeType,
  UpsertConfigRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { listTimetablePeriods } from "@/features/academics/timetable/services/timetablePeriodsService";
import { isTimetableConfigNotFound } from "@/features/academics/timetable/services/timetableErrorHandling";
import {
  type TimetableConfig,
  type TimetableConfigScope,
  type TimetableDay,
  type TimetablePeriod,
} from "@/features/academics/timetable/types/timetableConfig";

export type { TimetableConfig } from "@/features/academics/timetable/types/timetableConfig";

const BASE = "/academics/timetable";

type QueryParamValue = string | number | undefined;

export interface FetchTimetableConfigParams {
  academicYearId?: string;
  termId: string;
  scopeType?: TimetableScopeType;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export interface FetchTimetableConfigsParams {
  academicYearId?: string;
  termId: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export type TimetableConfigUpsertInput = Omit<
  TimetableConfig,
  "id" | "updatedAt"
> & {
  id?: string;
  academicYearId: string;
  name?: string;
};

const dayNames = [
  { key: "sun", nameAr: "\u0627\u0644\u0623\u062d\u062f", nameEn: "Sunday" },
  {
    key: "mon",
    nameAr: "\u0627\u0644\u0625\u062b\u0646\u064a\u0646",
    nameEn: "Monday",
  },
  {
    key: "tue",
    nameAr: "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621",
    nameEn: "Tuesday",
  },
  {
    key: "wed",
    nameAr: "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621",
    nameEn: "Wednesday",
  },
  {
    key: "thu",
    nameAr: "\u0627\u0644\u062e\u0645\u064a\u0633",
    nameEn: "Thursday",
  },
  {
    key: "fri",
    nameAr: "\u0627\u0644\u062c\u0645\u0639\u0629",
    nameEn: "Friday",
  },
  { key: "sat", nameAr: "\u0627\u0644\u0633\u0628\u062a", nameEn: "Saturday" },
] as const;

const requestConfig = (params: Record<string, QueryParamValue>) => ({
  params: Object.fromEntries(
    Object.entries(params).filter(
      ([, paramValue]) => typeof paramValue !== "undefined",
    ),
  ),
});

const activeDayNumbers = (days: TimetableDay[]): number[] =>
  days.filter((day) => day.isActive).map((day) => day.index);

const weekStartDay = (days: TimetableDay[]): number =>
  activeDayNumbers(days)[0] ?? 0;

const scopeId = (dto: BackendTimetableConfigDto): string | undefined =>
  dto.classroomId ?? dto.sectionId ?? dto.gradeId ?? undefined;

const mapScopeType = (
  scopeType: BackendTimetableConfigDto["scopeType"],
): TimetableConfigScope => scopeType.toUpperCase() as TimetableConfigScope;

const mapConfigDays = (activeDays: number[]): TimetableDay[] =>
  dayNames.map((dayName, index) => ({
    key: dayName.key,
    index,
    nameAr: dayName.nameAr,
    nameEn: dayName.nameEn,
    isActive: activeDays.includes(index),
  }));

const mapBackendConfigToUi = (
  dto: BackendTimetableConfigDto,
  periods: TimetablePeriod[],
): TimetableConfig => ({
  id: dto.id || dto.timetableConfigId || "",
  termId: dto.termId,
  scopeType: mapScopeType(dto.scopeType),
  scopeId: scopeId(dto),
  days: mapConfigDays(dto.activeDays),
  periods,
  updatedAt: dto.updatedAt,
});

const unwrapConfig = (
  response: BackendTimetableConfigDto | TimetableConfigEnvelopeDto,
): BackendTimetableConfigDto => {
  if ("data" in response && response.data) {
    return response.data;
  }
  return response as BackendTimetableConfigDto;
};

const buildConfigRequest = (
  payload: TimetableConfigUpsertInput,
): UpsertConfigRequest => ({
  academicYearId: payload.academicYearId,
  termId: payload.termId,
  scopeType: payload.scopeType,
  gradeId: payload.scopeType === "GRADE" ? payload.scopeId : undefined,
  sectionId: payload.scopeType === "SECTION" ? payload.scopeId : undefined,
  classroomId: payload.scopeType === "CLASSROOM" ? payload.scopeId : undefined,
  name: payload.name ?? `${payload.scopeType} timetable config`,
  weekStartDay: weekStartDay(payload.days),
  activeDays: activeDayNumbers(payload.days),
  status: "DRAFT",
});

export async function fetchTimetableConfig(
  params: FetchTimetableConfigParams,
): Promise<TimetableConfig | null>;
export async function fetchTimetableConfig(
  termId: string,
  scopeType: TimetableConfigScope,
  scopeId?: string,
): Promise<TimetableConfig | null>;
export async function fetchTimetableConfig(
  paramsOrTermId: FetchTimetableConfigParams | string,
  scopeType?: TimetableConfigScope,
  scopeId?: string,
): Promise<TimetableConfig | null> {
  const params =
    typeof paramsOrTermId === "string"
      ? legacyConfigParams(paramsOrTermId, scopeType, scopeId)
      : paramsOrTermId;

  try {
    const configResponse = await apiGet<
      BackendTimetableConfigDto | TimetableConfigEnvelopeDto
    >(
      `${BASE}/config`,
      requestConfig({
        academicYearId: params.academicYearId,
        termId: params.termId,
        scopeType: params.scopeType,
        gradeId: params.gradeId,
        sectionId: params.sectionId,
        classroomId: params.classroomId,
      }),
    );
    const config = unwrapConfig(configResponse);
    const periods = await listTimetablePeriods(config.id);
    return mapBackendConfigToUi(config, periods);
  } catch (error) {
    if (isTimetableConfigNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchTimetableConfigs(
  params: FetchTimetableConfigsParams,
): Promise<TimetableConfig[]>;
export async function fetchTimetableConfigs(
  termId: string,
): Promise<TimetableConfig[]>;
export async function fetchTimetableConfigs(
  paramsOrTermId: FetchTimetableConfigsParams | string,
): Promise<TimetableConfig[]> {
  const params =
    typeof paramsOrTermId === "string"
      ? { termId: paramsOrTermId }
      : paramsOrTermId;

  const configRequests = [
    fetchTimetableConfig({
      academicYearId: params.academicYearId,
      termId: params.termId,
      scopeType: "TERM",
    }),
    params.gradeId
      ? fetchTimetableConfig({
          academicYearId: params.academicYearId,
          termId: params.termId,
          scopeType: "GRADE",
          gradeId: params.gradeId,
        })
      : Promise.resolve(null),
    params.sectionId
      ? fetchTimetableConfig({
          academicYearId: params.academicYearId,
          termId: params.termId,
          scopeType: "SECTION",
          gradeId: params.gradeId,
          sectionId: params.sectionId,
        })
      : Promise.resolve(null),
    params.classroomId
      ? fetchTimetableConfig({
          academicYearId: params.academicYearId,
          termId: params.termId,
          scopeType: "CLASSROOM",
          gradeId: params.gradeId,
          sectionId: params.sectionId,
          classroomId: params.classroomId,
        })
      : Promise.resolve(null),
  ];

  const configs = await Promise.all(configRequests);
  return configs.filter((config): config is TimetableConfig => config !== null);
}

function legacyConfigParams(
  termId: string,
  scopeType: TimetableConfigScope = "TERM",
  scopeId?: string,
): FetchTimetableConfigParams {
  return {
    termId,
    scopeType,
    gradeId: scopeType === "GRADE" ? scopeId : undefined,
    sectionId: scopeType === "SECTION" ? scopeId : undefined,
    classroomId: scopeType === "CLASSROOM" ? scopeId : undefined,
  };
}

export async function upsertTimetableConfig(
  payload: TimetableConfigUpsertInput,
): Promise<TimetableConfig> {
  const config = await upsertBackendTimetableConfig(
    buildConfigRequest(payload),
  );
  const periods = await listTimetablePeriods(config.id);
  return mapBackendConfigToUi(config, periods);
}

export async function upsertBackendTimetableConfig(
  payload: UpsertConfigRequest,
): Promise<BackendTimetableConfigDto> {
  const response = await apiPut<
    BackendTimetableConfigDto | TimetableConfigEnvelopeDto
  >(`${BASE}/config`, payload);
  return unwrapConfig(response);
}

export async function deleteTimetableConfig(): Promise<void> {
  throw new Error(
    "Deleting timetable configs is not supported by the backend API.",
  );
}

export async function resetTimetableConfig(): Promise<void> {
  throw new Error(
    "Reset timetable config by selecting a different existing scope config.",
  );
}

export function getDefaultDays(): TimetableDay[] {
  return mapConfigDays([0, 1, 2, 3, 4]);
}

export function generateDefaultPeriods(count: number): TimetablePeriod[] {
  return Array.from({ length: count }, (_, periodIndex) => ({
    id: `p${periodIndex + 1}`,
    index: periodIndex + 1,
    nameAr: `\u0627\u0644\u062d\u0635\u0629 ${periodIndex + 1}`,
    nameEn: `Period ${periodIndex + 1}`,
  }));
}

export function validatePeriodTimes(periods: TimetablePeriod[]): {
  valid: boolean;
  errors: string[];
} {
  const errors = periods
    .filter(
      (period) =>
        period.startTime &&
        period.endTime &&
        period.startTime >= period.endTime,
    )
    .map(
      (period) => `Period ${period.index}: Start time must be before end time`,
    );

  return {
    valid: errors.length === 0,
    errors,
  };
}
