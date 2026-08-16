import { isApiError } from "@/lib/api-error";

const ENROLLMENT_NOT_FOUND_MESSAGE = "enrollment not found";

export function isStudentEnrollmentNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  if (!message.includes(ENROLLMENT_NOT_FOUND_MESSAGE)) return false;

  if (!isApiError(error)) return true;

  return error.status === 404 || error.code.toLowerCase() === "not_found";
}
