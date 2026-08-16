"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ClipboardCheck,
  FileText,
  Megaphone,
  UserPlus,
} from "lucide-react";
import { useMemo } from "react";
import DashboardAnnouncementDraftForm from "@/features/dashboard/components/DashboardAnnouncementDraftForm";
import type { DashboardAnnouncementLocale } from "@/features/dashboard/utils/dashboardAnnouncementLabels";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

type QuickAction = {
  id: string;
  href: string;
  icon: typeof UserPlus;
  label: string;
  color: string;
  permissions: readonly PermissionKey[];
};

export default function QuickActionPanel() {
  const locale = useLocale() as DashboardAnnouncementLocale;
  const t = useTranslations("quick_actions");
  const { hasPermission, isPermissionsReady } = usePermissions();
  const quickActions = useMemo(
    () =>
      createQuickActions(locale, t).filter((action) =>
        action.permissions.every(hasPermission),
      ),
    [hasPermission, locale, t],
  );
  const canManageAnnouncements = hasPermission(
    "communication.announcements.manage",
  );

  if (!isPermissionsReady || (!quickActions.length && !canManageAnnouncements)) {
    return null;
  }

  return (
    <aside className="h-full rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-gray-900">{t("title")}</h3>
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(3,107,128,0.10)]" aria-hidden="true" />
      </div>
      <QuickActionLinks actions={quickActions} />
      {canManageAnnouncements ? (
        <DashboardAnnouncementDraftForm
          locale={locale}
          notificationTitle={t("notification_center")}
        />
      ) : null}
    </aside>
  );
}

function QuickActionLinks({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2.5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.id}
            href={action.href}
            className="group flex items-center gap-2 rounded-xl px-3 py-3 text-lg font-medium shadow-sm transition-[box-shadow,filter] duration-200 hover:brightness-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 cursor-pointer"
            style={{
              backgroundColor: action.color,
              borderColor: action.color,
              borderWidth: 2,
            }}
          >
            <Icon className="h-4 w-4 text-white transition-colors" />
            <span className="text-sm font-black text-white transition-colors">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function createQuickActions(
  locale: string,
  t: ReturnType<typeof useTranslations>,
): QuickAction[] {
  return [
    {
      id: "add_student",
      icon: UserPlus,
      label: t("add_student"),
      href: `/${locale}/students-guardians/registration`,
      color: "#0ac5b2",
      permissions: [
        "students.records.manage",
        "students.guardians.manage",
        "students.enrollments.manage",
      ],
    },
    {
      id: "attendance",
      icon: ClipboardCheck,
      label: t("attendance"),
      href: `/${locale}/attendance/roll-call`,
      color: "#D93030",
      permissions: [
        "attendance.sessions.view",
        "attendance.policies.view",
        "academics.structure.view",
      ],
    },
    {
      id: "announcement",
      icon: Megaphone,
      label: t("announcement"),
      href: `/${locale}/communication/announcements`,
      color: "#37A465",
      permissions: ["communication.announcements.view"],
    },
    {
      id: "assessment",
      icon: FileText,
      label: t("assessment"),
      href: `/${locale}/grades/assessments/new`,
      color: "#025a6b",
      permissions: ["grades.gradebook.view", "grades.assessments.manage"],
    },
  ];
}
