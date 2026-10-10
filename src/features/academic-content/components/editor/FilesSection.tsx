"use client";

import { useEffect, useRef, useState } from "react";
import {
  File as FileIcon,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import AttachmentListItem from "@/components/ui/attachment-list-item/AttachmentListItem";
import { Button } from "@/components/ui/button/Button";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import { formatByteCount } from "../../model/academicContentPolicy";
import {
  completeAcademicContentUpload,
  unlinkAcademicContentAsset,
} from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import {
  ACADEMIC_CONTENT_FILE_ACCEPT,
  AcademicContentUploadRestartRequiredError,
  uploadAcademicContentFile,
  validateAcademicContentFileAgainstPolicy,
} from "../../services/academicContentUpload";
import type { AcademicContentAsset } from "../../types/contracts";
import {
  useAcademicContentFilePolicy,
  type AcademicContentFilePolicyState,
} from "../../hooks/useAcademicContentFilePolicy";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

type UploadState =
  "uploading" | "verifying" | "completed" | "cancelled" | "error" | "restart-required";

interface UploadQueueItem {
  key: string;
  file: File;
  state: UploadState;
  percent: number;
  message: string;
  completionUploadId?: string;
}

interface FilesSectionProps {
  contentId: string;
  assets: AcademicContentAsset[];
  disabled: boolean;
  onFilesChanged: () => Promise<unknown>;
  variant?: "full" | "embedded";
  title?: string;
  description?: string;
  policyState?: AcademicContentFilePolicyState;
  showRecipientAccessPolicy?: boolean;
}

let queueKeySequence = 0;

function nextQueueKey(): string {
  queueKeySequence += 1;
  return `academic-content-upload:${queueKeySequence}`;
}

export default function FilesSection({
  contentId,
  assets,
  disabled,
  onFilesChanged,
  variant = "full",
  title,
  description,
  policyState,
  showRecipientAccessPolicy = false,
}: FilesSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [unlinkingAssetId, setUnlinkingAssetId] = useState<string | null>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const t = useAcademicContentTranslations("files");
  const locale = useLocale();
  const internalPolicyState = useAcademicContentFilePolicy(
    policyState === undefined,
  );
  const effectivePolicyState = policyState ?? internalPolicyState;
  const { policy, isLoading: isPolicyLoading } = effectivePolicyState;
  const displayedError = error ?? effectivePolicyState.error?.message ?? null;
  const hasActiveUpload = queue.some(
    (upload) => upload.state === "uploading" || upload.state === "verifying",
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  useEffect(() => {
    if (!hasActiveUpload) return;
    const warnBeforeClosing = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeClosing);
    return () => window.removeEventListener("beforeunload", warnBeforeClosing);
  }, [hasActiveUpload]);

  useEffect(() => {
    const activeControllers = controllers.current;
    return () => {
      activeControllers.forEach((controller) => controller.abort());
      activeControllers.clear();
    };
  }, []);

  const updateQueueItem = (key: string, update: Partial<UploadQueueItem>) => {
    setQueue((currentQueue) =>
      currentQueue.map((item) =>
        item.key === key ? { ...item, ...update } : item,
      ),
    );
  };

  const startUpload = async (item: UploadQueueItem) => {
    let completionUploadId = item.completionUploadId;
    const controller = new AbortController();
    controllers.current.set(item.key, controller);
    updateQueueItem(item.key, {
      state: completionUploadId ? "verifying" : "uploading",
      percent: completionUploadId ? 100 : 0,
      message: t(completionUploadId ? "verifying" : "uploading"),
    });

    try {
      if (completionUploadId) {
        await completeAcademicContentUpload(contentId, completionUploadId);
      } else {
        await uploadAcademicContentFile({
          contentId,
          file: item.file,
          signal: controller.signal,
          onVerifying: (uploadId) => {
            completionUploadId = uploadId;
            updateQueueItem(item.key, {
              completionUploadId: uploadId,
              state: "verifying",
              message: t("verifying"),
            });
          },
          onProgress: (progress) =>
            updateQueueItem(item.key, {
              percent: progress.percent,
              message: t("progress", { percent: progress.percent }),
            }),
        });
      }
      updateQueueItem(item.key, {
        state: "completed",
        percent: 100,
        message: t("complete_refreshing"),
      });
      await onFilesChanged();
      setQueue((currentQueue) =>
        currentQueue.filter((candidate) => candidate.key !== item.key),
      );
      setStatus(t("uploaded", { name: item.file.name }));
    } catch (uploadError) {
      if (
        uploadError instanceof DOMException &&
        uploadError.name === "AbortError"
      ) {
        updateQueueItem(item.key, {
          state: "cancelled",
          message: t("cancelled"),
        });
      } else if (
        uploadError instanceof AcademicContentUploadRestartRequiredError
      ) {
        updateQueueItem(item.key, {
          state: "restart-required",
          message: academicContentUiError(uploadError).message,
        });
      } else {
        const uploadUiError = academicContentUiError(uploadError);
        const requiresNewUpload = [
          "academic_content.file.upload_expired",
          "academic_content.file.upload_not_completable",
          "academic_content.file.actual_size_invalid",
          "academic_content.file.actual_size_mismatch",
          "academic_content.file.platform_size_exceeded",
          "academic_content.file.provider_content_type_mismatch",
          "academic_content.file.mime_signature_mismatch",
          "academic_content.file.unsupported_file_type",
          "academic_content.file.object_missing",
        ].includes(uploadUiError.code);
        updateQueueItem(item.key, {
          state: requiresNewUpload ? "restart-required" : "error",
          completionUploadId: requiresNewUpload ? undefined : completionUploadId,
          message: uploadUiError.message,
        });
      }
    } finally {
      controllers.current.delete(item.key);
    }
  };

  const selectFiles = (files: File[]) => {
    if (!policy) return;
    setError(null);
    setStatus(null);
    for (const file of files) {
      try {
        validateAcademicContentFileAgainstPolicy(file, policy);
        const item: UploadQueueItem = {
          key: nextQueueKey(),
          file,
          state: "uploading",
          percent: 0,
          message: t("preparing"),
        };
        setQueue((currentQueue) => [...currentQueue, item]);
        void startUpload(item);
      } catch (validationError) {
        setError(academicContentUiError(validationError).message);
      }
    }
  };

  const unlink = async (asset: AcademicContentAsset) => {
    setUnlinkingAssetId(asset.assetId);
    setError(null);
    setStatus(null);
    try {
      await unlinkAcademicContentAsset(contentId, asset.assetId);
      await onFilesChanged();
      setStatus(t("removed", { name: asset.originalName }));
    } catch (unlinkError) {
      setError(academicContentUiError(unlinkError).message);
    } finally {
      setUnlinkingAssetId(null);
    }
  };

  return (
    <section
      id="files"
      aria-labelledby="files-heading"
      className={
        variant === "embedded"
          ? "pt-5"
          : "rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      }
    >
      <div>
        <h2
          id="files-heading"
          className={
            variant === "embedded"
              ? "text-base font-semibold text-gray-900"
              : "text-lg font-semibold text-gray-900"
          }
        >
          {title ?? t("title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {description ?? t("description")}
        </p>
      </div>

      {displayedError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{displayedError}</span>
          {!error && effectivePolicyState.error ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void effectivePolicyState.reload()}
            >
              {t("retry_policy")}
            </Button>
          ) : null}
        </div>
      )}
      {status && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {status}
        </div>
      )}

      {!disabled && (
        <div className="mt-5">
          <DragDropUploadArea
            title={t("add")}
            subtitle={t("add_description")}
            buttonLabel={t("choose")}
            helperText={
              policy
                ? t("maximum", {
                    size: formatByteCount(policy.maximumFileSizeBytes),
                  })
                : t("loading_policy")
            }
            accept={ACADEMIC_CONTENT_FILE_ACCEPT}
            maxSizeBytes={
              policy ? Number(policy.maximumFileSizeBytes) : undefined
            }
            disabled={isPolicyLoading || !policy || !policy.attachmentsEnabled}
            isUploading={false}
            multiple
            onFilesSelected={selectFiles}
          />
        </div>
      )}

      {queue.length > 0 && (
        <div className="mt-5 space-y-3" aria-live="polite">
          {queue.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {item.file.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{item.message}</p>
                </div>
                {item.state === "uploading" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<X aria-hidden="true" className="size-4" />}
                    onClick={() => controllers.current.get(item.key)?.abort()}
                  >
                    {t("cancel_upload")}
                  </Button>
                ) : item.state !== "completed" && item.state !== "verifying" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={
                      <RefreshCw aria-hidden="true" className="size-4" />
                    }
                    onClick={() => void startUpload(item)}
                  >
                    {t(item.completionUploadId ? "retry_verification" : "retry_upload")}
                  </Button>
                ) : null}
              </div>
              <div
                role="progressbar"
                aria-label={t("progress_aria", { name: item.file.name })}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.percent}
                aria-valuetext={item.message}
                className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
              >
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900">{t("attached")}</h3>
        {assets.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-3">
            {assets.map((asset) => (
              <AttachmentListItem
                key={asset.assetId}
                icon={
                  <FileIcon
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                }
                title={asset.originalName}
                subtitle={`${asset.mimeType} · ${formatByteCount(asset.sizeBytes)} · ${dateFormatter.format(new Date(asset.createdAt))}`}
                disabled={unlinkingAssetId === asset.assetId}
                actionsLabel={t("actions", { name: asset.originalName })}
                actions={
                  disabled
                    ? []
                    : [
                        {
                          label: t("unlink"),
                          icon: (
                            <Trash2 aria-hidden="true" className="size-4" />
                          ),
                          color: "error",
                          onClick: () => void unlink(asset),
                        },
                      ]
                }
              />
            ))}
          </div>
        )}
      </div>

      {showRecipientAccessPolicy && policy ? (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("recipient_policy")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>
              {t(
                policy.allowStudentDownload
                  ? "student_download_enabled"
                  : "student_download_disabled",
              )}
            </li>
            <li>
              {t(
                policy.allowGuardianDownload
                  ? "guardian_download_enabled"
                  : "guardian_download_disabled",
              )}
            </li>
            <li>
              {t(
                policy.allowInlinePreview
                  ? "inline_preview_enabled"
                  : "inline_preview_disabled",
              )}
            </li>
          </ul>
        </div>
      ) : null}

      <p className="mt-4 flex items-start gap-2 text-xs text-gray-500">
        <UploadCloud aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {t("unlink_notice")}
      </p>
    </section>
  );
}
