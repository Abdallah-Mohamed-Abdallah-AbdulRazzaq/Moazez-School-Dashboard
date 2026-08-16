import type { Application } from "@/features/admissions/types/admissions";
import type { ApplicationCreationPayload } from "./applicationCreationService";
import {
  getApplication,
  listApplications,
  patchApplication,
  postApplication,
  postApplicationSubmission,
} from "../api/applicationsApi";
import type {
  ApplicationSourceDto,
  ApplicationStatusDto,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "../api/applicationDtos";
import { toLegacyApplication } from "../model/mappers";

export interface FetchApplicationsParams {
  status?: ApplicationStatusDto;
}

export type CreateApplicationPayload =
  | (ApplicationCreationPayload & { requestedAcademicYearId?: string })
  | CreateApplicationRequest;

export type UpdateApplicationPayload = UpdateApplicationRequest;

const isStepperPayload = (
  payload: CreateApplicationPayload,
): payload is ApplicationCreationPayload => "student" in payload;

function toCreateRequest(payload: CreateApplicationPayload): CreateApplicationRequest {
  if (!isStepperPayload(payload)) {
    return {
      ...payload,
      studentName: payload.studentName.trim(),
      source: payload.source,
    };
  }

  return {
    leadId: payload.leadId,
    studentName: (payload.student.full_name_en || payload.student.full_name_ar).trim(),
    requestedAcademicYearId: payload.requestedAcademicYearId,
    requestedGradeId: payload.student.grade_requested,
    source: (payload.source || "other") as ApplicationSourceDto,
  };
}

export async function fetchApplications(
  params: FetchApplicationsParams = {},
): Promise<Application[]> {
  return (await listApplications(params.status)).map(toLegacyApplication);
}

export async function fetchApplicationById(id: string): Promise<Application> {
  return toLegacyApplication(await getApplication(id));
}

export async function createApplication(
  payload: CreateApplicationPayload,
): Promise<Application> {
  return toLegacyApplication(await postApplication(toCreateRequest(payload)));
}

export async function updateApplication(
  id: string,
  payload: UpdateApplicationPayload,
): Promise<Application> {
  return toLegacyApplication(await patchApplication(id, payload));
}

export async function submitApplication(id: string): Promise<Application> {
  return toLegacyApplication(await postApplicationSubmission(id));
}
