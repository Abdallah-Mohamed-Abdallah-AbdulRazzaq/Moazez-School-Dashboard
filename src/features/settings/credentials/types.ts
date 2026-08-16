import type { SettingsPaginationApiDto } from "@/features/settings/types";

export interface CredentialStatusRecord {
  userId: string;
  fullName: string;
  username?: string | null;
  loginEmail: string;
  contactEmail?: string | null;
  userType: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: CredentialStatusFilter;
  hasPassword: boolean;
  mustChangePassword: boolean;
  passwordProvisionedAt?: string | null;
  passwordChangedAt?: string | null;
  credentialVersion?: number | null;
}

export interface CredentialRoleOption {
  id: string;
  key?: string;
  name: string;
}

export interface CredentialUserSummaryDto {
  userId: string;
  fullName: string;
  username: string | null;
  loginEmail: string;
  contactEmail: string | null;
  userType: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: CredentialStatusFilter;
  hasPassword: boolean;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
  passwordProvisionedAt: string | null;
  credentialVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CredentialStatusListResponse {
  items: CredentialStatusRecord[];
  pagination?: SettingsPaginationApiDto;
}

export interface FetchCredentialStatusParams {
  search?: string;
  page?: number;
  limit?: number;
  roleKey?: string;
  userType?: string;
  credentialStatus?: CredentialStatusFilter | "all";
}

export interface SetCredentialPasswordRequest {
  password: string;
  forceResetOnLogin?: boolean;
}

export interface OneTimeCredentialResponse {
  userId: string;
  fullName?: string;
  username?: string;
  loginEmail?: string;
  temporaryPassword?: string;
  mustChangePassword: boolean;
  passwordProvisionedAt?: string | null;
  passwordChangedAt?: string | null;
  credentialVersion?: number | null;
}

export interface GeneratedCredentialUserDto {
  userId: string;
  fullName?: string | null;
  username?: string | null;
  loginEmail?: string | null;
  contactEmail?: string | null;
}

export interface GeneratedCredentialResponseDto {
  user: GeneratedCredentialUserDto;
  temporaryPassword?: string | null;
  mustChangePassword: boolean;
  generatedAt?: string | null;
  credentialVersion?: number | null;
}

export type CredentialBulkScope =
  | "selected"
  | "role"
  | "user_type"
  | "missing_password"
  | "all_school_users";

export type CredentialStatusFilter =
  | "missing"
  | "set"
  | "temporary_or_must_change"
  | "must_change";

export interface BulkCredentialPreviewRequest {
  scope: CredentialBulkScope;
  userIds?: string[];
  roleKeys?: string[];
  userTypes?: string[];
  includeUsersWithPassword?: boolean;
  includeDisabledUsers?: boolean;
}

export interface BulkCredentialPreviewRecipient {
  userId: string;
  fullName: string;
  username?: string | null;
  loginEmail: string;
  contactEmail?: string | null;
  eligible: boolean;
  skipReason?: string | null;
}

export interface BulkCredentialPreviewResponse {
  eligibleCount: number;
  skippedCount: number;
  totalMatched: number;
  skippedReasons: Record<string, number>;
  recipients: BulkCredentialPreviewRecipient[];
}

export type BulkGenerateCredentialsRequest = BulkCredentialPreviewRequest;

export interface BulkCredentialPreviewSkippedItemDto {
  user: CredentialUserSummaryDto;
  reason: string;
}

export interface BulkCredentialPreviewResponseDto {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  sample: {
    eligible: CredentialUserSummaryDto[];
    skipped: BulkCredentialPreviewSkippedItemDto[];
  };
}

export interface BulkGenerateCredentialsResponseDto {
  generatedAt?: string | null;
  totalMatched: number;
  generated: number;
  skipped: number;
  skippedReasons?: Record<string, number> | null;
  items: Array<{
    user: GeneratedCredentialUserDto;
    temporaryPassword?: string | null;
  }>;
}

export interface BulkGenerateCredentialsResponse {
  generatedCount: number;
  skippedCount: number;
  credentials: OneTimeCredentialResponse[];
}
