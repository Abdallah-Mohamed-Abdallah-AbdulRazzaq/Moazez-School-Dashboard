"use client";

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
  label: string;
}[] = [
  { id: "metadata", label: "Basic information" },
  { id: "targets", label: "Targets" },
  { id: "details", label: "Type details" },
  { id: "links", label: "Links" },
  { id: "tags", label: "Tags" },
  { id: "files", label: "Files" },
  { id: "readiness", label: "Readiness" },
  { id: "revisions", label: "Revisions" },
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

  return (
    <nav
      aria-label="Editor sections"
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
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
