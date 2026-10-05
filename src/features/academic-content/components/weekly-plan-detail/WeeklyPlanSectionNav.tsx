"use client";

import {
  AlertCircle,
  Ban,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Link2,
  ListChecks,
  LoaderCircle,
  NotebookPen,
  Send,
  Target,
  Users,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  WEEKLY_PLAN_PANELS,
  type WeeklyPlanPanel,
} from "../../model/weeklyPlanDetail";
import type { EditorSectionIndicator } from "../editor/EditorSectionNav";

interface WeeklyPlanSectionNavProps {
  activePanel: WeeklyPlanPanel;
  variant: "desktop" | "mobile";
  showPublication: boolean;
  indicators: Partial<Record<WeeklyPlanPanel, EditorSectionIndicator>>;
  onChange: (panel: WeeklyPlanPanel) => void;
}

const PANEL_ICONS = {
  details: CalendarRange,
  targets: Users,
  objectives: Target,
  topics: BookOpen,
  homework: FileText,
  assessments: ClipboardCheck,
  notes: NotebookPen,
  resources: Link2,
  readiness: ListChecks,
  publication: Send,
  revisions: History,
} satisfies Record<WeeklyPlanPanel, typeof CalendarRange>;

const INDICATOR_ICONS = {
  unsaved: AlertCircle,
  saving: LoaderCircle,
  error: AlertCircle,
  ready: CheckCircle2,
  blocked: Ban,
} satisfies Record<EditorSectionIndicator, typeof AlertCircle>;

export default function WeeklyPlanSectionNav({
  activePanel,
  variant,
  showPublication,
  indicators,
  onChange,
}: WeeklyPlanSectionNavProps) {
  const t = useAcademicContentTranslations("weekly_plan_detail");
  const editorT = useAcademicContentTranslations("editor");
  const isDesktop = variant === "desktop";
  const panels = showPublication
    ? WEEKLY_PLAN_PANELS
    : WEEKLY_PLAN_PANELS.filter((panel) => panel !== "publication");

  return (
    <nav
      aria-label={t("sections_label")}
      className={
        isDesktop
          ? "hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm lg:block"
          : "flex gap-2 overflow-x-auto pb-1 lg:hidden"
      }
    >
      {panels.map((panel) => {
        const Icon = PANEL_ICONS[panel];
        const indicator = indicators[panel];
        const IndicatorIcon = indicator ? INDICATOR_ICONS[indicator] : null;
        const active = panel === activePanel;
        return (
          <div
            key={panel}
            className={`flex shrink-0 items-center gap-1 ${isDesktop ? "mb-1 last:mb-0" : ""}`}
          >
            <button
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(panel)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDesktop ? "w-full rounded-lg border-s-4 px-3 py-2.5 text-start" : "rounded-lg border-b-2 px-3 py-2"} ${active ? "border-primary bg-primary/10 text-primary" : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="flex-1">{t(`sections.${panel}`)}</span>
            </button>
            {IndicatorIcon && indicator ? (
              <span
                role="status"
                aria-label={editorT(`indicators.${indicator}`)}
              >
                <IndicatorIcon
                  aria-hidden="true"
                  className={`size-4 ${indicator === "saving" ? "animate-spin" : ""}`}
                />
              </span>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
