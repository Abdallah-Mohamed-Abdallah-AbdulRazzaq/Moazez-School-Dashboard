"use client";

import {
  Activity,
  AlertCircle,
  Ban,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Lightbulb,
  Link2,
  ListChecks,
  LoaderCircle,
  NotebookPen,
  ScrollText,
  Send,
  Target,
  Users,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  TEACHER_PREPARATION_PANELS,
  type TeacherPreparationPanel,
} from "../../model/teacherPreparationDetail";
import type { EditorSectionIndicator } from "../editor/EditorSectionNav";

interface TeacherPreparationSectionNavProps {
  activePanel: TeacherPreparationPanel;
  variant: "desktop" | "mobile";
  showPublication: boolean;
  indicators: Partial<Record<TeacherPreparationPanel, EditorSectionIndicator>>;
  onChange: (panel: TeacherPreparationPanel) => void;
}

const PANEL_ICONS = {
  overview: FileText,
  targets: Users,
  objectives: Target,
  learningOutcomes: Lightbulb,
  teachingStrategies: BookOpen,
  activities: Activity,
  resources: Link2,
  assessment: ClipboardCheck,
  teacherNotes: NotebookPen,
  references: ScrollText,
  readiness: ListChecks,
  publication: Send,
  revisions: History,
} satisfies Record<TeacherPreparationPanel, typeof FileText>;

const INDICATOR_ICONS = {
  unsaved: AlertCircle,
  saving: LoaderCircle,
  error: AlertCircle,
  ready: CheckCircle2,
  blocked: Ban,
} satisfies Record<EditorSectionIndicator, typeof AlertCircle>;

export default function TeacherPreparationSectionNav({
  activePanel,
  variant,
  showPublication,
  indicators,
  onChange,
}: TeacherPreparationSectionNavProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail");
  const editorT = useAcademicContentTranslations("editor");
  const isDesktop = variant === "desktop";
  const panels = showPublication
    ? TEACHER_PREPARATION_PANELS
    : TEACHER_PREPARATION_PANELS.filter(({ id }) => id !== "publication");

  return (
    <nav
      aria-label={t("sections_label")}
      className={isDesktop ? "hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm lg:block" : "flex gap-2 overflow-x-auto pb-1 lg:hidden"}
    >
      {panels.map(({ id, labelKey }) => {
        const Icon = PANEL_ICONS[id];
        const indicator = indicators[id];
        const IndicatorIcon = indicator ? INDICATOR_ICONS[indicator] : null;
        const isActive = id === activePanel;
        return (
          <div key={id} className={`flex shrink-0 items-center gap-1 ${isDesktop ? "mb-1 last:mb-0" : ""}`}>
            <button
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDesktop ? "w-full rounded-lg border-s-4 px-3 py-2.5 text-start" : "rounded-lg border-b-2 px-3 py-2"} ${isActive ? "border-primary bg-primary/10 text-primary" : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="flex-1">{t(`sections.${labelKey}`)}</span>
            </button>
            {IndicatorIcon && indicator ? (
              <span
                role="status"
                aria-label={editorT(`indicators.${indicator}`)}
                title={editorT(`indicators.${indicator}`)}
              >
                <IndicatorIcon
                  aria-hidden="true"
                  className={`size-4 shrink-0 ${indicator === "saving" ? "animate-spin" : ""}`}
                />
              </span>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
