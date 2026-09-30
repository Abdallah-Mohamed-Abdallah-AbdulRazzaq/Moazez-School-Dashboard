"use client";

import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

export type AcademicContentEditorPanel =
  | "metadata"
  | "targets"
  | "details"
  | "links"
  | "tags"
  | "files"
  | "readiness"
  | "revisions";

export const EDITOR_SECTIONS: readonly {
  id: AcademicContentEditorPanel;
  labelKey: string;
}[] = [
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
}

export default function EditorSectionNav({
  activeSection,
  onChange,
  variant,
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
      {EDITOR_SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            onClick={() => onChange(section.id)}
            className={`shrink-0 text-sm font-medium transition-colors ${
              isDesktop
                ? "mb-1 w-full rounded-lg border-s-4 px-3 py-2 text-start last:mb-0"
                : "rounded-lg border-b-2 px-3 py-2"
            } ${
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {t(`sections.${section.labelKey}`)}
          </button>
        );
      })}
    </nav>
  );
}
