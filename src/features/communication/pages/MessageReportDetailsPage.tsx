"use client";

import { useLocale } from "next-intl";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import ReportDetailsPanel from "@/features/communication/components/safety/ReportDetailsPanel";
import ReportStatusActions from "@/features/communication/components/safety/ReportStatusActions";
import ReportedMessagePreview from "@/features/communication/components/safety/ReportedMessagePreview";
import { useMessageReport } from "@/features/communication/hooks/useMessageReport";
import type { MessageReportStatus } from "@/features/communication/types/safety.types";

interface MessageReportDetailsPageProps {
  reportId: string;
}

const labels = {
  en: {
    back: "Back to reports",
    title: "Report Details",
    description:
      "Inspect the reported message, review context, and update moderation status.",
    loading: "Loading report...",
    errorTitle: "Unable to load report",
    retry: "Retry",
    refresh: "Refresh",
    open: "Open",
    inReview: "In review",
    resolved: "Resolved",
    reportInfo: "Report Information",
    status: "Status",
    reason: "Reason",
    spam: "Spam",
    harassment: "Harassment",
    bullying: "Bullying",
    abusiveLanguage: "Abusive language",
    inappropriateContent: "Inappropriate content",
    safety: "Safety concern",
    privacy: "Privacy concern",
    other: "Other",
    descriptionLabel: "Description",
    reporter: "Reporter",
    messageId: "Message ID",
    resolutionNote: "Resolution note",
    createdAt: "Created",
    updatedAt: "Updated",
    unknown: "Unknown",
    messagePreview: "Reported Message",
    noMessage: "Reported message context is not available.",
    deleted: "Message deleted",
    hidden: "Message hidden",
    auditReason: "Moderation reason",
    auditTimestamp: "Moderation timestamp",
    attachments: "Attachments",
    sender: "Sender",
    conversation: "Conversation",
    actionsTitle: "Moderator Actions",
    markInReview: "Move to In Review",
    resolve: "Resolve Report",
    resolutionPlaceholder: "Describe the resolution for audit history.",
    noteRequired: "Add a resolution note.",
    alreadyResolved: "This report is resolved.",
    updated: "Report status updated.",
    mutationFailed: "Action failed. Please try again.",
  },
  ar: {
    hidden: "رسالة مخفية",
    auditReason: "سبب الإشراف",
    auditTimestamp: "وقت الإشراف",
    attachments: "المرفقات",
    spam: "رسائل مزعجة",
    harassment: "تحرش",
    bullying: "تنمر",
    abusiveLanguage: "لغة مسيئة",
    inappropriateContent: "محتوى غير مناسب",
    safety: "مشكلة تتعلق بالسلامة",
    privacy: "مشكلة تتعلق بالخصوصية",
    other: "أخرى",
    back: "العودة إلى البلاغات",
    title: "تفاصيل البلاغ",
    description: "راجع الرسالة المبلغ عنها وسياقها وحدث حالة الإشراف.",
    loading: "جار تحميل البلاغ...",
    errorTitle: "تعذر تحميل البلاغ",
    retry: "إعادة المحاولة",
    refresh: "تحديث",
    open: "مفتوح",
    inReview: "قيد المراجعة",
    resolved: "محلول",
    reportInfo: "معلومات البلاغ",
    status: "الحالة",
    reason: "السبب",
    descriptionLabel: "الوصف",
    reporter: "المبلغ",
    messageId: "معرف الرسالة",
    resolutionNote: "ملاحظة الحل",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "تاريخ التحديث",
    unknown: "غير معروف",
    messagePreview: "الرسالة المبلغ عنها",
    noMessage: "سياق الرسالة المبلغ عنها غير متاح.",
    deleted: "تم حذف الرسالة",
    sender: "المرسل",
    conversation: "المحادثة",
    actionsTitle: "إجراءات المشرف",
    markInReview: "نقل إلى قيد المراجعة",
    resolve: "حل البلاغ",
    resolutionPlaceholder: "اكتب وصف الحل لأغراض السجل.",
    noteRequired: "أضف ملاحظة الحل.",
    alreadyResolved: "تم حل هذا البلاغ.",
    updated: "تم تحديث حالة البلاغ.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
  },
};

type LocaleKey = keyof typeof labels;

function statusTone(status?: string) {
  if (status === "resolved") return "success" as const;
  if (status === "in_review") return "warning" as const;
  return "error" as const;
}

function statusLabel(
  status: string | undefined,
  t: (typeof labels)[LocaleKey],
) {
  if (status === "resolved") return t.resolved;
  if (status === "in_review") return t.inReview;
  return t.open;
}

export default function MessageReportDetailsPage({
  reportId,
}: MessageReportDetailsPageProps) {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const {
    error,
    isLoading,
    isMutating,
    isRefreshing,
    message,
    refresh,
    report,
    updateStatus,
  } = useMessageReport(reportId);

  const handleUpdateStatus = async (
    status: MessageReportStatus,
    resolutionNote?: string,
  ) => {
    try {
      await updateStatus(status, resolutionNote);
      showSuccess(t.updated);
    } catch {
      showError(t.mutationFailed);
    }
  };

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/communication/moderation`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>

      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <>
            <CommunicationStatusChip
              label={statusLabel(report?.status, t)}
              tone={statusTone(report?.status)}
            />
            <Button
              type="button"
              variant="secondary"
              loading={isRefreshing}
              onClick={() => void refresh()}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
          </>
        }
      />
      <CommunicationTabs />

      {error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={error}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh()}
            >
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ReportedMessagePreview
            message={message}
            labels={{
              title: t.messagePreview,
              noMessage: t.noMessage,
              deleted: t.deleted,
              hidden: t.hidden,
              auditReason: t.auditReason,
              auditTimestamp: t.auditTimestamp,
              attachments: t.attachments,
              sender: t.sender,
              conversation: t.conversation,
              createdAt: t.createdAt,
              unknown: t.unknown,
            }}
          />
          <ReportDetailsPanel
            report={report}
            labels={{
              title: t.reportInfo,
              status: t.status,
              reason: t.reason,
              spam: t.spam,
              harassment: t.harassment,
              bullying: t.bullying,
              abusiveLanguage: t.abusiveLanguage,
              inappropriateContent: t.inappropriateContent,
              safety: t.safety,
              privacy: t.privacy,
              other: t.other,
              description: t.descriptionLabel,
              reporter: t.reporter,
              messageId: t.messageId,
              resolutionNote: t.resolutionNote,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              open: t.open,
              inReview: t.inReview,
              resolved: t.resolved,
              unknown: t.unknown,
            }}
          />
        </div>
        <ReportStatusActions
          status={report?.status}
          isSubmitting={isMutating}
          onUpdateStatus={handleUpdateStatus}
          labels={{
            title: t.actionsTitle,
            markInReview: t.markInReview,
            resolve: t.resolve,
            resolutionNote: t.resolutionNote,
            resolutionPlaceholder: t.resolutionPlaceholder,
            noteRequired: t.noteRequired,
            resolved: t.alreadyResolved,
          }}
        />
      </div>
    </div>
  );
}
