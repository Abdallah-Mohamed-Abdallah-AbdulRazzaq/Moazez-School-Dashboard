import { previewApplicationEnrollment } from "@/features/admissions/applications/api/applicationRegistrationApi";
import type { EnrollmentHandoffPreviewDto } from "@/features/admissions/applications/api/registrationDtos";

export type EnrollmentHandoffPreview = EnrollmentHandoffPreviewDto;

export async function createEnrollmentHandoffPreview(
  applicationId: string,
): Promise<EnrollmentHandoffPreview> {
  return previewApplicationEnrollment(applicationId);
}

export function getEnrollmentFriendlyErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    [400, 409, 422].includes(Number((error as { status?: number }).status))
  ) {
    return "This application is not eligible for enrollment yet.";
  }
  return null;
}
