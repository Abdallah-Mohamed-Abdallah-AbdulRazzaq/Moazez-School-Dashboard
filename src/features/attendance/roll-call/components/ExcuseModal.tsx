"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import { formatFileSize, getUploadRules } from "@/utils/upload/validateFile";
import { uploadFile } from "@/services/filesService";
import { uploadExcuseAttachments } from "@/features/attendance/excuses/utils/uploadExcuseAttachments";
import type { AttachmentMeta } from "../types";

const EMPTY_ATTACHMENTS: AttachmentMeta[] = [];

interface ExcuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: string, attachments: AttachmentMeta[]) => void | Promise<void>;
  initialReason?: string;
  initialAttachments?: AttachmentMeta[];
  attachmentMode: "OPTIONAL" | "REQUIRED" | "UNSUPPORTED";
  isReadOnly: boolean;
}

export default function ExcuseModal({
  isOpen,
  onClose,
  onSave,
  initialReason = "",
  initialAttachments = EMPTY_ATTACHMENTS,
  attachmentMode,
  isReadOnly,
}: ExcuseModalProps) {
  const t = useTranslations("attendance.rollCall.excuse");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [errors, setErrors] = useState<{ reason?: string; attachments?: string; form?: string }>({});
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const rules = getUploadRules("ATTENDANCE_EXCUSE");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (isOpen) {
        setReason(initialReason);
        setAttachments(initialAttachments);
        setErrors({});
      } else {
        setReason("");
        setAttachments([]);
        setErrors({});
        setPreviewAttachment(null);
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [initialAttachments, initialReason, isOpen]);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploaded = await uploadExcuseAttachments(files, uploadFile);
      setAttachments((previous) => [
        ...previous,
        ...uploaded.map((file) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        })),
      ]);
      setErrors((previous) => ({ ...previous, attachments: undefined }));
    } catch (error) {
      console.error("Failed to upload excuse attachment", error);
      setErrors((previous) => ({ ...previous, attachments: tCommon("save_failed") }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const nextErrors: { reason?: string; attachments?: string } = {};
    if (!reason.trim()) nextErrors.reason = t("requiredReason");
    if (attachmentMode === "REQUIRED" && attachments.length === 0) {
      nextErrors.attachments = t("requiredAttachment");
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(reason, attachments);
      onClose();
    } catch (error) {
      console.error("Failed to save excuse", error);
      setErrors((previous) => ({ ...previous, form: tCommon("save_failed") }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md" title={t("title")}>
        <div className="space-y-4">
          {errors.form && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>}
          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="mb-2 block text-sm font-medium">
              {t("reason")} <span className="text-red-500">*</span>
            </label>
            <textarea value={reason} onChange={(event) => { setReason(event.target.value); setErrors((previous) => ({ ...previous, reason: undefined })); }} disabled={isReadOnly} rows={4} className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t("reasonPlaceholder")} />
            {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
          </div>
          {attachmentMode !== "UNSUPPORTED" && <div>
            <label style={{ color: "var(--color-gray-700)" }} className="mb-2 block text-sm font-medium">{t("attachments")}{attachmentMode === "REQUIRED" && <span className="text-red-500"> *</span>}</label>
            {!isReadOnly && <DragDropUploadArea onFilesSelected={handleFilesSelected} disabled={isSaving} isUploading={isUploading} uploadArea="ATTENDANCE_EXCUSE" helperText={`${tUpload(rules.acceptLabelKey)} - ${Math.round(rules.maxSizeBytes / (1024 * 1024))}MB`} multiple />}
            {errors.attachments && <p className="mt-2 text-sm text-red-600">{errors.attachments}</p>}
            {attachments.length > 0 && <div className="mt-3 space-y-2">{attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><button type="button" onClick={() => setPreviewAttachment(attachment)} disabled={isSaving} className="flex min-w-0 flex-1 items-center gap-3 text-start"><FileText className="h-5 w-5 shrink-0" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{attachment.name}</p><p className="text-xs">{formatFileSize(attachment.size)}</p></div></button>{!isReadOnly && <button type="button" onClick={() => setAttachments((previous) => previous.filter((item) => item.id !== attachment.id))} disabled={isSaving}><X className="h-4 w-4" /></button>}</div>)}</div>}
          </div>}
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving || isUploading}>{tCommon("cancel")}</Button>
          {!isReadOnly && <Button variant="primary" onClick={handleSave} disabled={isSaving || isUploading} loading={isSaving}>{t("save")}</Button>}
        </div>
      </Modal>
      <FilePreviewModal attachment={previewAttachment} isOpen={!!previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  );
}
