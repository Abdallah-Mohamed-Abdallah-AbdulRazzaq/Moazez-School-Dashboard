import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  BackendTimetablePeriodDto,
  CreatePeriodRequest,
  ListResponse,
  UpdatePeriodRequest,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";

const BASE = "/academics/timetable";

const listResponseItems = <T>(response: ListResponse<T> | T[]): T[] =>
  Array.isArray(response) ? response : response.items;

const mapBackendPeriodToUi = (
  dto: BackendTimetablePeriodDto,
): TimetablePeriod => ({
  id: dto.id,
  index: dto.index,
  nameAr: dto.label,
  nameEn: dto.label,
  startTime: dto.startTime,
  endTime: dto.endTime,
});

export async function listTimetablePeriods(
  timetableConfigId: string,
): Promise<TimetablePeriod[]> {
  const periods = await listTimetablePeriodDtos(timetableConfigId);
  return periods.map(mapBackendPeriodToUi);
}

export async function listTimetablePeriodDtos(
  timetableConfigId: string,
): Promise<BackendTimetablePeriodDto[]> {
  const response = await apiGet<
    ListResponse<BackendTimetablePeriodDto> | BackendTimetablePeriodDto[]
  >(`${BASE}/periods`, {
    params: { timetableConfigId },
  });
  return listResponseItems(response);
}

export async function createTimetablePeriod(
  payload: CreatePeriodRequest,
): Promise<TimetablePeriod> {
  const period = await createTimetablePeriodDto(payload);
  return mapBackendPeriodToUi(period);
}

export async function createTimetablePeriodDto(
  payload: CreatePeriodRequest,
): Promise<BackendTimetablePeriodDto> {
  const period = await apiPost<BackendTimetablePeriodDto>(
    `${BASE}/periods`,
    payload,
  );
  return period;
}

export async function updateTimetablePeriod(
  periodId: string,
  payload: UpdatePeriodRequest,
): Promise<TimetablePeriod> {
  const period = await updateTimetablePeriodDto(periodId, payload);
  return mapBackendPeriodToUi(period);
}

export async function updateTimetablePeriodDto(
  periodId: string,
  payload: UpdatePeriodRequest,
): Promise<BackendTimetablePeriodDto> {
  const period = await apiPatch<BackendTimetablePeriodDto>(
    `${BASE}/periods/${periodId}`,
    payload,
  );
  return period;
}

export async function deleteTimetablePeriod(periodId: string): Promise<void> {
  await apiDelete<void>(`${BASE}/periods/${periodId}`);
}
