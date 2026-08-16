import { apiPost } from "@/lib/api";

export type AccountLinkMode = "create" | "link";
export type TemporaryPasswordMode = "none" | "generate";

export interface AccountLinkRequest {
  mode: AccountLinkMode;
  username?: string;
  userId?: string;
  contactEmail?: string | null;
  temporaryPasswordMode?: TemporaryPasswordMode;
}

export interface AccountLinkResponse {
  studentId?: string;
  guardianId?: string;
  linked: true;
  user: {
    fullName: string;
    username: string | null;
    loginEmail: string;
    contactEmail: string | null;
    userType: "parent" | "student";
    roleKey: string;
    roleName: string;
    status: string;
    hasPassword: boolean;
    mustChangePassword: boolean;
  };
  temporaryPassword?: string | null;
}

export async function linkStudentAccount(
  studentId: string,
  payload: AccountLinkRequest,
): Promise<AccountLinkResponse> {
  return apiPost<AccountLinkResponse>(
    `/students-guardians/students/${studentId}/account`,
    payload,
  );
}

export async function linkGuardianAccount(
  guardianId: string,
  payload: AccountLinkRequest,
): Promise<AccountLinkResponse> {
  return apiPost<AccountLinkResponse>(
    `/students-guardians/guardians/${guardianId}/account`,
    payload,
  );
}
