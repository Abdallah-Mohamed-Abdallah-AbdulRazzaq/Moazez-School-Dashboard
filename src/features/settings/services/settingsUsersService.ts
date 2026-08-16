import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  SettingsPaginationApiDto,
  SettingsUserApiDto,
  SettingsUserPayloadDto,
  SettingsUserRecord,
  SettingsUsersListApiDto,
  SettingsUserStatusPayloadDto,
  SettingsUserStatusResponseDto,
  SettingsUserUpdatePayloadDto,
} from "@/features/settings/types";

function mapUser(payload: SettingsUserApiDto): SettingsUserRecord {
  return {
    id: payload.id,
    fullName: payload.fullName,
    username: payload.username ?? undefined,
    email: payload.loginEmail ?? payload.email,
    contactEmail: payload.contactEmail ?? undefined,
    roleId: payload.roleId,
    roleName: payload.roleName ?? undefined,
    status: payload.status,
    lastActiveAt: payload.lastActiveAt ?? undefined,
    invitedAt: payload.invitedAt ?? undefined,
    lastInviteSentAt: payload.lastInviteSentAt ?? undefined,
  };
}

export interface FetchSettingsUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  roleId?: string;
  status?: SettingsUserRecord["status"] | "all";
}

export interface FetchSettingsUsersResult {
  items: SettingsUserRecord[];
  pagination: SettingsPaginationApiDto;
}

function toQueryString(params: FetchSettingsUsersParams): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.page && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  if (params.roleId && params.roleId !== "all") {
    query.set("roleId", params.roleId);
  }
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

export async function fetchSettingsUsers(
  params: FetchSettingsUsersParams = {},
): Promise<FetchSettingsUsersResult> {
  const query = toQueryString(params);
  const response = await apiGet<SettingsUsersListApiDto | SettingsUserApiDto[]>(
    `/settings/users${query}`,
  );
  const items = Array.isArray(response) ? response : response.items;
  const pagination = Array.isArray(response)
    ? {
        page: params.page || 1,
        limit: params.limit || items.length || 10,
        total: items.length,
      }
    : {
        page: response.pagination?.page || params.page || 1,
        limit: response.pagination?.limit || params.limit || items.length || 10,
        total: response.pagination?.total || items.length,
      };

  return {
    items: items.map(mapUser),
    pagination,
  };
}

export async function inviteSettingsUser(
  payload: SettingsUserPayloadDto,
): Promise<SettingsUserRecord> {
  const response = await apiPost<SettingsUserApiDto>(
    "/settings/users/invite",
    payload,
  );
  return mapUser(response);
}

export async function createSettingsUser(
  payload: SettingsUserPayloadDto,
): Promise<SettingsUserRecord> {
  const response = await apiPost<SettingsUserApiDto>("/settings/users", payload);
  return mapUser(response);
}

export async function updateSettingsUser(
  userId: string,
  payload: SettingsUserUpdatePayloadDto,
): Promise<SettingsUserRecord> {
  const response = await apiPatch<SettingsUserApiDto>(
    `/settings/users/${userId}`,
    payload,
  );
  return mapUser(response);
}

export async function setSettingsUserStatus(
  userId: string,
  status: SettingsUserStatusPayloadDto["status"],
): Promise<SettingsUserStatusResponseDto> {
  const payload: SettingsUserStatusPayloadDto = { status };
  return apiPatch<SettingsUserStatusResponseDto>(
    `/settings/users/${userId}/status`,
    payload,
  );
}
