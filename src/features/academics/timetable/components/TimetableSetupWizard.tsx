"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import TimetableConfigEditor from "@/features/academics/timetable/components/TimetableConfigEditor";
import TimetablePeriodsEditor from "@/features/academics/timetable/components/TimetablePeriodsEditor";
import WizardStepper from "@/features/academics/timetable/components/WizardStepper";
import type { BackendTimetableConfigDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";

interface TimetableSetupWizardProps {
  academicYearId: string;
  termId: string;
  academicYearName: string;
  termName: string;
  status: TimetableSetupStatus;
  onReload: () => Promise<void>;
  onComplete: () => void;
}

export default function TimetableSetupWizard({
  academicYearId,
  termId,
  academicYearName,
  termName,
  status,
  onReload,
  onComplete,
}: TimetableSetupWizardProps) {
  const t = useTranslations("academics.timetable");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [activeStep, setActiveStep] = useState(() => setupStep(status));
  const [savedConfig, setSavedConfig] =
    useState<BackendTimetableConfigDto | null>(() => setupConfig(status));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const config = savedConfig ?? setupConfig(status);
  const periods = setupPeriods(status);
  const readOnly = status.kind === "ready" && status.readOnly;
  const hasInstructionalPeriod = periods.some(
    (period) => period.isInstructional,
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [activeStep]);

  const saveConfig = async (nextConfig: BackendTimetableConfigDto) => {
    setSavedConfig(nextConfig);
    await onReload();
    setActiveStep(1);
  };

  const steps = ["days", "periods", "review"].map((step) => ({
    title: t(`setup.steps.${step}.title`),
    subtitle: t(`setup.steps.${step}.subtitle`),
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{t("setup.title")}</h1>
        <p className="text-sm text-gray-600">{t("setup.description")}</p>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <ContextDetail label={t("setup.academicYear")} value={academicYearName} />
          <ContextDetail label={t("setup.term")} value={termName} />
        </dl>
      </header>

      <WizardStepper
        steps={steps}
        activeStep={activeStep}
        locale={locale}
        navigationLabel={t("setup.navigationLabel")}
        currentStepLabel={t("setup.stepStatus.current")}
        completedStepLabel={t("setup.stepStatus.completed")}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
        {activeStep === 0 && (
          <SetupPanel
            headingRef={headingRef}
            title={t("setup.steps.days.title")}
            description={t("setup.steps.days.description")}
          >
            <TimetableConfigEditor
              academicYearId={academicYearId}
              termId={termId}
              config={config}
              entries={[]}
              scopeIds={{}}
              allowScopeSelection={false}
              fixedScope={{ scopeType: "TERM" }}
              fixedName={t("setup.defaultConfigName", { term: termName })}
              readOnly={readOnly}
              locale={locale}
              submitLabel={t("setup.saveAndContinue")}
              onSaved={saveConfig}
            />
          </SetupPanel>
        )}

        {activeStep === 1 && config && (
          <SetupPanel
            headingRef={headingRef}
            title={t("setup.steps.periods.title")}
            description={t("setup.steps.periods.description")}
          >
            <TimetablePeriodsEditor
              config={config}
              periods={periods}
              entries={[]}
              readOnly={readOnly}
              onSaved={onReload}
            />
            <WizardActions
              isRtl={isRtl}
              continueDisabled={!hasInstructionalPeriod}
              onBack={() => setActiveStep(0)}
              onContinue={() => setActiveStep(2)}
            />
          </SetupPanel>
        )}

        {activeStep === 2 && config && (
          <SetupPanel
            headingRef={headingRef}
            title={t("setup.steps.review.title")}
            description={t("setup.steps.review.description")}
          >
            <SetupReview config={config} status={status} />
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => setActiveStep(1)}
                leftIcon={isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              >
                {t("setup.back")}
              </Button>
              <Button onClick={onComplete}>{t("setup.startBuilding")}</Button>
            </div>
          </SetupPanel>
        )}
      </section>
    </div>
  );
}

function ContextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function SetupPanel({
  headingRef,
  title,
  description,
  children,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-gray-900 outline-none"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

function WizardActions({
  isRtl,
  continueDisabled,
  onBack,
  onContinue,
}: {
  isRtl: boolean;
  continueDisabled: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const t = useTranslations("academics.timetable");
  return (
    <div className="mt-6 flex flex-wrap justify-between gap-3">
      <Button
        variant="secondary"
        onClick={onBack}
        leftIcon={isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
      >
        {t("setup.back")}
      </Button>
      <Button
        onClick={onContinue}
        disabled={continueDisabled}
        rightIcon={isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      >
        {t("setup.continue")}
      </Button>
    </div>
  );
}

function SetupReview({
  config,
  status,
}: {
  config: BackendTimetableConfigDto;
  status: TimetableSetupStatus;
}) {
  const t = useTranslations("academics.timetable");
  const periods = setupPeriods(status);
  const sortedPeriods = [...periods].sort(
    (first, second) => first.index - second.index,
  );
  const firstPeriod = sortedPeriods[0];
  const lastPeriod = sortedPeriods.at(-1);
  const details = [
    [t("setup.review.activeDays"), String(config.activeDays.length)],
    [t("setup.review.periods"), String(periods.length)],
    [t("setup.review.firstTime"), firstPeriod?.startTime ?? "—"],
    [t("setup.review.lastTime"), lastPeriod?.endTime ?? "—"],
  ];

  return (
    <div className="space-y-5">
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-gray-50 p-4">
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-base font-semibold text-gray-900" dir="auto">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-gray-700">
        {t("setup.review.defaultScope")}
      </p>
    </div>
  );
}

function setupStep(status: TimetableSetupStatus): number {
  if (status.kind === "missing_config") return 0;
  if (status.kind === "missing_periods") return 1;
  return 2;
}

function setupConfig(
  status: TimetableSetupStatus,
): BackendTimetableConfigDto | null {
  return "config" in status ? status.config : null;
}

function setupPeriods(status: TimetableSetupStatus) {
  return "periods" in status ? status.periods : [];
}
