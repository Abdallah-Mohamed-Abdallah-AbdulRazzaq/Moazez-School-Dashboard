import { apiGet, apiPatch } from "@/lib/api";
import { isApiError } from "@/lib/api-error";
import type { StudentMedicalProfile } from "@/features/students-guardians/students/types";
import {
  normalizeMedicalProfile,
  unwrapItemResponse,
} from "@/features/students-guardians/services/studentsGuardiansApiUtils";

const STUDENTS_BASE_PATH = "/students-guardians/students";

interface UpdateStudentMedicalProfilePayload {
  bloodType?: string;
  allergies?: string;
  notes?: string;
  conditions?: string[];
  medications?: string[];
}

function normalizeOptionalText(value?: string) {
  return value === undefined ? undefined : value.trim();
}

function normalizeMedicalList(values?: string[]) {
  if (values === undefined) return undefined;

  return values
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function isMissingMedicalProfileResponse(response: unknown): boolean {
  if (response == null || response === "") return true;

  if (Array.isArray(response)) return response.length === 0;

  if (!response || typeof response !== "object") return false;

  const envelope = response as Record<string, unknown>;
  if (Object.keys(envelope).length === 0) return true;

  return ["data", "result", "payload"].some((key) => {
    const envelopeValue = envelope[key];
    return (
      envelopeValue === null ||
      (Array.isArray(envelopeValue) && envelopeValue.length === 0)
    );
  });
}

function mapMedicalProfileToUpdatePayload(
  profile: Partial<StudentMedicalProfile>,
): UpdateStudentMedicalProfilePayload {
  return {
    bloodType: normalizeOptionalText(profile.blood_type),
    allergies: normalizeOptionalText(profile.allergies),
    notes: normalizeOptionalText(profile.notes),
    conditions: normalizeMedicalList(profile.conditions),
    medications: normalizeMedicalList(profile.medications),
  };
}

export async function fetchMedicalProfile(
  studentId: string,
): Promise<StudentMedicalProfile | null> {
  try {
    const response = await apiGet<unknown>(
      `${STUDENTS_BASE_PATH}/${studentId}/medical-profile`,
    );
    if (isMissingMedicalProfileResponse(response)) {
      return null;
    }
    return normalizeMedicalProfile(
      unwrapItemResponse(response, "Medical profile"),
    );
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertMedicalProfile(
  studentId: string,
  payload: Partial<StudentMedicalProfile>,
): Promise<StudentMedicalProfile> {
  const response = await apiPatch<unknown>(
    `${STUDENTS_BASE_PATH}/${studentId}/medical-profile`,
    mapMedicalProfileToUpdatePayload(payload),
  );
  return normalizeMedicalProfile(
    unwrapItemResponse(response, "Updated medical profile"),
  );
}
