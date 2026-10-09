"use client";

import { CalendarDays, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { WeeklyPlanView } from "../../model/weeklyPlans";

interface WeeklyPlanViewToolbarProps {
  view: WeeklyPlanView;
  onViewChange: (view: WeeklyPlanView) => void;
}

export default function WeeklyPlanViewToolbar({
  view,
  onViewChange,
}: WeeklyPlanViewToolbarProps) {
  const t = useAcademicContentTranslations("weekly_plans");

  return (
    <section
      aria-label={t("view_options")}
      className="flex justify-end rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
    >
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <Button
          size="sm"
          variant={view === "table" ? "primary" : "ghost"}
          leftIcon={<Table2 aria-hidden="true" className="size-4" />}
          onClick={() => onViewChange("table")}
        >
          {t("table_view")}
        </Button>
        <Button
          size="sm"
          variant={view === "calendar" ? "primary" : "ghost"}
          leftIcon={<CalendarDays aria-hidden="true" className="size-4" />}
          onClick={() => onViewChange("calendar")}
        >
          {t("calendar_view")}
        </Button>
      </div>
    </section>
  );
}
