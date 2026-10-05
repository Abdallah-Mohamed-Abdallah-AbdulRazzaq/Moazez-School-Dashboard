"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Users,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type { AcademicContentDetail } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import { academicContentOverviewHref } from "../overview/overviewRoutes";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";

type WeeklyPlanContent = Extract<
  AcademicContentDetail,
  { type: "WEEKLY_PLAN" }
>;

interface WeeklyPlanHeaderProps {
  content: WeeklyPlanContent;
  locale: string;
  targets: readonly TeacherPreparationTargetDisplay[];
  lifecycleActions?: ReactNode;
}

function uniqueLabels(labels: Array<string | null>): string[] {
  return [
    ...new Set(labels.filter((label): label is string => Boolean(label))),
  ];
}

function formatDateOnly(
  value: string | undefined,
  formatter: Intl.DateTimeFormat,
): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : formatter.format(date);
}

function SummaryCell({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-e border-gray-200 px-4 py-3 last:border-e-0">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="truncate text-sm font-medium text-gray-800">
        {label}
      </span>
    </div>
  );
}

export default function WeeklyPlanHeader({
  content,
  locale,
  targets,
  lifecycleActions,
}: WeeklyPlanHeaderProps) {
  const t = useAcademicContentTranslations("weekly_plan_detail.header");
  const commonT = useAcademicContentTranslations();
  const details = content.details;
  const subjects = uniqueLabels(targets.map(({ subject }) => subject));
  const scopes = uniqueLabels(targets.map(({ scope }) => scope));
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const weekStart = formatDateOnly(details?.weekStartDate, formatter);
  const weekEnd = formatDateOnly(details?.weekEndDate, formatter);
  const weekLabel =
    weekStart && weekEnd ? `${weekStart} – ${weekEnd}` : t("week_not_set");
  const backHref = academicContentOverviewHref({
    locale,
    routeSuffix: "/weekly-plans",
    yearId: content.academicYearId,
    termId: content.termId,
  });

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("back")}
        </Link>
        {lifecycleActions}
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <CalendarRange aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                {content.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AcademicContentStatusBadge status={content.status} />
            {content.publicationStatus ? (
              <PublicationStatusBadge status={content.publicationStatus} />
            ) : null}
          </div>
        </div>
        <div className="grid border-t border-gray-200 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCell
            icon={<CalendarDays aria-hidden="true" className="size-5" />}
            label={weekLabel}
          />
          <SummaryCell
            icon={<BookOpen aria-hidden="true" className="size-5" />}
            label={
              subjects.length === 1
                ? subjects[0]
                : t("subjects", { count: subjects.length })
            }
          />
          <SummaryCell
            icon={<Users aria-hidden="true" className="size-5" />}
            label={
              scopes.length === 1
                ? scopes[0]
                : t("targets", { count: targets.length })
            }
          />
          <SummaryCell
            icon={<Users aria-hidden="true" className="size-5" />}
            label={commonT(`audiences.${content.audience}`)}
          />
        </div>
      </section>
    </header>
  );
}
