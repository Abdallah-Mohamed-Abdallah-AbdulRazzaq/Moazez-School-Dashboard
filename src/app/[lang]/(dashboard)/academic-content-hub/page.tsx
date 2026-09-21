import {
  CalendarDays,
  ClipboardPenLine,
  Files,
  LibraryBig,
  MessageSquareText,
  Paperclip,
  Video,
} from "lucide-react";
import { getLocale } from "next-intl/server";
import { ComingSoon } from "@/components/ui";

const contentByLocale = {
  ar: {
    badge: "قريبًا",
    description:
      "نعمل حاليًا على بناء مساحة موحّدة لتنظيم المحتوى الأكاديمي والوصول إليه بسهولة.",
    featureLabels: { audience: "الجمهور", createdBy: "من ينشئه" },
    features: [
      {
        audience: "المعلم + الإدارة فقط",
        createdBy: "المعلم / الإدارة",
        description: "تحضير المعلم الأكاديمي",
        icon: ClipboardPenLine,
        title: "تحضير المعلم",
      },
      {
        audience: "الطلاب + أولياء الأمور",
        createdBy: "المعلم / الإدارة",
        description: "الخطة الأسبوعية",
        icon: CalendarDays,
        title: "الخطة الأسبوعية",
      },
      {
        audience: "أولياء الأمور",
        createdBy: "المعلم / الإدارة",
        description: "ملاحظات الخطة الموجهة لولي الأمر",
        icon: MessageSquareText,
        title: "ملاحظة أسبوعية لولي الأمر",
      },
      {
        audience: "الطلاب + أولياء الأمور حسب الإعداد",
        createdBy: "المعلم / الإدارة",
        description: "مرفقات ومواد المادة",
        icon: Paperclip,
        title: "مورد المادة",
      },
      {
        audience: "الطلاب + أولياء الأمور",
        createdBy: "المعلم / الإدارة",
        description: "حصة إلكترونية",
        icon: Video,
        title: "جلسة إلكترونية",
      },
      {
        audience: "حسب الجمهور المختار",
        createdBy: "المعلم / الإدارة",
        description: "مادة إضافية لا تقع تحت الأنواع السابقة",
        icon: Files,
        title: "مورد أكاديمي عام",
      },
    ],
    featuresTitle: "ما الذي نعمل عليه؟",
    title: "مركز المحتوى الأكاديمي",
  },
  en: {
    badge: "Coming soon",
    description:
      "We are building one place to organize academic content and make it easy to access.",
    featureLabels: { audience: "Audience", createdBy: "Created by" },
    features: [
      {
        audience: "Teachers and administrators only",
        createdBy: "Teacher / Administration",
        description: "Academic preparation created by the teacher.",
        icon: ClipboardPenLine,
        title: "Teacher Preparation",
      },
      {
        audience: "Students and guardians",
        createdBy: "Teacher / Administration",
        description: "The weekly academic plan.",
        icon: CalendarDays,
        title: "Weekly Plan",
      },
      {
        audience: "Guardians",
        createdBy: "Teacher / Administration",
        description: "Weekly-plan notes written specifically for guardians.",
        icon: MessageSquareText,
        title: "Guardian Weekly Note",
      },
      {
        audience: "Students and guardians, based on settings",
        createdBy: "Teacher / Administration",
        description: "Subject attachments and learning materials.",
        icon: Paperclip,
        title: "Subject Resource",
      },
      {
        audience: "Students and guardians",
        createdBy: "Teacher / Administration",
        description: "An online class session.",
        icon: Video,
        title: "Online Session",
      },
      {
        audience: "Selected audience",
        createdBy: "Teacher / Administration",
        description: "Additional academic material outside the other types.",
        icon: Files,
        title: "General Academic Resource",
      },
    ],
    featuresTitle: "What we are building",
    title: "Academic Content Hub",
  },
} as const;

export default async function AcademicContentHubPage() {
  const locale = await getLocale();
  const content = locale === "ar" ? contentByLocale.ar : contentByLocale.en;

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
      <ComingSoon {...content} icon={LibraryBig} />
    </main>
  );
}
