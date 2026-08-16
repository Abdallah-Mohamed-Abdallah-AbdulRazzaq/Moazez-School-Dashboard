export interface LoginIdentitySettings {
  loginDomain: string | null;
  usernameMinLength: number;
  usernameMaxLength: number;
  allowedCharacters?: string | null;
  reservedUsernames: string[];
  status: "active" | "disabled";
  configured: boolean;
  updatedAt?: string | null;
}

export interface LoginIdentitySettingsResponse {
  loginDomain: string | null;
  usernameMinLength?: number | null;
  usernameMaxLength?: number | null;
  allowedCharacters?: string | null;
  reservedUsernames?: string[] | null;
  status?: "active" | "disabled" | null;
  configured?: boolean | null;
  updatedAt?: string | null;
}

export interface UpdateLoginIdentityRequest {
  loginDomain: string;
  usernameMinLength?: number;
  usernameMaxLength?: number;
  allowedCharacters?: string;
  reservedUsernames?: string[];
  status?: "active" | "disabled";
}

export interface UsernamePreviewResponse {
  username: string;
  loginEmail: string;
  reason?: string | null;
}

export interface UsernameAvailabilityResponse {
  username: string;
  loginEmail: string | null;
  available: boolean;
  reason?: UsernameAvailabilityReason | string | null;
}

export type UsernameAvailabilityReason =
  | "username_invalid"
  | "login_domain_missing"
  | "login_email_taken"
  | "reserved_username";
