"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Archive, ArrowLeft, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import AnnouncementEditor from "@/features/communication/components/announcements/AnnouncementEditor";
import AnnouncementReadSummary from "@/features/communication/components/announcements/AnnouncementReadSummary";
import ArchiveAnnouncementDialog from "@/features/communication/components/announcements/ArchiveAnnouncementDialog";
import PublishAnnouncementDialog from "@/features/communication/components/announcements/PublishAnnouncementDialog";
import AttachmentUploader from "@/features/communication/components/conversations/AttachmentUploader";
import MessageAttachments from "@/features/communication/components/conversations/MessageAttachments";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useAnnouncement } from "@/features/communication/hooks/useAnnouncement";
import { useAnnouncementAttachments } from "@/features/communication/hooks/useAnnouncementAttachments";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";

interface AnnouncementDetailsPageProps {
  announcementId: string;
}

const labels = {
  en: {
    back: "Back to announcements",
    title: "Announcement Details",
    description:
      "Review, edit drafts, publish, archive, and inspect read status.",
    loading: "Loading announcement...",
    errorTitle: "Unable to load announcement",
    retry: "Retry",
    refresh: "Refresh",
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    publish: "Publish",
    archive: "Archive",
    cancelAnnouncement: "Cancel Schedule",
    formTitle: "Title",
    body: "Body",
    status: "Status",
    scheduledStatus: "Scheduled",
    priority: "Priority",
    normal: "Normal",
    low: "Low",
    high: "High",
    urgent: "Urgent",
    audienceType: "Audience type",
    audienceId: "Audience",
    audienceRequired: "Select an audience.",
    searchUsers: "Search users...",
    school: "School",
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    custom: "Custom",
    scheduledAt: "Scheduled at",
    expiresAt: "Expires at",
    saveDraft: "Save Draft",
    saveChanges: "Save Changes",
    titleRequired: "Enter a title.",
    bodyRequired: "Enter a body.",
    readSummary: "Read Summary",
    totalRecipients: "Recipients",
    read: "Read",
    unread: "Unread",
    noReadData: "No read summary is available yet.",
    attachments: "Attachments",
    attachFile: "Attach",
    fileTooLarge: "File must be {size}MB or smaller.",
    uploadFailed: "Unable to upload attachment.",
    download: "Open attachment",
    removeAttachment: "Remove attachment",
    publishTitle: "Publish announcement",
    publishDescription:
      "Publishing makes this announcement visible to its selected audience.",
    archiveTitle: "Archive announcement",
    archiveDescription:
      "Archiving hides this announcement from active lists while preserving its record.",
    cancel: "Cancel",
    updated: "Announcement updated.",
    publishedDone: "Announcement published.",
    archivedDone: "Announcement archived.",
    mutationFailed: "Action failed. Please try again.",
  },
  ar: {
    back: "العودة إلى الإعلانات",
    title: "تفاصيل الإعلان",
    description: "راجع المسودات وعدلها وانشرها وأرشفها وتابع حالة القراءة.",
    loading: "جار تحميل الإعلان...",
    errorTitle: "تعذر تحميل الإعلان",
    retry: "إعادة المحاولة",
    refresh: "تحديث",
    draft: "مسودة",
    published: "منشور",
    archived: "مؤرشف",
    publish: "نشر",
    archive: "أرشفة",
    cancelAnnouncement: "إلغاء الجدولة",
    formTitle: "العنوان",
    body: "المحتوى",
    status: "الحالة",
    scheduledStatus: "مجدول",
    priority: "الأولوية",
    normal: "عادية",
    low: "منخفضة",
    high: "مرتفعة",
    urgent: "عاجلة",
    audienceType: "نوع الجمهور",
    audienceId: "الجمهور",
    audienceRequired: "اختر جمهورًا.",
    searchUsers: "ابحث عن المستخدمين...",
    school: "المدرسة",
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    custom: "مخصص",
    scheduledAt: "موعد الجدولة",
    expiresAt: "ينتهي في",
    saveDraft: "حفظ المسودة",
    saveChanges: "حفظ التغييرات",
    titleRequired: "أدخل عنوانا.",
    bodyRequired: "أدخل محتوى.",
    readSummary: "ملخص القراءة",
    totalRecipients: "المستلمون",
    read: "مقروء",
    unread: "غير مقروء",
    noReadData: "لا يوجد ملخص قراءة بعد.",
    attachments: "المرفقات",
    attachFile: "إرفاق",
    fileTooLarge: "يجب ألا يتجاوز الملف {size} ميجابايت.",
    uploadFailed: "تعذر رفع المرفق.",
    download: "فتح المرفق",
    removeAttachment: "إزالة المرفق",
    publishTitle: "نشر الإعلان",
    publishDescription: "سيصبح الإعلان مرئيا للجمهور المحدد بعد النشر.",
    archiveTitle: "أرشفة الإعلان",
    archiveDescription:
      "تخفي الأرشفة الإعلان من القوائم النشطة مع الاحتفاظ بالسجل.",
    cancel: "إلغاء",
    updated: "تم تحديث الإعلان.",
    publishedDone: "تم نشر الإعلان.",
    archivedDone: "تمت أرشفة الإعلان.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
  },
};

type LocaleKey = keyof typeof labels;

function statusTone(status?: string) {
  if (status === "published") return "success" as const;
  if (status === "archived") return "warning" as const;
  return "info" as const;
}

function statusLabel(
  status: string | undefined,
  t: (typeof labels)[LocaleKey],
) {
  if (status === "published") return t.published;
  if (status === "archived") return t.archived;
  return t.draft;
}

export default function AnnouncementDetailsPage({
  announcementId,
}: AnnouncementDetailsPageProps) {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const {
    announcement,
    archive,
    error,
    isLoading,
    isMutating,
    isRefreshing,
    publish,
    readSummary,
    refresh,
    update,
    cancel: cancelScheduledAnnouncement,
  } = useAnnouncement(announcementId);
  const { policy } = useCommunicationPolicy();
  const attachmentState = useAnnouncementAttachments(
    announcementId,
    policy?.maxAttachmentSizeMb,
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const status = announcement?.status ?? "draft";
  const canEdit = status === "draft";
  const canPublish = status === "draft";
  const canArchive = status !== "archived";
  const canCancel = status === "scheduled";

  const runMutation = async (
    action: () => Promise<unknown>,
    successMessage: string,
    close?: () => void,
  ) => {
    try {
      await action();
      close?.();
      showSuccess(successMessage);
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
        href={`/${locale}/communication/announcements`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>

      <CommunicationPageHeader
        title={announcement?.title || announcement?.titleEn || t.title}
        description={t.description}
        actions={
          <>
            <CommunicationStatusChip
              label={statusLabel(status, t)}
              tone={statusTone(status)}
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
            {canPublish ? (
              <Button
                type="button"
                disabled={isMutating}
                leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setPublishOpen(true)}
              >
                {t.publish}
              </Button>
            ) : null}
            {canArchive ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isMutating}
                leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setArchiveOpen(true)}
              >
                {t.archive}
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isMutating}
                onClick={() =>
                  void runMutation(cancelScheduledAnnouncement, t.updated)
                }
              >
                {t.cancelAnnouncement}
              </Button>
            ) : null}
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
        <AnnouncementEditor
          key={announcement?.id ?? announcementId}
          announcement={announcement}
          readOnly={!canEdit}
          isSubmitting={isMutating}
          submitLabel={t.saveChanges}
          onSubmit={(values) => runMutation(() => update(values), t.updated)}
          labels={{
            title: t.formTitle,
            body: t.body,
            status: t.status,
            draft: t.draft,
            scheduled: t.scheduledStatus,
            priority: t.priority,
            normal: t.normal,
            low: t.low,
            high: t.high,
            urgent: t.urgent,
            audienceType: t.audienceType,
            audienceId: t.audienceId,
            audienceRequired: t.audienceRequired,
            searchUsers: t.searchUsers,
            school: t.school,
            stage: t.stage,
            grade: t.grade,
            section: t.section,
            classroom: t.classroom,
            custom: t.custom,
            scheduledAt: t.scheduledAt,
            expiresAt: t.expiresAt,
            saveDraft: t.saveDraft,
            saveChanges: t.saveChanges,
            titleRequired: t.titleRequired,
            bodyRequired: t.bodyRequired,
          }}
        />
        <AnnouncementReadSummary
          summary={readSummary}
          labels={{
            title: t.readSummary,
            total: t.totalRecipients,
            read: t.read,
            unread: t.unread,
            noData: t.noReadData,
          }}
        />
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              {t.attachments}
            </h2>
            {policy?.allowAttachments !== false ? (
              <AttachmentUploader
                labels={{
                  attachFile: t.attachFile,
                  fileTooLarge: t.fileTooLarge,
                  uploadFailed: t.uploadFailed,
                }}
                isUploading={attachmentState.isUploading}
                maxAttachmentSizeMb={policy?.maxAttachmentSizeMb}
                onUpload={attachmentState.attachFile}
              />
            ) : null}
          </div>
          {attachmentState.error ? (
            <p className="text-sm text-red-600">{attachmentState.error}</p>
          ) : null}
          <MessageAttachments
            attachments={attachmentState.attachments}
            canRemove={canEdit}
            labels={{
              download: t.download,
              removeAttachment: t.removeAttachment,
            }}
            onRemove={attachmentState.removeAttachment}
          />
        </section>
      </div>

      <PublishAnnouncementDialog
        open={publishOpen}
        isSubmitting={isMutating}
        onClose={() => setPublishOpen(false)}
        onConfirm={() =>
          runMutation(publish, t.publishedDone, () => setPublishOpen(false))
        }
        labels={{
          title: t.publishTitle,
          description: t.publishDescription,
          cancel: t.cancel,
          publish: t.publish,
        }}
      />

      <ArchiveAnnouncementDialog
        open={archiveOpen}
        isSubmitting={isMutating}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() =>
          runMutation(archive, t.archivedDone, () => setArchiveOpen(false))
        }
        labels={{
          title: t.archiveTitle,
          description: t.archiveDescription,
          cancel: t.cancel,
          archive: t.archive,
        }}
      />
    </div>
  );
}
