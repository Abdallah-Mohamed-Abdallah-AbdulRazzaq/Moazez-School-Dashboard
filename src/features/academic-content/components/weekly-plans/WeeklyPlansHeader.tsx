"use client";

import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { academicContentOverviewHref } from "../overview/overviewRoutes";

interface WeeklyPlansHeaderProps {
  yearId: string;
  termId: string;
}

export default function WeeklyPlansHeader({
  yearId,
  termId,
}: WeeklyPlansHeaderProps) {
  const locale = useLocale();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const t = useAcademicContentTranslations("weekly_plans");

  const createWeeklyPlan = () =>
    router.push(
      academicContentOverviewHref({
        locale,
        routeSuffix: "/new",
        yearId,
        termId,
        extraQuery: { type: "WEEKLY_PLAN" },
      }),
    );

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <nav
          aria-label={t("breadcrumb.overview")}
          className="mb-3 flex items-center gap-2 text-sm text-gray-500"
        >
          <span>{t("breadcrumb.overview")}</span>
          <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
          <span className="font-medium text-gray-700">{t("title")}</span>
        </nav>
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CalendarDays aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-4xl text-sm text-gray-600 sm:text-base">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
      {hasPermission("academics.academic_content.manage") ? (
        <Button
          leftIcon={<Plus aria-hidden="true" className="size-4" />}
          onClick={createWeeklyPlan}
        >
          {t("new_plan")}
        </Button>
      ) : null}
    </header>
  );
}
