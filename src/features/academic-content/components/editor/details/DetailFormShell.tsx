"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";

interface DetailFormShellProps {
  title: string;
  description: string;
  children: ReactNode;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  validationError: string | null;
  onSave: () => void;
}

export default function DetailFormShell({
  title,
  description,
  children,
  disabled,
  sectionState,
  validationError,
  onSave,
}: DetailFormShellProps) {
  return (
    <section
      id="details"
      aria-labelledby="details-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div>
        <h2 id="details-heading" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {(validationError || sectionState.error) && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError ?? sectionState.error?.message}
        </div>
      )}
      <div className="mt-5 space-y-5">{children}</div>
      {!disabled && (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            loading={sectionState.saving}
            disabled={!sectionState.dirty}
            onClick={onSave}
          >
            Save type details
          </Button>
        </div>
      )}
    </section>
  );
}

export function normalizeOrderedText(values: string[]): string[] {
  return values
    .map((value) => value.trim().replace(/\s+/gu, " "))
    .filter(Boolean);
}
