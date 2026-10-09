"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  History,
  Link2,
  ListChecks,
  LoaderCircle,
  Send,
  Users,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { SubjectResourcePanel } from "../../model/subjectResourceDetail";
import type { EditorSectionIndicator } from "../editor/EditorSectionNav";

interface SubjectResourceSectionNavProps {
  activePanel: SubjectResourcePanel;
  variant: "desktop" | "mobile";
  showPublication: boolean;
  indicators: Partial<Record<SubjectResourcePanel, EditorSectionIndicator>>;
  onChange: (panel: SubjectResourcePanel) => void;
}

const PANELS: readonly SubjectResourcePanel[] = [
  "preview",
  "targets",
  "details",
  "resources",
  "readiness",
  "publication",
  "revisions",
];
const PANEL_ICONS = {
  preview: Eye,
  details: FileText,
  targets: Users,
  resources: Link2,
  readiness: ListChecks,
  publication: Send,
  revisions: History,
} satisfies Record<SubjectResourcePanel, typeof Eye>;
const INDICATOR_ICONS = {
  unsaved: AlertCircle,
  saving: LoaderCircle,
  error: AlertCircle,
  ready: CheckCircle2,
  blocked: Ban,
} satisfies Record<EditorSectionIndicator, typeof AlertCircle>;

export default function SubjectResourceSectionNav(
  props: SubjectResourceSectionNavProps,
) {
  const t = useAcademicContentTranslations("subject_resource_detail");
  const editorT = useAcademicContentTranslations("editor");
  const panels = props.showPublication
    ? PANELS
    : PANELS.filter((panel) => panel !== "publication");
  const desktop = props.variant === "desktop";
  return (
    <nav
      aria-label={t("workspace_label")}
      className={
        desktop
          ? "hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm lg:block"
          : "flex gap-2 overflow-x-auto pb-1 lg:hidden"
      }
    >
      {panels.map((panel) => {
        const Icon = PANEL_ICONS[panel];
        const indicator = props.indicators[panel];
        const IndicatorIcon = indicator ? INDICATOR_ICONS[indicator] : null;
        const active = panel === props.activePanel;
        return (
          <div
            key={panel}
            className={`flex shrink-0 items-center gap-1 ${desktop ? "mb-1 last:mb-0" : ""}`}
          >
            <button
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => props.onChange(panel)}
              className={`flex items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${desktop ? "w-full rounded-lg border-s-4 px-3 py-2.5 text-start" : "rounded-lg border-b-2 px-3 py-2"} ${active ? "border-primary bg-primary/10 text-primary" : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
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
