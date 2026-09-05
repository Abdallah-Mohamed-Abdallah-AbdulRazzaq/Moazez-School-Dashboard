"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";
import AnnouncementFilters from "@/features/communication/components/announcements/AnnouncementFilters";
import AnnouncementList from "@/features/communication/components/announcements/AnnouncementList";
import ArchiveAnnouncementDialog from "@/features/communication/components/announcements/ArchiveAnnouncementDialog";
import PublishAnnouncementDialog from "@/features/communication/components/announcements/PublishAnnouncementDialog";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import {
  useAnnouncements,
} from "@/features/communication/hooks/useAnnouncements";
import type { Announcement } from "@/features/communication/types/announcement.types";
import { announcementErrorMessage } from "@/features/communication/utils/announcement-error-messages";

const labels = {
  en: {
    title: "Announcements",
    description:
      "Create, publish, archive, and review school communication announcements.",
    newAnnouncement: "New Announcement",
    refresh: "Refresh",
    loading: "Loading announcements...",
    errorTitle: "Unable to load announcements",
    retry: "Retry",
    emptyTitle: "No announcements found",
    emptyDescription:
      "Create a draft announcement or adjust the filters to find published items.",
    search: "Search",
    searchPlaceholder: "Search by title or content",
    status: "Status",
    all: "All",
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    clear: "Clear",
    untitled: "Untitled announcement",
    noBody: "No announcement body.",
    priority: "Priority",
    view: "View",
    edit: "Edit",
    publish: "Publish",
    archive: "Archive",
    countLabel: "announcement",
    countLabelPlural: "announcements",
    publishTitle: "Publish announcement",
    publishDescription:
      "Publishing makes this announcement visible to its selected audience.",
    archiveTitle: "Archive announcement",
    archiveDescription:
      "Archiving hides this announcement from active lists while preserving its record.",
    cancel: "Cancel",
    publishedDone: "Announcement published.",
    archivedDone: "Announcement archived.",
  },
  ar: {
    title: "الإعلانات",
    description: "أنشئ وانشر وأرشف وراجع إعلانات التواصل المدرسي.",
    newAnnouncement: "إعلان جديد",
    refresh: "تحديث",
    loading: "جار تحميل الإعلانات...",
    errorTitle: "تعذر تحميل الإعلانات",
    retry: "إعادة المحاولة",
    emptyTitle: "لا توجد إعلانات",
    emptyDescription: "أنشئ مسودة إعلان أو عدل عوامل التصفية لعرض الإعلانات.",
    search: "بحث",
    searchPlaceholder: "ابحث بالعنوان أو المحتوى",
    status: "الحالة",
    all: "الكل",
    draft: "مسودة",
    published: "منشور",
    archived: "مؤرشف",
    clear: "مسح",
    untitled: "إعلان بدون عنوان",
    noBody: "لا يوجد محتوى للإعلان.",
    priority: "الأولوية",
    view: "عرض",
    edit: "تعديل",
    publish: "نشر",
    archive: "أرشفة",
    countLabel: "إعلان",
    countLabelPlural: "إعلانات",
    publishTitle: "نشر الإعلان",
    publishDescription: "سيصبح الإعلان مرئيا للجمهور المحدد بعد النشر.",
    archiveTitle: "أرشفة الإعلان",
    archiveDescription:
      "تخفي الأرشفة الإعلان من القوائم النشطة مع الاحتفاظ بالسجل.",
    cancel: "إلغاء",
    publishedDone: "تم نشر الإعلان.",
    archivedDone: "تمت أرشفة الإعلان.",
  },
};

type LocaleKey = keyof typeof labels;

export default function AnnouncementsPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManageAnnouncements = hasPermission(
    "communication.announcements.manage",
  );
  const {
    announcements,
    archive,
    error,
    filters,
    isLoading,
    isMutating,
    isRefreshing,
    publish,
    refresh,
    setFilters,
    total,
  } = useAnnouncements();
  const [publishingAnnouncement, setPublishingAnnouncement] =
    useState<Announcement | null>(null);
  const [archivingAnnouncement, setArchivingAnnouncement] =
    useState<Announcement | null>(null);

  const runMutation = async (
    action: () => Promise<unknown>,
    successMessage: string,
    close: () => void,
  ) => {
    try {
      await action();
      close();
      showSuccess(successMessage);
    } catch (nextError) {
      if (isApiError(nextError) && nextError.status === 409) {
        void refresh();
      }
      showError(announcementErrorMessage(nextError, locale));
    }
  };

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refresh()}
              loading={isRefreshing}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
            {canManageAnnouncements ? (
              <Link href={`/${locale}/communication/announcements/new`}>
                <Button
                  type="button"
                  leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                >
                  {t.newAnnouncement}
                </Button>
              </Link>
            ) : null}
          </>
        }
      />
      <CommunicationTabs />

      <AnnouncementFilters
        filters={filters}
        onChange={setFilters}
        labels={{
          search: t.search,
          searchPlaceholder: t.searchPlaceholder,
          status: t.status,
          all: t.all,
          draft: t.draft,
          published: t.published,
          archived: t.archived,
          clear: t.clear,
        }}
      />

      {error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={announcementErrorMessage(error, locale)}
          action={
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="text-sm text-slate-500">
        {total} {total === 1 ? t.countLabel : t.countLabelPlural}
      </div>

      <AnnouncementList
        announcements={announcements}
        canManageActions={canManageAnnouncements}
        locale={locale}
        disabled={isMutating}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          untitled: t.untitled,
          noBody: t.noBody,
          draft: t.draft,
          published: t.published,
          archived: t.archived,
          priority: t.priority,
          view: t.view,
          edit: t.edit,
          publish: t.publish,
          archive: t.archive,
        }}
        onPublish={setPublishingAnnouncement}
        onArchive={setArchivingAnnouncement}
      />

      <PublishAnnouncementDialog
        open={Boolean(publishingAnnouncement)}
        isSubmitting={isMutating}
        onClose={() => setPublishingAnnouncement(null)}
        onConfirm={() =>
          publishingAnnouncement
            ? runMutation(
                () => publish(publishingAnnouncement.id),
                t.publishedDone,
                () => setPublishingAnnouncement(null),
              )
            : undefined
        }
        labels={{
          title: t.publishTitle,
          description: t.publishDescription,
          cancel: t.cancel,
          publish: t.publish,
        }}
      />

      <ArchiveAnnouncementDialog
        open={Boolean(archivingAnnouncement)}
        isSubmitting={isMutating}
        onClose={() => setArchivingAnnouncement(null)}
        onConfirm={() =>
          archivingAnnouncement
            ? runMutation(
                () => archive(archivingAnnouncement.id),
                t.archivedDone,
                () => setArchivingAnnouncement(null),
              )
            : undefined
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
