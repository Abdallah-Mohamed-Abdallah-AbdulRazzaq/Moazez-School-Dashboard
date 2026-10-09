"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  FileText,
  History,
  Link2,
  ListChecks,
  LoaderCircle,
  Send,
  Target,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { EditorSectionIndicator } from "../editor/EditorSectionNav";

export const GENERAL_RESOURCE_PANELS = [
  "overview",
  "targets",
  "resources",
  "readiness",
  "publication",
  "revisions",
] as const;

export type GeneralResourcePanel = (typeof GENERAL_RESOURCE_PANELS)[number];

interface Props {
  activePanel: GeneralResourcePanel;
  variant: "desktop" | "mobile";
  showPublication: boolean;
  indicators: Partial<Record<GeneralResourcePanel, EditorSectionIndicator>>;
  onChange: (panel: GeneralResourcePanel) => void;
}

const PANEL_ICONS = {
  overview: FileText,
  targets: Target,
  resources: Link2,
  readiness: ListChecks,
  publication: Send,
  revisions: History,
} satisfies Record<GeneralResourcePanel, typeof FileText>;

const INDICATOR_ICONS = {
  unsaved: AlertCircle,
  saving: LoaderCircle,
  error: AlertCircle,
  ready: CheckCircle2,
  blocked: Ban,
} satisfies Record<EditorSectionIndicator, typeof AlertCircle>;

export default function GeneralResourceSectionNav(props: Props) {
  const t = useAcademicContentTranslations("general_resource_detail");
  const editorT = useAcademicContentTranslations("editor");
  const isDesktop = props.variant === "desktop";
  const panels = props.showPublication
    ? GENERAL_RESOURCE_PANELS
    : GENERAL_RESOURCE_PANELS.filter((panel) => panel !== "publication");

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
        const indicator = props.indicators[panel];
        const IndicatorIcon = indicator ? INDICATOR_ICONS[indicator] : null;
        const active = panel === props.activePanel;
        return (
          <div
            key={panel}
            className={`flex shrink-0 items-center gap-1 ${isDesktop ? "mb-1 last:mb-0" : ""}`}
          >
            <button
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => props.onChange(panel)}
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
