"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarRange,
  DoorOpen,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupStatusContext } from "../context/SetupStatusContext";
import { isSetupSnapshotLoading } from "../utils/setupStatus";

const welcomeStages = [
  { id: "organization", icon: Building2 },
  { id: "academicContext", icon: CalendarRange },
  { id: "structure", icon: Network },
  { id: "subjects", icon: BookOpen },
  { id: "rooms", icon: DoorOpen },
] as const;

export default function OnboardingWelcomePage() {
  const { evaluation, snapshot } = useSetupStatusContext();
  const t = useTranslations("onboarding");
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const locale = params.lang ?? "en";
  const isLoading = isSetupSnapshotLoading(snapshot);

  useEffect(() => {
    if (!isLoading && evaluation.isComplete) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [evaluation.isComplete, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p
          aria-live="polite"
          className="text-sm font-medium text-primary motion-safe:animate-pulse"
        >
          {t("loading.preparing")}
        </p>
      </div>
    );
  }

  if (evaluation.isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 flex items-center justify-center">
      <div className="mx-auto flex max-w-5xl flex-col items-center ">
        <header className="onboarding-enter max-w-2xl text-center text-black">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
            {t("welcome.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {t("welcome.title")}
          </h1>
          <p className="mt-4 text-sm leading-6 text-black/80 sm:text-base">
            {t("welcome.description")}
          </p>
        </header>

        <section
          aria-label={t("welcome.stagesLabel")}
          className="onboarding-enter onboarding-enter-delay-1 mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {welcomeStages.map(({ id, icon: StageIcon }) => (
            <article
              className="rounded-2xl border border-white/20 bg-white/95 p-4 shadow-sm"
              key={id}
            >
              <StageIcon aria-hidden className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-sm font-semibold text-gray-950">
                {t(`welcome.stages.${id}.title`)}
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                {t(`welcome.stages.${id}.description`)}
              </p>
            </article>
          ))}
        </section>

        <div className="onboarding-enter onboarding-enter-delay-2 mt-8">
          <Button
            onClick={() => router.push(`/${locale}/settings/onboarding/setup`)}
            rightIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
            size="lg"
            type="button"
            variant="secondary"
          >
            {t("welcome.start")}
          </Button>
        </div>
      </div>
    </div>
  );
}
