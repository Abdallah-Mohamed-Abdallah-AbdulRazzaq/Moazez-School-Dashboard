"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSetupStatusContext } from "../context/SetupStatusContext";
import { SetupGuideContent } from "../components/SetupGuideContent";
import { markOnboardingSkipped } from "../components/OnboardingRedirectGuard";

export default function SchoolOnboardingPage() {
  const result = useSetupStatusContext();
  const t = useTranslations("onboarding");
  const { logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const locale = params.lang ?? "en";
  const canSkip =
    result.evaluation.steps.academicContext.isComplete &&
    result.evaluation.steps.structure.isComplete;
  const isSetupComplete = result.evaluation.isComplete;
  const canLeaveSetup = canSkip || isSetupComplete;

  function handleSkip() {
    if (!canLeaveSetup) return;
    if (!isSetupComplete) {
      markOnboardingSkipped(result.schoolId);
    }
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <header className="onboarding-enter mx-auto mb-6 max-w-6xl text-center sm:mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("setup.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
          {t("setup.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          {t("setup.description")}
        </p>
      </header>

      <div className="onboarding-enter onboarding-enter-delay-1 mx-auto mb-4 flex max-w-6xl justify-center rounded-2xl bg-white p-4 text-sm text-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <Button
              aria-label={t("setup.logout")}
              leftIcon={<LogOut aria-hidden="true" className="size-4" />}
              onClick={() => void logout()}
              type="button"
              variant="danger"
            >
              {t("setup.logout")}
            </Button>
            <Button
              aria-describedby={
                !canLeaveSetup ? "skip-setup-requirement" : undefined
              }
              disabled={!canLeaveSetup}
              onClick={handleSkip}
              type="button"
              variant="outline"
            >
              {isSetupComplete ? t("setup.finish") : t("setup.skip")}
            </Button>
          </div>
          {!canLeaveSetup && (
            <p
              className="flex items-center justify-center gap-2 text-center text-sm text-gray-600"
              id="skip-setup-requirement"
            >
              <CircleAlert
                aria-hidden="true"
                className="size-4 shrink-0 text-amber-600"
              />
              {t("setup.skipRequirement")}
            </p>
          )}
        </div>
      </div>
      <div className="onboarding-enter onboarding-enter-delay-2">
        <SetupGuideContent result={result} title={t("setup.guideTitle")} />
      </div>
    </div>
  );
}
