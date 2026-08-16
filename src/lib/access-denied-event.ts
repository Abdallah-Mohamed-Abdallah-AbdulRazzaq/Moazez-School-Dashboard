export const SCOPE_PERMISSION_DENIED_EVENT = "moazez:scope-permission-denied";

export interface ScopePermissionDeniedEventDetail {
  missingPermissions: string[];
}
