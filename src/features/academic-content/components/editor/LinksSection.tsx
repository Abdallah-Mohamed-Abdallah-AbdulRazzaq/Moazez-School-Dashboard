"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type {
  AcademicContentLink,
  AcademicContentLinkInput,
} from "../../types/contracts";

const MAX_LINKS = 100;
let linkKeySequence = 0;

interface EditableLink extends AcademicContentLinkInput {
  key: string;
}

interface LinksSectionProps {
  initial: AcademicContentLink[];
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirty: () => void;
  onSave: (links: AcademicContentLinkInput[]) => Promise<boolean>;
}

function editableLink(link: AcademicContentLink): EditableLink {
  return { key: `server-link:${link.id}`, label: link.label, url: link.url };
}

function emptyLink(): EditableLink {
  linkKeySequence += 1;
  return { key: `new-link:${linkKeySequence}`, label: "", url: "" };
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export default function LinksSection({
  initial,
  disabled,
  sectionState,
  onDirty,
  onSave,
}: LinksSectionProps) {
  const [rows, setRows] = useState<EditableLink[]>(() => initial.map(editableLink));
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateRow = (key: string, update: Partial<AcademicContentLinkInput>) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === key ? { ...row, ...update } : row)),
    );
    setValidationError(null);
    onDirty();
  };

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
    const links = rows.map(({ label, url }) => ({
      label: label.trim(),
      url: url.trim(),
    }));
    const incompleteIndex = links.findIndex((link) => !link.label || !link.url);
    if (incompleteIndex >= 0) {
      setValidationError(`Link ${incompleteIndex + 1}: Label and URL are required.`);
      return;
    }
    const unsafeIndex = links.findIndex((link) => !isSafeHttpUrl(link.url));
    if (unsafeIndex >= 0) {
      setValidationError(`Link ${unsafeIndex + 1}: URL must use HTTP or HTTPS.`);
      return;
    }

    setValidationError(null);
    await onSave(links);
  };

  return (
    <section
      id="links"
      aria-labelledby="links-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="links-heading" className="text-lg font-semibold text-gray-900">
            Links
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add up to 100 ordered web resources using secure HTTP or HTTPS URLs.
          </p>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus aria-hidden="true" className="size-4" />}
            disabled={rows.length >= MAX_LINKS}
            onClick={() => {
              setRows((currentRows) => [...currentRows, emptyLink()]);
              onDirty();
            }}
          >
            Add link
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

      <div className="mt-5 space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
            No links have been added.
          </p>
        ) : null}
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-3 rounded-lg border border-gray-200 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-end"
          >
            <Input
              label="Label"
              aria-label={`Link ${index + 1} label`}
              value={row.label}
              maxLength={180}
              required
              disabled={disabled}
              onChange={(event) => updateRow(row.key, { label: event.target.value })}
            />
            <Input
              label="URL"
              aria-label={`Link ${index + 1} URL`}
              value={row.url}
              maxLength={2048}
              required
              disabled={disabled}
              onChange={(event) => updateRow(row.key, { url: event.target.value })}
            />
            {!disabled && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Move link ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => moveRow(index, -1)}
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Move link ${index + 1} down`}
                  disabled={index === rows.length - 1}
                  onClick={() => moveRow(index, 1)}
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label={`Remove link ${index + 1}`}
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
            Save links
          </Button>
        </div>
      )}
    </section>
  );
}
