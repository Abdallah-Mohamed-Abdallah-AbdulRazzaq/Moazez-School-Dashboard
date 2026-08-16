import { apiGet, apiPost } from "@/lib/api";
import { fetchAllSettingsRoles } from "@/features/settings/services/settingsRolesService";
import type {
  BulkCredentialPreviewRequest,
  BulkCredentialPreviewResponse,
  BulkCredentialPreviewResponseDto,
  BulkGenerateCredentialsRequest,
  BulkGenerateCredentialsResponse,
  BulkGenerateCredentialsResponseDto,
  CredentialRoleOption,
  CredentialStatusListResponse,
  CredentialStatusRecord,
  CredentialUserSummaryDto,
  FetchCredentialStatusParams,
  GeneratedCredentialResponseDto,
  OneTimeCredentialResponse,
  SetCredentialPasswordRequest,
} from "@/features/settings/credentials/types";
import type { RoleDefinition } from "@/features/settings/types";

function mapCredentialPreviewUser(user: CredentialUserSummaryDto) {
  return {
    userId: user.userId,
    fullName: user.fullName,
    username: user.username,
    loginEmail: user.loginEmail,
    contactEmail: user.contactEmail,
  };
}

function toCredentialStatusQuery(params: FetchCredentialStatusParams): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  if (params.roleKey) query.set("roleKey", params.roleKey);
  if (params.userType) query.set("userType", params.userType);
  if (params.credentialStatus && params.credentialStatus !== "all") {
    query.set("credentialStatus", params.credentialStatus);
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function mapGeneratedCredentialResponse(
  response: GeneratedCredentialResponseDto,
): OneTimeCredentialResponse {
  return {
    userId: response.user.userId,
    fullName: response.user.fullName ?? undefined,
    username: response.user.username ?? undefined,
    loginEmail: response.user.loginEmail ?? undefined,
    temporaryPassword: response.temporaryPassword ?? undefined,
    mustChangePassword: response.mustChangePassword,
    passwordProvisionedAt: response.generatedAt ?? undefined,
    credentialVersion: response.credentialVersion ?? undefined,
  };
}

export function mapBulkCredentialPreviewResponse(
  response: BulkCredentialPreviewResponseDto,
): BulkCredentialPreviewResponse {
  return {
    eligibleCount: response.eligible,
    skippedCount: response.skipped,
    totalMatched: response.totalMatched,
    skippedReasons: response.skippedReasons,
    recipients: [
      ...response.sample.eligible.map((user) => ({
        ...mapCredentialPreviewUser(user),
        eligible: true,
      })),
      ...response.sample.skipped.map(({ user, reason }) => ({
        ...mapCredentialPreviewUser(user),
        eligible: false,
        skipReason: reason,
      })),
    ],
  };
}

export function getBulkCredentialPreviewPayloadKey(
  payload: BulkCredentialPreviewRequest,
): string {
  return JSON.stringify({
    scope: payload.scope,
    userIds: [...(payload.userIds ?? [])].sort(),
    roleKeys: [...(payload.roleKeys ?? [])].sort(),
    userTypes: [...(payload.userTypes ?? [])].sort(),
    includeUsersWithPassword: Boolean(payload.includeUsersWithPassword),
    includeDisabledUsers: Boolean(payload.includeDisabledUsers),
  });
}

export function mapBulkGenerateCredentialsResponse(
  response: BulkGenerateCredentialsResponseDto,
): BulkGenerateCredentialsResponse {
  return {
    generatedCount: response.generated,
    skippedCount: response.skipped,
    credentials: response.items.map((item) => ({
      userId: item.user.userId,
      fullName: item.user.fullName ?? undefined,
      username: item.user.username ?? undefined,
      loginEmail: item.user.loginEmail ?? undefined,
      temporaryPassword: item.temporaryPassword ?? undefined,
      mustChangePassword: true,
    })),
  };
}

export async function fetchCredentialStatuses(
  params: FetchCredentialStatusParams = {},
): Promise<CredentialStatusListResponse> {
  return apiGet<CredentialStatusListResponse>(
    `/settings/users/credentials/status${toCredentialStatusQuery(params)}`,
  );
}

function credentialRolesFromRecords(
  records: CredentialStatusRecord[],
): CredentialRoleOption[] {
  const rolesByKey = new Map<string, CredentialRoleOption>();
  for (const record of records) {
    if (!rolesByKey.has(record.roleKey)) {
      rolesByKey.set(record.roleKey, {
        id: record.roleId,
        key: record.roleKey,
        name: record.roleName,
      });
    }
  }

  return Array.from(rolesByKey.values());
}

function mergeCredentialRoleKeys(
  roles: RoleDefinition[],
  credentialRoles: CredentialRoleOption[],
): CredentialRoleOption[] {
  const credentialRolesById = new Map(
    credentialRoles.map((role) => [role.id, role]),
  );
  return roles.map((role) => ({
    id: role.id,
    key:
      (role.isKeyDerived ? undefined : role.key) ??
      credentialRolesById.get(role.id)?.key,
    name: role.name,
  }));
}

export async function fetchCredentialRoles(): Promise<CredentialRoleOption[]> {
  const [roles, firstPage] = await Promise.all([
    fetchAllSettingsRoles(),
    fetchCredentialStatuses({ page: 1, limit: 100 }),
  ]);
  const pageCount = firstPage.pagination
    ? Math.ceil(firstPage.pagination.total / firstPage.pagination.limit)
    : 1;
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
      fetchCredentialStatuses({ page: index + 2, limit: 100 }),
    ),
  );
  const credentialRoles = credentialRolesFromRecords([
    ...firstPage.items,
    ...remainingPages.flatMap((page) => page.items),
  ]);
  return mergeCredentialRoleKeys(roles, credentialRoles);
}

export async function previewBulkCredentials(
  payload: BulkCredentialPreviewRequest,
): Promise<BulkCredentialPreviewResponse> {
  const response = await apiPost<BulkCredentialPreviewResponseDto>(
    "/settings/users/credentials/bulk-preview",
    payload,
  );
  return mapBulkCredentialPreviewResponse(response);
}

export async function generateBulkCredentials(
  payload: BulkGenerateCredentialsRequest,
): Promise<BulkGenerateCredentialsResponse> {
  const response = await apiPost<BulkGenerateCredentialsResponseDto>(
    "/settings/users/credentials/bulk-generate",
    payload,
  );
  return mapBulkGenerateCredentialsResponse(response);
}

export async function generateUserCredential(
  userId: string,
): Promise<OneTimeCredentialResponse> {
  const response = await apiPost<GeneratedCredentialResponseDto>(
    `/settings/users/${userId}/credentials/generate`,
  );
  return mapGeneratedCredentialResponse(response);
}

export async function setUserCredentialPassword(
  userId: string,
  payload: SetCredentialPasswordRequest,
): Promise<OneTimeCredentialResponse> {
  const response = await apiPost<GeneratedCredentialResponseDto>(
    `/settings/users/${userId}/credentials/set`,
    payload,
  );
  return mapGeneratedCredentialResponse(response);
}

export async function regenerateUserCredential(
  userId: string,
): Promise<OneTimeCredentialResponse> {
  const response = await apiPost<GeneratedCredentialResponseDto>(
    `/settings/users/${userId}/credentials/regenerate`,
  );
  return mapGeneratedCredentialResponse(response);
}
