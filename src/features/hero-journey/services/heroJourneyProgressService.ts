import { apiGet, apiPost } from "@/lib/api";
import { buildReinforcementQueryString, unwrapReinforcementItemResponse, type ReinforcementQueryParams } from "@/features/reinforcement/services/reinforcementApiUtils";

const HERO_ENDPOINT = "/reinforcement/hero";
type Query = ReinforcementQueryParams;

export interface HeroJourneyProgressMetadata {
  metadata?: Record<string, unknown> | null;
}

export interface StartHeroJourneyMissionPayload
  extends HeroJourneyProgressMetadata {
  enrollmentId?: string;
}

async function get(path: string, query?: Query) {
  return unwrapReinforcementItemResponse<Record<string, unknown>>(
    await apiGet<unknown>(`${HERO_ENDPOINT}${path}${buildReinforcementQueryString(query)}`),
  );
}
async function post(path: string, payload: HeroJourneyProgressMetadata) {
  return unwrapReinforcementItemResponse<Record<string, unknown>>(await apiPost<unknown>(`${HERO_ENDPOINT}${path}`, payload));
}
export const getStudentHeroJourneyProgress = (studentId: string, query?: Query) => get(`/students/${studentId}/progress`, query);
export const getHeroJourneyProgress = (progressId: string) => get(`/progress/${progressId}`);
export const startHeroJourneyMission = (
  studentId: string,
  missionId: string,
  payload: StartHeroJourneyMissionPayload = {},
) => post(`/students/${studentId}/missions/${missionId}/start`, payload);
export const completeHeroJourneyObjective = (
  progressId: string,
  objectiveId: string,
  payload: HeroJourneyProgressMetadata = {},
) => post(`/progress/${progressId}/objectives/${objectiveId}/complete`, payload);
export const completeHeroJourneyMission = (
  progressId: string,
  payload: HeroJourneyProgressMetadata = {},
) => post(`/progress/${progressId}/complete`, payload);
