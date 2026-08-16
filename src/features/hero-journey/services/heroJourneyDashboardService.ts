import { apiGet } from "@/lib/api";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  type ReinforcementQueryParams,
} from "@/features/reinforcement/services/reinforcementApiUtils";

const HERO_ENDPOINT = "/reinforcement/hero";

export interface HeroJourneyDateRangeParams extends ReinforcementQueryParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface HeroJourneyOverviewParams extends HeroJourneyDateRangeParams {
  stageId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
}

async function getDashboardResource(path: string, params?: ReinforcementQueryParams) {
  const query = buildReinforcementQueryString(params);
  return unwrapReinforcementItemResponse<Record<string, unknown>>(
    await apiGet<unknown>(`${HERO_ENDPOINT}${path}${query}`),
  );
}

export function getHeroJourneyOverview(params?: HeroJourneyOverviewParams) {
  return getDashboardResource("/overview", params);
}

export function getHeroJourneyStageSummary(stageId: string, params?: HeroJourneyDateRangeParams) {
  return getDashboardResource(`/stages/${stageId}/summary`, params);
}

export function getHeroJourneyClassroomSummary(classroomId: string, params?: HeroJourneyDateRangeParams) {
  return getDashboardResource(`/classrooms/${classroomId}/summary`, params);
}

export function getHeroJourneyBadgeSummary(params?: HeroJourneyDateRangeParams) {
  return getDashboardResource("/badge-summary", params);
}
