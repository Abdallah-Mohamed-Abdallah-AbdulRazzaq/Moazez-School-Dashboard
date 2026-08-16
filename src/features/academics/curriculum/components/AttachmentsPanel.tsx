"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import AttachmentListItem from "@/components/ui/attachment-list-item/AttachmentListItem";
import { AssignmentAttachment } from "@/features/academics/curriculum/services/curriculumService";
import { validateHttpUrl, normalizeUrl } from "@/utils/validation/url";
import { ATTACHMENT_RESTRICTIONS } from "@/features/academics/curriculum/libs/constants";
import AssignmentAttachmentPreviewModal from "./AssignmentAttachmentPreviewModal";

interface AttachmentsPanelProps {
  attachments: AssignmentAttachment[];
  isReadOnly: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onAddLink?: (title: string, url: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => void;
  showLinkUpload?: boolean;
}

export default function AttachmentsPanel({
  attachments,
  isReadOnly,
  onUploadFile,
  onAddLink,
  onDeleteAttachment,
  showLinkUpload = true,
}: AttachmentsPanelProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tUpload = useTranslations("upload");
  const tCommon = useTranslations("common");

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<AssignmentAttachment | null>(null);

  const handleAddLink = async () => {
    if (!onAddLink) return;
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError(tUpload("titleAndUrlRequired"));
      return;
    }

    if (!validateHttpUrl(linkUrl)) {
      setLinkError(tUpload("invalidUrl"));
      return;
    }

    try {
      await onAddLink(linkTitle, normalizeUrl(linkUrl));
      setShowLinkDialog(false);
      setLinkTitle("");
      setLinkUrl("");
      setLinkError("");
    } catch {
      setLinkError(tUpload("linkAddFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          {t("attachments")}
        </h3>

        {!isReadOnly && (
          <div className="mb-4">
            <DragDropUploadArea
              title={tUpload("dragHereTitle")}
              subtitle={tUpload("dragHereSubtitle")}
              onFilesSelected={(files) => {
                if (files.length > 0) {
                  onUploadFile(files[0]).catch(() => {
                    // Error handled in parent
                  });
                }
              }}
              accept={ATTACHMENT_RESTRICTIONS.ALLOWED_TYPES}
              maxSizeBytes={ATTACHMENT_RESTRICTIONS.MAX_FILE_SIZE}
            />
            <p className="mt-2 text-xs text-gray-500">
              {tUpload("allowedHint", {
                types: ATTACHMENT_RESTRICTIONS.ALLOWED_TYPES_LABEL,
                size: "10MB",
              })}
            </p>

            {showLinkUpload && onAddLink && (
              <Button
                onClick={() => setShowLinkDialog(true)}
                variant="secondary"
                size="sm"
                className="w-full mt-2"
              >
                {tUpload("addLink")}
              </Button>
            )}
          </div>
        )}

        {attachments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            {tUpload("noAttachments")}
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <AttachmentListItem
                key={attachment.id}
                icon={<Paperclip className="w-5 h-5" />}
                title={
                  attachment.type === "FILE"
                    ? attachment.fileName || tUpload("file")
                    : attachment.title || tUpload("link")
                }
                subtitle={attachment.type === "LINK" ? attachment.url : undefined}
                onClick={() => {
                  if (attachment.type === "LINK") {
                    window.open(attachment.url, "_blank", "noopener,noreferrer");
                    return;
                  }
                  setPreviewAttachment(attachment);
                }}
                actions={
                  !isReadOnly
                    ? [
                        {
                          label: tCommon("delete"),
                          onClick: () => onDeleteAttachment(attachment.id),
                          color: "error" as const,
                        },
                      ]
                    : []
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Link Dialog */}
      {showLinkUpload && onAddLink && showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{tUpload("addLink")}</h3>

            <div className="space-y-4">
              <Input
                label={tUpload("linkTitle")}
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder={tUpload("linkTitlePlaceholder")}
              />

              <Input
                label={tUpload("linkUrl")}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                error={linkError}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkTitle("");
                  setLinkUrl("");
                  setLinkError("");
                }}
                variant="secondary"
              >
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleAddLink} variant="primary">
                {tCommon("add")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AssignmentAttachmentPreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
