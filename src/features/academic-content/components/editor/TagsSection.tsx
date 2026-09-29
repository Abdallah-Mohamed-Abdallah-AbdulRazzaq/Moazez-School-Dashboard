"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type {
  AcademicContentTag,
  AcademicContentTagInput,
} from "../../types/contracts";

const MAX_TAGS = 100;
let tagKeySequence = 0;

interface EditableTag extends AcademicContentTagInput {
  key: string;
}

interface TagsSectionProps {
  initial: AcademicContentTag[];
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirty: () => void;
  onSave: (tags: AcademicContentTagInput[]) => Promise<boolean>;
}

function editableTag(tag: AcademicContentTag): EditableTag {
  return { key: `server-tag:${tag.id}`, value: tag.value };
}

function emptyTag(): EditableTag {
  tagKeySequence += 1;
  return { key: `new-tag:${tagKeySequence}`, value: "" };
}

export default function TagsSection({
  initial,
  disabled,
  sectionState,
  onDirty,
  onSave,
}: TagsSectionProps) {
  const [rows, setRows] = useState<EditableTag[]>(() => initial.map(editableTag));
  const [validationError, setValidationError] = useState<string | null>(null);

  const moveRow = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (destination < 0 || destination >= rows.length) return;
    setRows((currentRows) => {
      const nextRows = [...currentRows];
      [nextRows[index], nextRows[destination]] = [
        nextRows[destination],
        nextRows[index],
      ];
      return nextRows;
    });
    onDirty();
  };

  const save = async () => {
    const tags = rows.map(({ value }) => ({ value: value.trim() }));
    const emptyIndex = tags.findIndex((tag) => !tag.value);
    if (emptyIndex >= 0) {
      setValidationError(`Tag ${emptyIndex + 1}: Value is required.`);
      return;
    }

    setValidationError(null);
    await onSave(tags);
  };

  return (
    <section
      id="tags"
      aria-labelledby="tags-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="tags-heading" className="text-lg font-semibold text-gray-900">
            Tags
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add up to 100 ordered tags. The server applies canonical normalization.
          </p>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus aria-hidden="true" className="size-4" />}
            disabled={rows.length >= MAX_TAGS}
            onClick={() => {
              setRows((currentRows) => [...currentRows, emptyTag()]);
              onDirty();
            }}
          >
            Add tag
          </Button>
        )}
      </div>

      {(validationError || sectionState.error) && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError ?? sectionState.error?.message}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
            No tags have been added.
          </p>
        ) : null}
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <Input
                label={`Tag ${index + 1}`}
                aria-label={`Tag ${index + 1}`}
                value={row.value}
                maxLength={80}
                required
                disabled={disabled}
                onChange={(event) => {
                  setRows((currentRows) =>
                    currentRows.map((candidate) =>
                      candidate.key === row.key
                        ? { ...candidate, value: event.target.value }
                        : candidate,
                    ),
                  );
                  setValidationError(null);
                  onDirty();
                }}
              />
            </div>
            {!disabled && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Move tag ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => moveRow(index, -1)}
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Move tag ${index + 1} down`}
                  disabled={index === rows.length - 1}
                  onClick={() => moveRow(index, 1)}
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Remove tag ${index + 1}`}
                  onClick={() => {
                    setRows((currentRows) =>
                      currentRows.filter((candidate) => candidate.key !== row.key),
                    );
                    onDirty();
                  }}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            loading={sectionState.saving}
            disabled={!sectionState.dirty}
            onClick={() => void save()}
          >
            Save tags
          </Button>
        </div>
      )}
    </section>
  );
}
