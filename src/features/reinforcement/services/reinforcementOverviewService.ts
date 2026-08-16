import { apiGet } from "@/lib/api";
import type {
  ClassroomReinforcementSummary,
  ClassroomReinforcementSummaryParams,
  ReinforcementOverviewParams,
  ReinforcementOverviewResponse,
  StudentReinforcementProgress,
  StudentReinforcementProgressParams,
} from "../types";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
} from "./reinforcementApiUtils";

const OVERVIEW_ENDPOINT = "/reinforcement/overview";
const REINFORCEMENT_ENDPOINT = "/reinforcement";

export async function getReinforcementOverview(
  params?: ReinforcementOverviewParams,
): Promise<ReinforcementOverviewResponse> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(`${OVERVIEW_ENDPOINT}${query}`);
  return unwrapReinforcementItemResponse<ReinforcementOverviewResponse>(
    response,
  );
}

export async function getStudentReinforcementProgress(
  studentId: string,
  params?: StudentReinforcementProgressParams,
): Promise<StudentReinforcementProgress> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${REINFORCEMENT_ENDPOINT}/students/${studentId}/progress${query}`,
  );
  return unwrapReinforcementItemResponse<StudentReinforcementProgress>(
    response,
  );
}

export async function getClassroomReinforcementSummary(
  classroomId: string,
  params?: ClassroomReinforcementSummaryParams,
): Promise<ClassroomReinforcementSummary> {
  const query = buildReinforcementQueryString(params);
  const response = await apiGet<unknown>(
    `${REINFORCEMENT_ENDPOINT}/classrooms/${classroomId}/summary${query}`,
  );
  return unwrapReinforcementItemResponse<ClassroomReinforcementSummary>(
    response,
  );
}
