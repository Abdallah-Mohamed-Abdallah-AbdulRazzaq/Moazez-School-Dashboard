"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { allowedAudiences } from "../../model/academicContentPolicy";
import type {
  AcademicContentAudience,
  AcademicContentDetail,
  UpdateAcademicContentRequest,
} from "../../types/contracts";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";

const AUDIENCE_LABELS: Record<AcademicContentAudience, string> = {
  INTERNAL_STAFF: "Internal staff",
  STUDENTS: "Students",
  GUARDIANS: "Guardians",
  STUDENTS_AND_GUARDIANS: "Students and guardians",
};

interface BasicInformationSectionProps {
  content: AcademicContentDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (request: UpdateAcademicContentRequest) => Promise<boolean>;
}

export default function BasicInformationSection({
  content,
  disabled,
  sectionState,
  onDirtyChange,
  onSave,
}: BasicInformationSectionProps) {
  const [title, setTitle] = useState(content.title);
  const [description, setDescription] = useState(content.description ?? "");
  const [audience, setAudience] = useState<AcademicContentAudience>(content.audience);
  const [validationError, setValidationError] = useState<string | null>(null);
  const contentVersion = `${content.id}:${content.updatedAt}`;
  const [syncedContentVersion, setSyncedContentVersion] = useState(contentVersion);
  const audienceOptions = useMemo(
    () =>
      allowedAudiences(content.type).map((allowedAudience) => ({
        value: allowedAudience,
        label: AUDIENCE_LABELS[allowedAudience],
      })),
    [content.type],
  );

  if (!sectionState.dirty && syncedContentVersion !== contentVersion) {
    setSyncedContentVersion(contentVersion);
    setTitle(content.title);
    setDescription(content.description ?? "");
    setAudience(content.audience);
    setValidationError(null);
  }

  const markDirty = () => onDirtyChange(true);

  const save = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setValidationError("Title is required");
      return;
    }

    setValidationError(null);
    await onSave({
      title: normalizedTitle,
      description: description.trim() || null,
      audience,
    });
  };

  return (
    <section
      id="metadata"
      aria-labelledby="metadata-heading"
      className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="metadata-heading" className="text-lg font-semibold text-gray-900">
            Basic information
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Edit the reader-facing title, description, and audience.
          </p>
        </div>
        {sectionState.dirty && !disabled ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
            Unsaved changes
          </span>
        ) : null}
      </div>

      {(validationError || sectionState.error) && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError ?? sectionState.error?.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Title"
          aria-label="Title"
          value={title}
          maxLength={180}
          required
          disabled={disabled}
          onChange={(event) => {
            setTitle(event.target.value);
            markDirty();
          }}
        />
        <Select
          label="Audience"
          triggerAriaLabel="Audience"
          value={audience}
          options={audienceOptions}
          disabled={disabled}
          required
          onChange={(value) => {
            setAudience(value as AcademicContentAudience);
            markDirty();
          }}
        />
        <div className="lg:col-span-2">
          <TextArea
            label="Description"
            aria-label="Description"
            value={description}
            maxLength={4000}
            rows={6}
            disabled={disabled}
            helperText={`${description.length}/4000`}
            onChange={(event) => {
              setDescription(event.target.value);
              markDirty();
            }}
          />
        </div>
      </div>

      {!disabled && (
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            loading={sectionState.saving}
            disabled={!sectionState.dirty}
            onClick={() => void save()}
          >
            Save basic information
          </Button>
        </div>
      )}
    </section>
  );
}
