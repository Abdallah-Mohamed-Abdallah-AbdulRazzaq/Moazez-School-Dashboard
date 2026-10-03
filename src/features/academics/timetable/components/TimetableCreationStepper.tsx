"use client";

import { Check, ChevronDown, Circle, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui";
import { TimetableProgressLoadingSkeleton } from "./TimetableLoadingSkeletons";
import type {
  TimetableCreationAction,
  TimetableCreationPrerequisite,
  TimetableCreationProgress,
  TimetableCreationStep,
  TimetableCreationStepStatus,
} from "@/features/academics/timetable/services/timetableCreationProgress";

export interface TimetableCreationStepperCopy {
  navigationLabel: string;
  checking: string;
  overviewLabel: string;
  progressLabel: string;
  showDetails: string;
  steps: Record<TimetableCreationAction, string>;
  status: Record<TimetableCreationStepStatus, string>;
  prerequisites: Record<TimetableCreationPrerequisite, string>;
}

interface TimetableCreationStepperProps {
  progress: TimetableCreationProgress;
  copy: TimetableCreationStepperCopy;
  onAction: (action: TimetableCreationAction) => void;
}

export default function TimetableCreationStepper({
  progress,
  copy,
  onAction,
}: TimetableCreationStepperProps) {
  if (progress.state === "checking") {
    return (
      <section
        role="status"
        aria-label={copy.checking}
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">{copy.checking}</span>
        <TimetableProgressLoadingSkeleton />
      </section>
    );
  }

  const currentStep =
    progress.steps.find((step) => step.status === "current") ??
    progress.steps.find((step) => step.status === "blocked") ??
    progress.steps.at(-1);
  const completedSteps = progress.steps.filter(
    (step) => step.status === "complete" || step.status === "published",
  ).length;
  const progressPercentage = Math.round(
    (completedSteps / progress.steps.length) * 100,
  );

  return (
    <nav
      aria-label={copy.navigationLabel}
      className="border-b border-gray-200 bg-white px-4 py-3 print:hidden lg:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">
            {copy.overviewLabel}
          </p>
          {currentStep && (
            <div className="mt-1 flex items-center gap-2">
              <span className={statusIconClassName(currentStep.status)}>
                {statusIcon(currentStep.status)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-950">
                  {copy.steps[currentStep.id]}
                </p>
                {currentStep.status === "blocked" &&
                  currentStep.prerequisiteKey && (
                    <p className="truncate text-xs text-gray-600">
                      {currentStep.prerequisiteMessage ??
                        copy.prerequisites[currentStep.prerequisiteKey]}
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-[12rem] items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs text-gray-600">
              <span>{copy.progressLabel}</span>
              <span dir="ltr">
                {completedSteps}/{progress.steps.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          {currentStep?.actionable && (
            <Button
              aria-current={
                currentStep.status === "current" ? "step" : undefined
              }
              onClick={() => onAction(currentStep.id)}
              size="sm"
              variant="secondary"
            >
              {copy.steps[currentStep.id]}
            </Button>
          )}
        </div>
      </div>

      <details className="group mt-2">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
          {copy.showDetails}
          <ChevronDown
            className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          {progress.steps.map((step, index) => {
            const showPrerequisite =
              step.status === "blocked" &&
              step.id !== currentStep?.id &&
              !progress.steps
                .slice(0, index)
                .some((previousStep) => previousStep.status === "blocked");
            const detailedStep =
              step.id === currentStep?.id
                ? { ...step, actionable: false }
                : step;

            return (
              <li key={step.id} className="min-w-0">
                <StepControl
                  step={detailedStep}
                  copy={copy}
                  onAction={onAction}
                  showPrerequisite={showPrerequisite}
                />
              </li>
            );
          })}
        </ol>
      </details>
    </nav>
  );
}

function StepControl({
  step,
  copy,
  onAction,
  showPrerequisite,
}: {
  step: TimetableCreationStep;
  copy: TimetableCreationStepperCopy;
  onAction: (action: TimetableCreationAction) => void;
  showPrerequisite: boolean;
}) {
  const label = copy.steps[step.id];
  const status = copy.status[step.status];
  const content = <StepContent label={label} status={status} step={step} />;

  if (!step.actionable) {
    return (
      <div className="flex min-h-16 flex-col rounded-lg border border-gray-200 bg-gray-50 p-2 text-start text-xs text-gray-500">
        {content}
        {showPrerequisite && step.prerequisiteKey && (
          <p className="mt-1 text-[11px] leading-4 text-gray-500">
            {step.prerequisiteMessage ??
              copy.prerequisites[step.prerequisiteKey]}
          </p>
        )}
      </div>
    );
  }

  return (
    <Button
      aria-current={step.status === "current" ? "step" : undefined}
      className="h-auto min-h-16 w-full cursor-pointer items-start justify-start gap-1 border border-gray-200 px-2 py-2 text-start transition-colors duration-200 motion-reduce:transition-none [&>span]:w-full"
      onClick={() => onAction(step.id)}
      size="sm"
      variant="ghost"
    >
      {content}
    </Button>
  );
}

function StepContent({
  label,
  status,
  step,
}: {
  label: string;
  status: string;
  step: TimetableCreationStep;
}) {
  return (
    <span className="flex w-full items-center gap-2 text-start">
      <span className={statusIconClassName(step.status)}>
        {statusIcon(step.status)}
      </span>
      <span className="min-w-0 truncate text-xs font-medium text-gray-900">
        {label}
      </span>
      <span className="sr-only">{status}</span>
    </span>
  );
}

function statusIcon(status: TimetableCreationStepStatus) {
  if (status === "complete" || status === "published") {
    return <Check aria-hidden className="h-4 w-4" />;
  }

  if (status === "blocked") {
    return <Lock aria-hidden className="h-4 w-4" />;
  }

  return status === "current" ? (
    <Send aria-hidden className="h-4 w-4" />
  ) : (
    <Circle aria-hidden className="h-4 w-4" />
  );
}

function statusIconClassName(status: TimetableCreationStepStatus): string {
  if (status === "complete" || status === "published") {
    return "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white";
  }

  if (status === "current") {
    return "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary-50 text-primary";
  }

  return "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500";
}
