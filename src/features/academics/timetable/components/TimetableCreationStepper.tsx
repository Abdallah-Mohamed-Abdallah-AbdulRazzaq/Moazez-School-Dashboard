"use client";

import { Check, Circle, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui";
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
        aria-busy="true"
        aria-live="polite"
        className="border-b border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 lg:px-6"
      >
        {copy.checking}
      </section>
    );
  }

  return (
    <nav
      aria-label={copy.navigationLabel}
      className="border-b border-gray-200 bg-white px-4 py-3 lg:px-6"
    >
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-center justify-center gap-2">
          {progress.steps.map((step, index) => {
            const showPrerequisite =
              step.status === "blocked" &&
              !progress.steps
                .slice(0, index)
                .some((previousStep) => previousStep.status === "blocked");

            return (
              <li key={step.id} className="flex items-start gap-2">
                {index > 0 && (
                  <span aria-hidden className="mt-5 h-px w-6 bg-gray-200" />
                )}
                <StepControl
                  step={step}
                  copy={copy}
                  onAction={onAction}
                  showPrerequisite={showPrerequisite}
                />
              </li>
            );
          })}
        </ol>
      </div>
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
      <div className="flex w-32 flex-col items-center text-center text-xs text-gray-500">
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
      className="h-auto w-32 cursor-pointer flex-col items-center gap-1 px-1 py-1 text-center transition-colors duration-200 motion-reduce:transition-none [&>span]:w-full"
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
    <span className="flex w-full flex-col items-center text-center">
      <span className={statusIconClassName(step.status)}>
        {statusIcon(step.status)}
      </span>
      <span className="text-xs font-medium text-gray-900">{label}</span>
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
    return "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white";
  }

  if (status === "current") {
    return "flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-primary-50 text-primary";
  }

  return "flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-gray-500";
}
