import { apiPost } from "@/lib/api";
import { createEnrollment } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import { createGuardian, linkGuardianToStudent } from "@/features/students-guardians/guardians/services/guardiansApiService";
import { createStudent } from "@/features/students-guardians/students/services/studentsApiService";
import { linkGuardianAccount, linkStudentAccount, type AccountLinkResponse } from "@/features/students-guardians/services/accountLinkingService";
import type { RegistrationAccountFormState, RegistrationResult, RegistrationWizardFormState } from "@/features/students-guardians/registration/types/registration";
import { mapAccount, mapGuardianProfile, mapRegistrationToCompositePayload, mapRegistrationToEnrollmentPayload, mapRegistrationToStudentPayload } from "@/features/students-guardians/registration/utils/registrationMappers";
import { normalizeAccountResult, normalizeRegistrationResult } from "@/features/students-guardians/registration/utils/registrationResultMapper";
import type { RegistrationAccountResult } from "@/features/students-guardians/registration/types/registrationResult";

const BASE_PATH = "/students-guardians/registrations";
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Registration failed.";
const warningsOf = (value: unknown): string[] => value && typeof value === "object" && Array.isArray((value as { warnings?: unknown }).warnings)
  ? (value as { warnings: unknown[] }).warnings.filter((item): item is string => typeof item === "string") : [];
const accountRequest = (account: RegistrationAccountFormState) => mapAccount(account) as unknown as Parameters<typeof linkStudentAccount>[1];

export async function submitRegistration(form: RegistrationWizardFormState): Promise<RegistrationResult> {
  return form.guardians.some((guardian) => guardian.mode === "existing") ? submitStaged(form) : submitAtomic(form);
}

async function submitAtomic(form: RegistrationWizardFormState): Promise<RegistrationResult> {
  const response = await apiPost<unknown>(BASE_PATH, mapRegistrationToCompositePayload(form));
  const normalized = normalizeRegistrationResult(response);
  return { status: "success", ...normalized, warnings: [...warningsOf(response), ...normalized.warnings] };
}

function stagedAccountResult(target: "parent" | "student", account: RegistrationAccountFormState, response: AccountLinkResponse, guardianId?: string): RegistrationAccountResult {
  const normalized = normalizeAccountResult({ target, guardianId, mode: account.mode,
    status: account.mode === "link" ? "linked" : "created",
    user: { ...response.user, credentialStatus: response.user.status },
    temporaryPassword: response.temporaryPassword });
  return normalized;
}

async function submitStaged(form: RegistrationWizardFormState): Promise<RegistrationResult> {
  const student = await createStudent(mapRegistrationToStudentPayload(form));
  const linkedGuardians: Array<{ id: string; account: RegistrationAccountFormState }> = [];
  try {
    for (const guardian of form.guardians) {
      const id = guardian.mode === "existing" ? guardian.existingGuardianId! : (await createGuardian(mapGuardianProfile(guardian))).id;
      await linkGuardianToStudent(student.id, { guardianId: id, is_primary: guardian.isPrimary });
      linkedGuardians.push({ id, account: guardian.account });
    }
  } catch (error) { return { status: "partial", student, failedStep: "guardian_link", errorMessage: errorMessage(error), warnings: [] }; }

  let enrollment;
  try { enrollment = await createEnrollment(mapRegistrationToEnrollmentPayload(form, student.id)); }
  catch (error) { return { status: "partial", student, failedStep: "enrollment", errorMessage: errorMessage(error), warnings: [] }; }

  const warnings: string[] = [];
  const parentAccounts: RegistrationAccountResult[] = [];
  for (const guardian of linkedGuardians) {
    if (guardian.account.alreadyLinked) continue;
    try { parentAccounts.push(stagedAccountResult("parent", guardian.account, await linkGuardianAccount(guardian.id, accountRequest(guardian.account)), guardian.id)); }
    catch { warnings.push(`parent_account_failed:${guardian.id}`); parentAccounts.push({ target: "parent", guardianId: guardian.id, mode: guardian.account.mode, status: "failed" }); }
  }
  let studentAccount: RegistrationAccountResult;
  try { studentAccount = stagedAccountResult("student", form.studentAccount, await linkStudentAccount(student.id, accountRequest(form.studentAccount))); }
  catch { warnings.push("student_account_failed"); studentAccount = { target: "student", mode: form.studentAccount.mode, status: "failed" }; }
  return { status: "success", student, enrollment, guardians: [], warnings, parentAccounts, studentAccount };
}
