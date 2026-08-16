import { apiGet, apiPatch } from "@/lib/api";
import { unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import type { WorkflowPolicySource } from "../../applications/api/applicationDtos";

export interface AdmissionWorkflowPolicy { requiresPlacementTest: boolean; requiresInterview: boolean; allowDirectAcceptance: boolean; source: WorkflowPolicySource; updatedAt: string | null; }
export type UpdateAdmissionWorkflowPolicy = Partial<Pick<AdmissionWorkflowPolicy, "requiresPlacementTest" | "requiresInterview" | "allowDirectAcceptance">>;
const ENDPOINT = "/admissions/workflow-policy";
export async function getAdmissionWorkflowPolicy(): Promise<AdmissionWorkflowPolicy> {
  return unwrapItemResponse(await apiGet<unknown>(ENDPOINT), "admissions workflow policy") as AdmissionWorkflowPolicy;
}
export async function updateAdmissionWorkflowPolicy(payload: UpdateAdmissionWorkflowPolicy): Promise<AdmissionWorkflowPolicy> {
  if (Object.keys(payload).length === 0) throw new Error("At least one workflow policy field is required.");
  return unwrapItemResponse(await apiPatch<unknown>(ENDPOINT, payload), "updated admissions workflow policy") as AdmissionWorkflowPolicy;
}
