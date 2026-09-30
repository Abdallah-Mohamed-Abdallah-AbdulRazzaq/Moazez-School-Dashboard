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
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";

const HARD_MAXIMUM_BYTES = BigInt("10737418240");

const BOOLEAN_FIELDS: readonly {
  key: Exclude<keyof AcademicContentFilePolicy, "maximumFileSizeBytes">;
  messageKey: string;
}[] = [
  {
    key: "attachmentsEnabled",
    messageKey: "attachments",
  },
  {
    key: "documentsEnabled",
    messageKey: "documents",
  },
  { key: "imagesEnabled", messageKey: "images" },
  { key: "videosEnabled", messageKey: "videos" },
  { key: "audioEnabled", messageKey: "audio" },
  { key: "archivesEnabled", messageKey: "archives" },
  {
    key: "otherFilesEnabled",
    messageKey: "other",
  },
  {
    key: "allowStudentDownload",
    messageKey: "student_downloads",
  },
  {
    key: "allowGuardianDownload",
    messageKey: "guardian_downloads",
  },
  {
    key: "allowInlinePreview",
    messageKey: "inline_preview",
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
  const t = useAcademicContentTranslations();

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
      setError(t("settings.positive_error"));
      return;
    }
    if (BigInt(draft.maximumFileSizeBytes) > HARD_MAXIMUM_BYTES) {
      setError(t("settings.hard_max_error"));
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
          title={t("settings.unavailable_title")}
          message={error ?? t("settings.unavailable_message")}
          action={<Button onClick={load}>{t("common.retry")}</Button>}
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
            <h2 className="text-xl font-bold text-gray-900">{t("settings.title")}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("settings.description")}
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
            {t("settings.saved")}
          </div>
        )}
        {!canManage && (
          <p className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {t("settings.read_only")}
          </p>
        )}

        <div className="mt-6">
          <Input
            label={t("settings.maximum")}
            aria-label={t("settings.maximum")}
            value={draft.maximumFileSizeBytes}
            inputMode="numeric"
            maxLength={11}
            disabled={!canManage || isSaving}
            helperText={t("settings.maximum_help")}
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
                aria-label={t(`settings.${field.messageKey}`)}
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
                <span className="block text-sm font-medium text-gray-900">{t(`settings.${field.messageKey}`)}</span>
                <span className="mt-1 block text-xs text-gray-500">{t(`settings.${field.messageKey}_help`)}</span>
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
              {t("settings.save")}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
