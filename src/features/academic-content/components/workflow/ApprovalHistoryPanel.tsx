import { ClipboardCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentApprovalHistoryResponse } from "../../types/contracts";

interface ApprovalHistoryPanelProps {
  history: AcademicContentApprovalHistoryResponse | null;
}

function instantLabel(instant: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(instant));
}

export default function ApprovalHistoryPanel({
  history,
}: ApprovalHistoryPanelProps) {
  const t = useAcademicContentTranslations("workflow");
  const locale = useLocale();

  return (
    <div className="mt-6 border-t border-gray-200 pt-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <ClipboardCheck aria-hidden="true" className="size-4 text-primary" />
        {t("history_title")}
      </h3>
      {!history?.items.length ? (
        <p className="mt-3 text-sm text-gray-600">{t("history_empty")}</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {history.items.map((approval) => (
            <li
              key={approval.approvalId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">
                  {t("round", { round: approval.roundNumber })}
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                  {t(`approval_statuses.${approval.status}`)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                {t("submitted_at", {
                  date: instantLabel(approval.submittedAt, locale),
                })}
              </p>
              {approval.decisionNote && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {approval.decisionNote}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
