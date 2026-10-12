import { isApiError } from "@/lib/api-error";

export function uncertainImportCreation(error: unknown): boolean {
  return !isApiError(error) || error.status === 0 || error.status >= 500;
}
