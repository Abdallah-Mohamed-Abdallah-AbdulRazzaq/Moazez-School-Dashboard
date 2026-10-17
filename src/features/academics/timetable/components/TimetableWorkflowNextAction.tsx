"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import type {
  TimetableCreationAction,
  TimetableCreationProgress,
} from "../services/timetableCreationProgress";

interface TimetableWorkflowNextActionProps {
  progress: TimetableCreationProgress;
  isDirty: boolean;
  busy: boolean;
  canSave: boolean;
  onSave: () => void;
  onAction: (action: TimetableCreationAction) => void;
}

export default function TimetableWorkflowNextAction({
  progress,
  isDirty,
  busy,
  canSave,
  onSave,
  onAction,
}: TimetableWorkflowNextActionProps) {
  const t = useTranslations("academics.timetable.workflow");
  if (progress.state === "checking") return null;
  const published =
    !isDirty &&
    progress.steps.some(
      (step) => step.id === "publish" && step.status === "published",
    );
  const next = progress.steps.find(
    (step) => step.status === "current" || step.status === "blocked",
  );
  const action = isDirty
    ? "save"
    : next?.id === "publish" && !next.actionable
      ? "validation"
      : next?.id;
  if (!published && !action) return null;
  return (
    <section
      className="flex flex-col gap-3 border-b border-primary/20 bg-primary-50 px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between lg:px-6"
      aria-label={t("nextAction")}
    >
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-950">
          {published && (
            <CheckCircle2 aria-hidden className="h-4 w-4 text-primary" />
          )}
          {t(published ? "publishedTitle" : `steps.${action}.title`)}
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-700">
          {t(
            published ? "publishedDescription" : `steps.${action}.description`,
          )}
        </p>
      </div>
      {!published && action && (
        <Button
          className="shrink-0"
          disabled={
            busy ||
            (action === "save"
              ? !canSave
              : next?.id === action && !next.actionable)
          }
          loading={busy}
          onClick={() => (action === "save" ? onSave() : onAction(action))}
        >
          {t(`steps.${action}.action`)}
        </Button>
      )}
    </section>
  );
}
