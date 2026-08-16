import { apiGet, apiPost } from "@/lib/api";
import { unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import type {
  EnrollmentHandoffPreviewDto,
  RegisterApplicationRequest,
  RegisterApplicationResponseDto,
  RegistrationHandoffResponseDto,
} from "./registrationDtos";

const applicationEndpoint = (applicationId: string) =>
  `/admissions/applications/${applicationId}`;

export async function previewApplicationEnrollment(
  applicationId: string,
): Promise<EnrollmentHandoffPreviewDto> {
  const response = await apiPost<unknown>(`${applicationEndpoint(applicationId)}/enroll`, {});
  return unwrapItemResponse(response, "enrollment handoff") as EnrollmentHandoffPreviewDto;
}

export async function getApplicationRegistrationHandoff(
  applicationId: string,
): Promise<RegistrationHandoffResponseDto> {
  const response = await apiGet<unknown>(
    `${applicationEndpoint(applicationId)}/registration-handoff`,
  );
  return unwrapItemResponse(response, "registration handoff") as RegistrationHandoffResponseDto;
}

export async function registerApplication(
  applicationId: string,
  payload: RegisterApplicationRequest,
): Promise<RegisterApplicationResponseDto> {
  const response = await apiPost<unknown>(`${applicationEndpoint(applicationId)}/register`, payload);
  return unwrapItemResponse(response, "application registration") as RegisterApplicationResponseDto;
}

