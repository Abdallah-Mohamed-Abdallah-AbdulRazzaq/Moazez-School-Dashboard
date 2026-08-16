import type { NotificationTemplate } from "@/types/notifications/template";

export type SettingsStatus =
  | "active"
  | "draft"
  | "connected"
  | "disconnected"
  | "needs_attention"
  | "invited"
  | "inactive"
  | "completed"
  | "running"
  | "failed";

export type AuditSeverity = "info" | "warning" | "critical";
export type PermissionAction = "view" | "manage" | "configure" | "export";
export type NotificationChannel = "email" | "sms" | "in_app";
export type IntegrationFieldType = "text" | "password" | "url" | "email" | "select";
export type UserAdminStatus = "active" | "invited" | "inactive";
export type BackupJobStatus = "completed" | "running" | "failed";

export interface SettingsOverviewMetrics {
  profileCompleteness: number;
  activeUsers: number;
  pendingInvites: number;
  recentAuditEvents: number;
}

export interface SettingsOverviewAuditEventApiDto {
  id: string;
  actor: string;
  action: string;
  module: string;
  entity?: string | null;
  severity: AuditSeverity;
  timestamp: string;
  ipAddress: string | null;
}

export interface SettingsOverviewApiDto {
  profileCompleteness: number;
  activeUsersCount: number;
  pendingInvitesCount: number;
  recentAuditEvents: SettingsOverviewAuditEventApiDto[];
}

export interface SchoolProfileSettings {
  schoolName: string;
  shortName: string;
  timezone: string;
  addressLine: string;
  formattedAddress: string;
  city: string;
  country: string;
  footerSignature: string;
  logoUrl: string;
  latitude: number | null;
  longitude: number | null;
  mapPlaceLabel: string;
}

export interface BrandingApiDto {
  schoolName: string | null;
  shortName: string | null;
  timezone: string | null;
  addressLine: string | null;
  formattedAddress: string | null;
  city: string | null;
  country: string | null;
  footerSignature: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  mapPlaceLabel: string | null;
}

export interface UpdateBrandingApiDto {
  schoolName?: string | null;
  shortName?: string | null;
  timezone?: string | null;
  addressLine?: string | null;
  formattedAddress?: string | null;
  city?: string | null;
  country?: string | null;
  footerSignature?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapPlaceLabel?: string | null;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  formattedAddress: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ResolvedSchoolLocation {
  label: string;
  formattedAddress: string;
  addressLine: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PermissionDefinition {
  key: string;
  module: string;
  action: PermissionAction;
  label: string;
  description: string;
}

export interface SettingsPermissionApiDto {
  key: string;
  module: string;
  action: PermissionAction;
  label: string;
  description: string;
}

export interface RoleDefinition {
  id: string;
  key?: string;
  isKeyDerived?: boolean;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

export interface SettingsRoleApiDto {
  id: string;
  key?: string | null;
  name: string;
  description: string;
  isSystem?: boolean | null;
  memberCount?: number | null;
  permissions?: string[] | null;
}

export interface SettingsRolesListApiDto {
  items: SettingsRoleApiDto[];
  pagination?: SettingsPaginationApiDto;
}

export interface SettingsRolePayloadDto {
  name: string;
  description: string;
}

export interface SettingsRolePermissionsPayloadDto {
  permissions: string[];
}

export interface SettingsRolePermissionsResponseDto {
  id: string;
  permissions: string[];
}

export interface AttendancePolicySettings {
  absenceThreshold: number;
  lateThresholdMinutes: number;
  lockTime: string;
  guardianAlertEnabled: boolean;
  portalAbsenceVisible: boolean;
}

export interface GradePolicySettings {
  passingScore: number;
  publishApprovalRequired: boolean;
  allowTeacherDrafts: boolean;
  weightingLockedAfterPublish: boolean;
}

export interface BehaviorPolicySettings {
  incidentThreshold: number;
  suspensionRequiresApproval: boolean;
  guardianNotificationEnabled: boolean;
  studentPortalVisibility: boolean;
}

export interface PolicySettings {
  attendance: AttendancePolicySettings;
  grades: GradePolicySettings;
  behavior: BehaviorPolicySettings;
}

export interface NotificationTemplateChannelState {
  channel: NotificationChannel;
  enabled: boolean;
}

export interface NotificationTemplateConfig {
  id: string;
  key: string;
  name: string;
  status: "active" | "draft";
  variables: string[];
  template: NotificationTemplate;
  channelStates: NotificationTemplateChannelState[];
  lastTestAt?: string;
}

export interface IntegrationProviderField {
  key: string;
  label: string;
  type: IntegrationFieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface IntegrationConfiguration {
  providerId: string;
  values: Record<string, string>;
  updatedAt?: string;
}

export interface IntegrationProviderStatus {
  id: string;
  provider: string;
  category: string;
  status: "connected" | "disconnected" | "needs_attention";
  description: string;
  lastCheckedAt: string;
  lastTestAt?: string;
  lastSyncAt?: string;
  healthNote?: string;
  fields: IntegrationProviderField[];
  configuration: IntegrationConfiguration;
}

export interface SecuritySettings {
  enforceTwoFactor: boolean;
  ipAllowlistEnabled: boolean;
  ipAllowlist: string;
  sessionTimeoutMinutes: number;
  suspiciousLoginAlerts: boolean;
  passwordMinLength: number;
  passwordRotationDays: number;
}

export interface SecuritySettingsApiDto {
  enforceTwoFactor: boolean;
  ipAllowlistEnabled: boolean;
  ipAllowlist: string;
  sessionTimeoutMinutes: number;
  suspiciousLoginAlerts: boolean;
  passwordMinLength: number;
  passwordRotationDays: number;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  module: string;
  entity?: string;
  timestamp: string;
  severity: AuditSeverity;
  ipAddress: string | null;
}

export interface SettingsUserRecord {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  contactEmail?: string;
  roleId: string;
  roleName?: string;
  status: UserAdminStatus;
  lastActiveAt?: string;
  invitedAt?: string;
  lastInviteSentAt?: string;
}

export interface SettingsUserApiDto {
  id: string;
  fullName: string;
  username?: string | null;
  email: string;
  loginEmail?: string | null;
  contactEmail?: string | null;
  roleId: string;
  roleName?: string | null;
  status: UserAdminStatus;
  lastActiveAt?: string | null;
  invitedAt?: string | null;
  lastInviteSentAt?: string | null;
}

export interface SettingsPaginationApiDto {
  page: number;
  limit: number;
  total: number;
}

export interface SettingsUsersListApiDto {
  items: SettingsUserApiDto[];
  pagination?: SettingsPaginationApiDto;
}

export interface SettingsUserPayloadDto {
  fullName: string;
  email?: string;
  username?: string;
  contactEmail?: string;
  roleId: string;
}

export interface SettingsUserUpdatePayloadDto {
  fullName?: string;
  roleId?: string;
}

export interface SettingsUserStatusPayloadDto {
  status: Exclude<UserAdminStatus, "invited">;
}

export interface SettingsUserStatusResponseDto {
  id: string;
  status: Exclude<UserAdminStatus, "invited">;
}

export interface SettingsSessionUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

export interface BackupHistoryEntry {
  id: string;
  type: "backup" | "export" | "import" | "migration";
  status: BackupJobStatus;
  fileName: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface AdmissionsRequiredDocumentConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  required: boolean;
  active: boolean;
  sortOrder: number;
}

export interface AdmissionRequiredDocument {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  acceptedFileTypes: string[];
  maxFiles: number;
  sortOrder: number;
}

export interface SettingsStoreSnapshot {
  roles: RoleDefinition[];
  policies: PolicySettings;
  admissionsDocuments: AdmissionsRequiredDocumentConfig[];
  notificationTemplates: NotificationTemplateConfig[];
  integrations: IntegrationProviderStatus[];
  securitySettings: SecuritySettings;
  auditLog: AuditLogEntry[];
  users: SettingsUserRecord[];
  backupHistory: BackupHistoryEntry[];
  currentUser: SettingsSessionUser;
}
