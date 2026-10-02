"use client";

import { RefreshCw, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useAcademicContentWorkflow } from "../../hooks/useAcademicContentWorkflow";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { isAcademicContentMutableStatus } from "../../model/academicContentPolicy";
import type {
  AcademicContentDetail,
  AcademicContentReadinessResponse,
  AcademicContentTransitionResponse,
} from "../../types/contracts";
import ApprovalHistoryPanel from "./ApprovalHistoryPanel";

type PreparationContent = Extract<
  AcademicContentDetail,
  { type: "TEACHER_PREPARATION" }
>;

interface AcademicContentWorkflowPanelProps {
  content: PreparationContent;
  readiness: AcademicContentReadinessResponse | null;
  canManage: boolean;
  hasUnsavedChanges: boolean;
  onSubmitted: (transition: AcademicContentTransitionResponse) => void;
}

export default function AcademicContentWorkflowPanel({
  content,
  readiness,
  canManage,
  hasUnsavedChanges,
  onSubmitted,
}: AcademicContentWorkflowPanelProps) {
  const workflow = useAcademicContentWorkflow(content.id);
  const t = useAcademicContentTranslations("workflow");
  const statusT = useAcademicContentTranslations("statuses");
  const commonT = useAcademicContentTranslations("common");

  if (workflow.isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <PartialLoader />
      </section>
    );
  }

  if (!workflow.policy) {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm sm:p-6">
        <div role="alert" className="text-sm text-red-700">
          {workflow.error?.message ?? t("unavailable")}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          leftIcon={<RefreshCw aria-hidden="true" className="size-4" />}
          onClick={() => void workflow.reload()}
        >
          {commonT("retry")}
        </Button>
      </section>
    );
  }

  const approvalRequired = workflow.policy.preparationApprovalRequired;
  const mutable = isAcademicContentMutableStatus(content.status);
  const ready = readiness?.canAdvance === true;
  const canSubmit =
    canManage && approvalRequired && mutable && ready && !hasUnsavedChanges;
  const latestApproval = workflow.history?.items[0];
  const actionLabel =
    content.status === "CHANGES_REQUESTED" ? t("resubmit") : t("submit");
  let submissionHint = t("ready_to_submit");
  if (!ready) submissionHint = t("readiness_blocked");
  else if (hasUnsavedChanges) submissionHint = t("unsaved_blocked");

  const submit = async () => {
    const transition = await workflow.submit();
    if (transition) onSubmitted(transition);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-600">{t("current_status")}: </span>
          <strong className="text-gray-900">{statusT(content.status)}</strong>
        </div>
      </div>

      {workflow.error && (
        <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {workflow.error.message}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-900">
          {approvalRequired ? t("approval_required") : t("approval_not_required")}
        </p>
        {latestApproval && (
          <p className="mt-2 text-sm text-gray-600">
            {t("current_round", { round: latestApproval.roundNumber })}
          </p>
        )}
        {latestApproval?.decisionNote && content.status === "CHANGES_REQUESTED" && (
          <div
            role="note"
            aria-label={t("latest_decision_note")}
            className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            <span className="block text-xs font-semibold">
              {t("latest_decision_note")}
            </span>
            <p className="mt-1">{latestApproval.decisionNote}</p>
          </div>
        )}
      </div>

      {approvalRequired && mutable && canManage && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {submissionHint}
          </p>
          <Button
            type="button"
            loading={workflow.isSubmitting}
            disabled={!canSubmit}
            leftIcon={<Send aria-hidden="true" className="size-4" />}
            onClick={() => void submit()}
          >
            {actionLabel}
          </Button>
        </div>
      )}

      <ApprovalHistoryPanel history={workflow.history} />
    </section>
  );
}
