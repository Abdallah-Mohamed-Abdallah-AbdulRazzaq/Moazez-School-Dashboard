"use client";

import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/Toast";
import AnnouncementEditor from "@/features/communication/components/announcements/AnnouncementEditor";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import { useAnnouncements } from "@/features/communication/hooks/useAnnouncements";
import type { Announcement } from "@/features/communication/types/announcement.types";

const labels = {
  en: {
    back: "Back to announcements",
    title: "New Announcement",
    description: "Compose backend-compatible announcement content and save it.",
    formTitle: "Title",
    body: "Body",
    status: "Status",
    draft: "Draft",
    scheduled: "Scheduled",
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
    titleRequired: "Enter a title.",
    bodyRequired: "Enter a body.",
    created: "Announcement draft created.",
    failed: "Unable to create announcement.",
  },
  ar: {
    back: "العودة إلى الإعلانات",
    title: "إعلان جديد",
    description: "اكتب محتوى الإعلان المتوافق مع الخلفية واحفظه.",
    formTitle: "العنوان",
    body: "المحتوى",
    status: "الحالة",
    draft: "مسودة",
    scheduled: "مجدول",
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
    titleRequired: "أدخل عنوانا.",
    bodyRequired: "أدخل محتوى.",
    created: "تم إنشاء مسودة الإعلان.",
    failed: "تعذر إنشاء الإعلان.",
  },
};

type LocaleKey = keyof typeof labels;

export default function CreateAnnouncementPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { create, isMutating } = useAnnouncements();

  const handleSubmit = async (values: Parameters<typeof create>[0]) => {
    try {
      const announcement = (await create(values)) as Announcement | null;
      showSuccess(t.created);
      router.push(
        announcement?.id
          ? `/${locale}/communication/announcements/${announcement.id}`
          : `/${locale}/communication/announcements`,
      );
    } catch {
      showError(t.failed);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/communication/announcements`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>
      <CommunicationPageHeader title={t.title} description={t.description} />
      <CommunicationTabs />
      <AnnouncementEditor
        isSubmitting={isMutating}
        onSubmit={handleSubmit}
        labels={{
          title: t.formTitle,
          body: t.body,
          status: t.status,
          draft: t.draft,
          scheduled: t.scheduled,
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
          saveChanges: t.saveDraft,
          titleRequired: t.titleRequired,
          bodyRequired: t.bodyRequired,
        }}
      />
    </div>
  );
}
