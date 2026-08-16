// FILE: src/types/user.ts

export type UserType =
  | "PLATFORM_USER"
  | "ORGANIZATION_USER"
  | "SCHOOL_USER"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "APPLICANT"
  | "PICKUP_DELEGATE"
  | "SERVICE_ACCOUNT";

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username?: string | null;
  loginEmail?: string;
  contactEmail?: string | null;
  firstName: string;
  lastName: string;
  userType: UserType;
  mustChangePassword?: boolean;
}

export interface ActiveMembership {
  membershipId: string;
  organizationId: string;
  schoolId: string | null;
  roleId: string;
  roleKey: string;
  permissions: string[];
}

export interface MeResponse {
  id: string;
  email: string;
  username?: string | null;
  loginEmail?: string;
  contactEmail?: string | null;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  mustChangePassword?: boolean;
  activeMembership: ActiveMembership | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  mustChangePassword?: boolean;
}
