"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  CircleDotDashed,
  LoaderCircle,
} from "lucide-react";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

export type AcademicContentEditorPanel =
  | "metadata"
  | "targets"
  | "details"
  | "links"
  | "tags"
  | "files"
  | "readiness"
  | "publication"
  | "revisions";

export type EditorSectionIndicator =
  "unsaved" | "saving" | "error" | "ready" | "blocked";

export interface EditorSectionDefinition {
  id: AcademicContentEditorPanel;
  labelKey: string;
}

export const EDITOR_SECTIONS: readonly EditorSectionDefinition[] = [
  { id: "metadata", labelKey: "metadata" },
  { id: "targets", labelKey: "targets" },
  { id: "details", labelKey: "details" },
  { id: "links", labelKey: "links" },
  { id: "tags", labelKey: "tags" },
  { id: "files", labelKey: "files" },
  { id: "readiness", labelKey: "readiness" },
  { id: "revisions", labelKey: "revisions" },
] as const;

interface EditorSectionNavProps {
  activeSection: AcademicContentEditorPanel;
  onChange: (section: AcademicContentEditorPanel) => void;
  variant: "desktop" | "mobile";
  sections?: readonly EditorSectionDefinition[];
  indicators?: Partial<
    Record<AcademicContentEditorPanel, EditorSectionIndicator>
  >;
}

const indicatorIcons = {
  unsaved: CircleDotDashed,
  saving: LoaderCircle,
  error: AlertCircle,
  ready: CheckCircle2,
  blocked: Ban,
} satisfies Record<EditorSectionIndicator, typeof AlertCircle>;

export default function EditorSectionNav({
  activeSection,
  onChange,
  variant,
  sections = EDITOR_SECTIONS,
  indicators = {},
}: EditorSectionNavProps) {
  const isDesktop = variant === "desktop";
  const t = useAcademicContentTranslations("editor");

  return (
    <nav
      aria-label={t("sections_label")}
      className={
        isDesktop
          ? "hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm md:block"
          : "flex gap-2 overflow-x-auto pb-1 md:hidden"
      }
    >
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        const indicator = indicators[section.id];
        const IndicatorIcon = indicator ? indicatorIcons[indicator] : null;
        return (
          <div
            key={section.id}
            className={`flex shrink-0 items-center gap-1 ${isDesktop ? "mb-1 last:mb-0" : ""}`}
          >
            <button
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => onChange(section.id)}
              className={`text-sm font-medium transition-colors ${
                isDesktop
                  ? "w-full rounded-lg border-s-4 px-3 py-2 text-start"
                  : "rounded-lg border-b-2 px-3 py-2"
              } ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {t(`sections.${section.labelKey}`)}
            </button>
            {IndicatorIcon && indicator ? (
              <span
                role="status"
                aria-label={t(`indicators.${indicator}`)}
                title={t(`indicators.${indicator}`)}
                className={`shrink-0 ${
                  indicator === "error" || indicator === "blocked"
                    ? "text-red-600"
                    : indicator === "ready"
                      ? "text-emerald-600"
                      : "text-amber-600"
                }`}
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
