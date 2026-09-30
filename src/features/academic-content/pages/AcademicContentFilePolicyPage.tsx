"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Input from "@/components/ui/input/Input";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getAcademicContentFilePolicy,
  updateAcademicContentFilePolicy,
} from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import type {
  AcademicContentFilePolicy,
  UpdateAcademicContentFilePolicyRequest,
} from "../types/contracts";

const HARD_MAXIMUM_BYTES = BigInt("10737418240");

const BOOLEAN_FIELDS: readonly {
  key: Exclude<keyof AcademicContentFilePolicy, "maximumFileSizeBytes">;
  label: string;
  description: string;
}[] = [
  {
    key: "attachmentsEnabled",
    label: "Attachments",
    description: "Allow academic content to include uploaded files.",
  },
  {
    key: "documentsEnabled",
    label: "Documents",
    description: "Allow PDF, text, CSV, Word, Excel, and PowerPoint files.",
  },
  { key: "imagesEnabled", label: "Images", description: "Allow supported image files." },
  { key: "videosEnabled", label: "Videos", description: "Allow supported video files." },
  { key: "audioEnabled", label: "Audio", description: "Allow supported audio files." },
  { key: "archivesEnabled", label: "Archives", description: "Allow ZIP and 7Z files." },
  {
    key: "otherFilesEnabled",
    label: "Other files",
    description: "Apply the server policy for other registered file formats.",
  },
  {
    key: "allowStudentDownload",
    label: "Student downloads",
    description: "Allow students to download available attachments.",
  },
  {
    key: "allowGuardianDownload",
    label: "Guardian downloads",
    description: "Allow guardians to download available attachments.",
  },
  {
    key: "allowInlinePreview",
    label: "Inline preview",
    description: "Allow inline preview when the registered format supports it.",
  },
];

function changedPolicy(
  original: AcademicContentFilePolicy,
  draft: AcademicContentFilePolicy,
): UpdateAcademicContentFilePolicyRequest {
  const changed: UpdateAcademicContentFilePolicyRequest = {};
  for (const key of Object.keys(original) as (keyof AcademicContentFilePolicy)[]) {
    if (original[key] !== draft[key]) {
      Object.assign(changed, { [key]: draft[key] });
    }
  }
  return changed;
}

export default function AcademicContentFilePolicyPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("academics.academic_content.settings.manage");
  const [policy, setPolicy] = useState<AcademicContentFilePolicy | null>(null);
  const [draft, setDraft] = useState<AcademicContentFilePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const loadRequestId = useRef(0);

  const load = useCallback(() => {
    const requestId = loadRequestId.current + 1;
    loadRequestId.current = requestId;
    setIsLoading(true);
    setError(null);
    void getAcademicContentFilePolicy()
      .then((loadedPolicy) => {
        if (loadRequestId.current !== requestId) return;
        setPolicy(loadedPolicy);
        setDraft(loadedPolicy);
      })
      .catch((loadError: unknown) => {
        if (loadRequestId.current === requestId) {
          setError(academicContentUiError(loadError).message);
        }
      })
      .finally(() => {
        if (loadRequestId.current === requestId) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      loadRequestId.current += 1;
    };
  }, [load]);

  const changes = useMemo(
    () => (policy && draft ? changedPolicy(policy, draft) : {}),
    [draft, policy],
  );
  const isDirty = Object.keys(changes).length > 0;

  const save = async () => {
    if (!draft || !isDirty) return;
    if (!/^[1-9][0-9]*$/u.test(draft.maximumFileSizeBytes)) {
      setError("Maximum file size must be a positive decimal byte count.");
      return;
    }
    if (BigInt(draft.maximumFileSizeBytes) > HARD_MAXIMUM_BYTES) {
      setError("Maximum file size cannot exceed the 10 GiB platform limit.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updatedPolicy = await updateAcademicContentFilePolicy(changes);
      setPolicy(updatedPolicy);
      setDraft(updatedPolicy);
      setSaved(true);
    } catch (saveError) {
      setError(academicContentUiError(saveError).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
        <PartialLoader />
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <EmptyState
          title="File policy unavailable"
          message={error ?? "The file policy could not be loaded."}
          action={<Button onClick={load}>Retry</Button>}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Academic content file policy</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review upload categories, size limits, downloads, and preview behavior.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {saved && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            File policy saved.
          </div>
        )}
        {!canManage && (
          <p className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            You can view this policy, but only file-policy managers can change it.
          </p>
        )}

        <div className="mt-6">
          <Input
            label="Maximum file size in bytes"
            aria-label="Maximum file size in bytes"
            value={draft.maximumFileSizeBytes}
            inputMode="numeric"
            maxLength={11}
            disabled={!canManage || isSaving}
            helperText="Positive decimal bytes; platform maximum is 10 GiB (10737418240 bytes)."
            onChange={(event) => {
              setDraft((current) =>
                current
                  ? { ...current, maximumFileSizeBytes: event.target.value }
                  : current,
              );
              setSaved(false);
            }}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {BOOLEAN_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex gap-3 rounded-lg border border-gray-200 p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
            >
              <input
                type="checkbox"
                aria-label={field.label}
                checked={draft[field.key]}
                disabled={!canManage || isSaving}
                onChange={(event) => {
                  setDraft((current) =>
                    current
                      ? { ...current, [field.key]: event.target.checked }
                      : current,
                  );
                  setSaved(false);
                }}
                className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{field.label}</span>
                <span className="mt-1 block text-xs text-gray-500">{field.description}</span>
              </span>
            </label>
          ))}
        </div>

        {canManage && (
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              loading={isSaving}
              disabled={!isDirty}
              leftIcon={<Save aria-hidden="true" className="size-4" />}
              onClick={() => void save()}
            >
              Save file policy
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
