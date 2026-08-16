"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  DoorOpen,
  LockKeyhole,
  Network,
} from "lucide-react";
import { setupSteps } from "../config/setupSteps";
import type { SetupEvaluation, SetupStepId, SetupStepStatus } from "../types";

export interface SetupGuideCopy {
  title: string;
  progressLabel: string;
  progressText(completed: number, total: number, percent: number): string;
  stepError: string;
  retry: string;
  lockedPrefix: string;
  statuses: Record<SetupStepStatus, string>;
  steps: Record<SetupStepId, { title: string; description: string }>;
}

export interface SetupGuideProps {
  copy: SetupGuideCopy;
  evaluation: SetupEvaluation;
  selectedStepId: SetupStepId;
  onSelectStep(stepId: SetupStepId): void;
  onRetryStep(stepId: SetupStepId): void;
  stepContent: Record<SetupStepId, ReactNode>;
}

const stepIcons: Record<SetupStepId, typeof Building2> = {
  organization: Building2,
  academicContext: CalendarRange,
  structure: Network,
  subjects: BookOpen,
  rooms: DoorOpen,
};

function statusIcon(status: SetupStepStatus) {
  if (status === "complete") {
    return CheckCircle2;
  }

  if (status === "locked") {
    return LockKeyhole;
  }

  if (status === "error") {
    return AlertCircle;
  }

  return null;
}

function statusClasses(status: SetupStepStatus, isSelected: boolean) {
  const selected = isSelected
    ? "border-primary bg-primary/5 shadow-sm"
    : "border-gray-200 bg-white";

  if (status === "complete") {
    return `${selected} text-emerald-700`;
  }

  if (status === "error") {
    return `${selected} text-red-700`;
  }

  if (status === "locked") {
    return `${selected} text-gray-500`;
  }

  return `${selected} text-gray-800`;
}

export function SetupGuide({
  copy,
  evaluation,
  selectedStepId,
  onSelectStep,
  onRetryStep,
  stepContent,
}: SetupGuideProps) {
  const selectedStep = evaluation.steps[selectedStepId];
  const selectedCopy = copy.steps[selectedStepId];
  const selectedStatusLabel = copy.statuses[selectedStep.status];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 mx-auto container">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="onboarding-enter">
          <h2 className="text-xl font-semibold text-gray-950">{copy.title}</h2>
        </div>
        <div className="onboarding-enter onboarding-enter-delay-1 min-w-40">
          <p
            aria-live="polite"
            className="mb-2 text-sm font-medium text-gray-700"
          >
            {copy.progressText(
              evaluation.completedCount,
              evaluation.totalCount,
              evaluation.progressPercent,
            )}
          </p>
          <div
            aria-label={copy.progressLabel}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={evaluation.progressPercent}
            className="h-2 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${evaluation.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="onboarding-enter onboarding-enter-delay-2 mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {setupSteps.map((definition) => {
          const step = evaluation.steps[definition.id];
          const stepCopy = copy.steps[definition.id];
          const StepIcon = stepIcons[definition.id];
          const StatusIcon = statusIcon(step.status);
          const isSelected = selectedStepId === definition.id;
          const isLocked = step.status === "locked";
          const interactionClasses = isLocked
            ? "cursor-not-allowed"
            : "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm";
          const prerequisiteText =
            isLocked && step.lockedBy.length > 0
              ? `${copy.lockedPrefix}: ${step.lockedBy
                  .map((id) => copy.steps[id].title)
                  .join(", ")}`
              : null;

          return (
            <button
              aria-disabled={isLocked}
              aria-label={`${stepCopy.title} ${copy.statuses[step.status]}`}
              className={`rounded-xl border p-3 text-start transition-[border-color,background-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${interactionClasses} ${statusClasses(
                step.status,
                isSelected,
              )}`}
              key={definition.id}
              onClick={() => {
                if (!isLocked) {
                  onSelectStep(definition.id);
                }
              }}
              type="button"
            >
              <span className="flex items-center justify-between gap-2">
                <StepIcon aria-hidden className="h-5 w-5 shrink-0" />
                {StatusIcon ? (
                  <StatusIcon aria-hidden className="h-4 w-4 shrink-0" />
                ) : null}
              </span>
              <span className="mt-3 block text-sm font-semibold">
                {stepCopy.title}
              </span>
              <span className="mt-1 block text-xs">
                {copy.statuses[step.status]}
              </span>
              <span className="mt-2 block text-xs text-gray-500">
                {stepCopy.description}
              </span>
              {prerequisiteText ? (
                <span className="mt-2 block text-xs text-gray-500">
                  {prerequisiteText}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="onboarding-enter onboarding-enter-delay-3 mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-950">
              {selectedCopy.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {selectedCopy.description}
            </p>
            <p className="mt-2 text-sm text-gray-700">{selectedStatusLabel}</p>
            {selectedStep.status === "error" ? (
              <p className="mt-2 text-sm text-red-700">{copy.stepError}</p>
            ) : null}
          </div>
          {selectedStep.status === "error" ? (
            <button
              className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => onRetryStep(selectedStepId)}
              type="button"
            >
              {copy.retry}
            </button>
          ) : null}
        </div>
        <div className="onboarding-step-content mt-4" key={selectedStepId}>
          {stepContent[selectedStepId]}
        </div>
      </div>
    </section>
  );
}
