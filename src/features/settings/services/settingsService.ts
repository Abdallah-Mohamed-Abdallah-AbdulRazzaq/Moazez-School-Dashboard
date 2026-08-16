import { apiGet } from "@/lib/api";
import { unwrapArrayResponse } from "@/features/admissions/shared/services/admissionsApiUtils";
import type {
  AdmissionRequiredDocument,
  AuditLogEntry,
  BackupHistoryEntry,
  IntegrationProviderStatus,
  NotificationTemplateConfig,
  PolicySettings,
} from "@/features/settings/types";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: ApiRecord, key: string, fallback = ""): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function readNumber(
  record: ApiRecord,
  key: string,
  fallback: number,
): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readBoolean(record: ApiRecord, key: string): boolean {
  const value = record[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

function readStringArray(record: ApiRecord, key: string): string[] {
  const value = record[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function mapAdmissionRequiredDocument(
  input: unknown,
  index: number,
): AdmissionRequiredDocument {
  if (!isRecord(input)) {
    throw new Error("Invalid admission required document response.");
  }

  const id = readString(input, "id");
  const title = readString(input, "title");
  if (!id || !title) {
    throw new Error(
      "Admission required document response is missing an id or title.",
    );
  }

  return {
    id,
    title,
    description: readString(input, "description"),
    isMandatory: readBoolean(input, "isMandatory"),
    acceptedFileTypes: readStringArray(input, "acceptedFileTypes"),
    maxFiles: Math.max(1, readNumber(input, "maxFiles", 1)),
    sortOrder: readNumber(input, "sortOrder", index + 1),
  };
}

function unsupportedSettingsEndpoint(): never {
  throw new Error("settings_endpoint_not_available");
}

export async function fetchPolicySettings(): Promise<PolicySettings> {
  return unsupportedSettingsEndpoint();
}

export async function updatePolicySettings(
  payload: PolicySettings,
): Promise<PolicySettings> {
  void payload;
  return unsupportedSettingsEndpoint();
}

export async function fetchAdmissionRequiredDocumentsForSchool(
  schoolId: string,
): Promise<AdmissionRequiredDocument[]> {
  const encodedSchoolId = encodeURIComponent(schoolId);
  const response = await apiGet<unknown>(
    `/applicant-portal/schools/${encodedSchoolId}/admission-required-documents`,
  );

  return unwrapArrayResponse(response, "admission required documents")
    .map(mapAdmissionRequiredDocument)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export async function fetchNotificationTemplates(): Promise<
  NotificationTemplateConfig[]
> {
  return unsupportedSettingsEndpoint();
}

export async function updateNotificationTemplate(
  templateId: string,
  payload: NotificationTemplateConfig,
): Promise<NotificationTemplateConfig> {
  void templateId;
  void payload;
  return unsupportedSettingsEndpoint();
}

export async function runTemplateTest(
  templateId: string,
): Promise<NotificationTemplateConfig> {
  void templateId;
  return unsupportedSettingsEndpoint();
}

export async function fetchIntegrations(): Promise<
  IntegrationProviderStatus[]
> {
  return unsupportedSettingsEndpoint();
}

export async function fetchIntegrationById(
  integrationId: string,
): Promise<IntegrationProviderStatus> {
  void integrationId;
  return unsupportedSettingsEndpoint();
}

export async function updateIntegrationConfiguration(
  integrationId: string,
  values: Record<string, string>,
): Promise<IntegrationProviderStatus> {
  void integrationId;
  void values;
  return unsupportedSettingsEndpoint();
}

export async function testIntegrationConnection(
  integrationId: string,
): Promise<IntegrationProviderStatus> {
  void integrationId;
  return unsupportedSettingsEndpoint();
}

export async function fetchAuditLogEntries(): Promise<AuditLogEntry[]> {
  return unsupportedSettingsEndpoint();
}

export async function fetchBackupHistory(): Promise<BackupHistoryEntry[]> {
  return unsupportedSettingsEndpoint();
}

export async function createBackupJob(payload: {
  type: BackupHistoryEntry["type"];
  note?: string;
}): Promise<BackupHistoryEntry> {
  void payload;
  return unsupportedSettingsEndpoint();
}

export async function importSettingsSnapshot(
  note?: string,
): Promise<BackupHistoryEntry> {
  void note;
  return unsupportedSettingsEndpoint();
}

export async function exportSettingsSnapshot(
  note?: string,
): Promise<BackupHistoryEntry> {
  void note;
  return unsupportedSettingsEndpoint();
}
