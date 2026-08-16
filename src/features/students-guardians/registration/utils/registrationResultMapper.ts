import { normalizeEnrollment, normalizeGuardian, normalizeStudent, unwrapItemResponse } from "@/features/students-guardians/services/studentsGuardiansApiUtils";
import type { NormalizedRegistrationResult, RegistrationAccountMode, RegistrationAccountResult, RegistrationAccountStatus, RegistrationAccountUser } from "@/features/students-guardians/registration/types/registrationResult";

type ApiRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is ApiRecord => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const stringValue = (source: ApiRecord, key: string) => typeof source[key] === "string" ? source[key] as string : "";
const nullableString = (source: ApiRecord, key: string) => typeof source[key] === "string" ? source[key] as string : null;
const booleanValue = (source: ApiRecord, key: string) => source[key] === true;

function accountMode(value: string): RegistrationAccountMode {
  return value === "create" || value === "link" ? value : "none";
}
function accountStatus(value: string): RegistrationAccountStatus {
  return value === "created" || value === "linked" || value === "failed" ? value : "skipped";
}
function accountUser(source: ApiRecord): RegistrationAccountUser {
  return { fullName: stringValue(source, "fullName"), username: nullableString(source, "username"), loginEmail: stringValue(source, "loginEmail"),
    contactEmail: nullableString(source, "contactEmail"), userType: stringValue(source, "userType") === "parent" ? "parent" : "student",
    roleKey: stringValue(source, "roleKey"), roleName: stringValue(source, "roleName"), credentialStatus: stringValue(source, "credentialStatus"),
    hasPassword: booleanValue(source, "hasPassword"), mustChangePassword: booleanValue(source, "mustChangePassword") };
}
export function normalizeAccountResult(raw: unknown): RegistrationAccountResult {
  const source = isRecord(raw) ? raw : {};
  return { target: stringValue(source, "target") === "parent" ? "parent" : "student", guardianId: nullableString(source, "guardianId") ?? undefined,
    mode: accountMode(stringValue(source, "mode")), status: accountStatus(stringValue(source, "status")),
    user: isRecord(source.user) ? accountUser(source.user) : undefined, temporaryPassword: nullableString(source, "temporaryPassword") ?? undefined };
}
export function normalizeRegistrationResult(raw: unknown): NormalizedRegistrationResult {
  const source = unwrapItemResponse<ApiRecord>(raw, "Registration result");
  if (!source.student || !source.enrollment) throw new Error("Registration result is missing core data.");
  return { registrationId: stringValue(source, "registrationId"), student: normalizeStudent(source.student),
    guardians: Array.isArray(source.guardians) ? source.guardians.map(normalizeGuardian) : [], enrollment: normalizeEnrollment(source.enrollment),
    parentAccounts: Array.isArray(source.parentAccounts) ? source.parentAccounts.map(normalizeAccountResult) : [],
    studentAccount: normalizeAccountResult(source.studentAccount), warnings: Array.isArray(source.warnings) ? source.warnings.filter((warning): warning is string => typeof warning === "string") : [],
    createdAt: stringValue(source, "createdAt"), completedAt: stringValue(source, "completedAt") };
}
