import { apiClient, apiGet, apiPost } from "@/lib/api";
import { downloadBackendAttachment } from "@/features/students-guardians/shared/utils/downloadBackendAttachment";
import type {
  BulkRegistrationBatch,
  BulkRegistrationBatchDetail,
  BulkRegistrationPlacementInput,
  BulkRegistrationPreflight,
  BulkRegistrationRowsPage,
  BulkRegistrationRowsQuery,
} from "./bulkRegistrationDtos";

const BULK_REGISTRATIONS_PATH = "/students-guardians/bulk-registrations";
const TEMPLATE_FILENAME = "student-bulk-registration-v1.csv";

function createPlacementPayload({
  academicYearId,
  termId,
  classroomId,
  enrollmentDate,
}: BulkRegistrationPlacementInput): BulkRegistrationPlacementInput {
  return {
    academicYearId,
    ...(termId === undefined ? {} : { termId }),
    classroomId,
    enrollmentDate,
  };
}

export async function preflightBulkRegistration(
  input: BulkRegistrationPlacementInput,
): Promise<BulkRegistrationPreflight> {
  return apiPost<BulkRegistrationPreflight>(
    `${BULK_REGISTRATIONS_PATH}/preflight`,
    createPlacementPayload(input),
  );
}

export function downloadBulkRegistrationTemplate(): Promise<void> {
  return downloadBackendAttachment(
    `${BULK_REGISTRATIONS_PATH}/template`,
    TEMPLATE_FILENAME,
  );
}

export async function createBulkRegistration(
  input: BulkRegistrationPlacementInput,
  file: File,
): Promise<BulkRegistrationBatch> {
  const placement = createPlacementPayload(input);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("academicYearId", placement.academicYearId);
  if (placement.termId !== undefined) {
    formData.append("termId", placement.termId);
  }
  formData.append("classroomId", placement.classroomId);
  formData.append("enrollmentDate", placement.enrollmentDate);

  const response = await apiClient.post<BulkRegistrationBatch>(
    BULK_REGISTRATIONS_PATH,
    formData,
    { headers: { "Content-Type": undefined } },
  );
  return response.data;
}

export async function getBulkRegistrationBatch(
  batchId: string,
  signal?: AbortSignal,
): Promise<BulkRegistrationBatchDetail> {
  return apiGet<BulkRegistrationBatchDetail>(
    `${BULK_REGISTRATIONS_PATH}/${batchId}`,
    signal ? { signal } : undefined,
  );
}

export async function listBulkRegistrationRows(
  batchId: string,
  query: BulkRegistrationRowsQuery,
  signal?: AbortSignal,
): Promise<BulkRegistrationRowsPage> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.status) searchParams.set("status", query.status);

  return apiGet<BulkRegistrationRowsPage>(
    `${BULK_REGISTRATIONS_PATH}/${batchId}/rows?${searchParams.toString()}`,
    signal ? { signal } : undefined,
  );
}

export async function confirmBulkRegistration(
  batchId: string,
): Promise<BulkRegistrationBatchDetail> {
  return apiPost<BulkRegistrationBatchDetail>(
    `${BULK_REGISTRATIONS_PATH}/${batchId}/confirm`,
  );
}
