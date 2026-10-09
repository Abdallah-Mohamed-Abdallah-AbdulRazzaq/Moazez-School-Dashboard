"use client";

import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentApprovalHistoryResponse } from "../../types/contracts";

interface TeacherPreparationApprovalHistoryCardProps {
  history: AcademicContentApprovalHistoryResponse | null;
  teachers: readonly { userId: string; displayName: { fullName: string } }[];
  error: string | null;
  onRetry: () => void;
}

export default function TeacherPreparationApprovalHistoryCard({
  history,
  teachers,
  error,
  onRetry,
}: TeacherPreparationApprovalHistoryCardProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail.context");
  const workflowT = useAcademicContentTranslations("workflow");
  const locale = useLocale();
  const actorName = (userId: string | null) => teachers.find((teacher) => teacher.userId === userId)?.displayName.fullName ?? t("name_unavailable");
  const formatInstant = (instant: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(instant));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><ClipboardCheck aria-hidden="true" className="size-4 text-primary" />{workflowT("history_title")}</h2>
      {error ? (
        <div className="mt-3"><p role="alert" className="text-sm text-red-700">{error}</p><Button type="button" size="sm" variant="secondary" className="mt-3" leftIcon={<RefreshCw aria-hidden="true" className="size-4" />} onClick={onRetry}>{t("retry_history")}</Button></div>
      ) : !history?.items.length ? (
        <p className="mt-3 text-sm text-gray-500">{workflowT("history_empty")}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {history.items.map((approval) => (
            <li key={approval.approvalId} className="border-s-2 border-primary ps-3 text-sm">
              <div className="flex items-center justify-between gap-2"><strong>{workflowT("round", { round: approval.roundNumber })}</strong><span className="text-xs text-gray-500">{workflowT(`approval_statuses.${approval.status}`)}</span></div>
              <p className="mt-1 text-gray-600">{t("submitted_by", { name: actorName(approval.submittedByUserId) })}</p>
              <time className="text-xs text-gray-500">{formatInstant(approval.submittedAt)}</time>
              {approval.decidedAt ? <p className="mt-1 text-gray-600">{t("decided_by", { name: actorName(approval.decidedByUserId) })}</p> : null}
              {approval.decisionNote ? <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-amber-900">{approval.decisionNote}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
