import type { Application, ApplicationStatus } from "@/features/admissions/types/admissions";

const DECIDABLE_STATUSES: ApplicationStatus[] = ["submitted", "under_review"];

interface RegistrationActionOptions {
  canRegisterApplication: boolean;
  permissionRequiredMessage: string;
}

export function getApplicationActionBlockers(application: Application) {
  return application.dashboardState?.blockers ?? [];
}

export function getDecisionActionState(application: Application) {
  return {
    canMakeDecision:
      application.dashboardState?.canProceedToDecision ??
      DECIDABLE_STATUSES.includes(application.status),
  };
}

export function getRegistrationActionState(
  application: Application,
  {
    canRegisterApplication,
    permissionRequiredMessage,
  }: RegistrationActionOptions,
) {
  const actionBlockers = getApplicationActionBlockers(application);
  const isVisible =
    application.status === "accepted" && !application.registrationState?.registered;
  const isReadinessBlocked = application.dashboardState?.canRegister === false;
  const isDisabled = !canRegisterApplication || isReadinessBlocked;
  const title =
    actionBlockers.map((blocker) => blocker.message).join("; ") ||
    (!canRegisterApplication ? permissionRequiredMessage : undefined);

  return {
    isVisible,
    isDisabled,
    title: isDisabled ? title : undefined,
  };
}
