"use client";

import { useEffect, useRef, useState } from "react";
import { File as FileIcon, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import AttachmentListItem from "@/components/ui/attachment-list-item/AttachmentListItem";
import { Button } from "@/components/ui/button/Button";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import { formatByteCount } from "../../model/academicContentPolicy";
import {
  getAcademicContentFilePolicy,
  unlinkAcademicContentAsset,
} from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import {
  ACADEMIC_CONTENT_FILE_ACCEPT,
  AcademicContentUploadRestartRequiredError,
  uploadAcademicContentFile,
  validateAcademicContentFileAgainstPolicy,
} from "../../services/academicContentUpload";
import type {
  AcademicContentAsset,
  AcademicContentFilePolicy,
} from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

type UploadState =
  | "uploading"
  | "completed"
  | "cancelled"
  | "error"
  | "restart-required";

interface UploadQueueItem {
  key: string;
  file: File;
  state: UploadState;
  percent: number;
  message: string;
}

interface FilesSectionProps {
  contentId: string;
  assets: AcademicContentAsset[];
  disabled: boolean;
  onFilesChanged: () => Promise<unknown>;
  variant?: "full" | "embedded";
  title?: string;
  description?: string;
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
}: FilesSectionProps) {
  const [policy, setPolicy] = useState<AcademicContentFilePolicy | null>(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [unlinkingAssetId, setUnlinkingAssetId] = useState<string | null>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const t = useAcademicContentTranslations("files");

  useEffect(() => {
    let active = true;
    const activeControllers = controllers.current;
    void getAcademicContentFilePolicy()
      .then((loadedPolicy) => {
        if (active) setPolicy(loadedPolicy);
      })
      .catch((loadError: unknown) => {
        if (active) setError(academicContentUiError(loadError).message);
      })
      .finally(() => {
        if (active) setIsPolicyLoading(false);
      });
    return () => {
      active = false;
      activeControllers.forEach((controller) => controller.abort());
      activeControllers.clear();
    };
  }, []);

  const updateQueueItem = (key: string, update: Partial<UploadQueueItem>) => {
    setQueue((currentQueue) =>
      currentQueue.map((item) => (item.key === key ? { ...item, ...update } : item)),
    );
  };

  const startUpload = async (item: UploadQueueItem) => {
    const controller = new AbortController();
    controllers.current.set(item.key, controller);
    updateQueueItem(item.key, {
      state: "uploading",
      percent: 0,
      message: t("uploading"),
    });

    try {
      await uploadAcademicContentFile({
        contentId,
        file: item.file,
        signal: controller.signal,
        onProgress: (progress) =>
          updateQueueItem(item.key, {
            percent: progress.percent,
            message: t("progress", { percent: progress.percent }),
          }),
      });
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
      if (uploadError instanceof DOMException && uploadError.name === "AbortError") {
        updateQueueItem(item.key, {
          state: "cancelled",
          message: t("cancelled"),
        });
      } else if (uploadError instanceof AcademicContentUploadRestartRequiredError) {
        updateQueueItem(item.key, {
          state: "restart-required",
          message: uploadError.message,
        });
      } else {
        updateQueueItem(item.key, {
          state: "error",
          message: academicContentUiError(uploadError).message,
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

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
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
                ? t("maximum", { size: formatByteCount(policy.maximumFileSizeBytes) })
                : t("loading_policy")
            }
            accept={ACADEMIC_CONTENT_FILE_ACCEPT}
            maxSizeBytes={policy ? Number(policy.maximumFileSizeBytes) : undefined}
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
            <div key={item.key} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{item.file.name}</p>
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
                ) : item.state !== "completed" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<RefreshCw aria-hidden="true" className="size-4" />}
                    onClick={() => void startUpload(item)}
                  >
                    {t("retry_upload")}
                  </Button>
                ) : null}
              </div>
              <div
                role="progressbar"
                aria-label={t("progress_aria", { name: item.file.name })}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.percent}
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
                icon={<FileIcon aria-hidden="true" className="size-5 text-primary" />}
                title={asset.originalName}
                subtitle={`${asset.mimeType} · ${formatByteCount(asset.sizeBytes)}`}
                disabled={unlinkingAssetId === asset.assetId}
                actionsLabel={t("actions", { name: asset.originalName })}
                actions={
                  disabled
                    ? []
                    : [
                        {
                          label: t("unlink"),
                          icon: <Trash2 aria-hidden="true" className="size-4" />,
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

      <p className="mt-4 flex items-start gap-2 text-xs text-gray-500">
        <UploadCloud aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {t("unlink_notice")}
      </p>
    </section>
  );
}
