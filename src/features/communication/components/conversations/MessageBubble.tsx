"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import type {
  MessageAttachment,
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";
import AttachmentUploader from "./AttachmentUploader";
import MessageActionsMenu from "./MessageActionsMenu";
import MessageAttachments from "./MessageAttachments";
import MessageReactions from "./MessageReactions";
import ReactionPicker from "./ReactionPicker";

export interface MessageBubbleLabels {
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  deleted: string;
  pending: string;
  failed: string;
  edited: string;
  like: string;
  love: string;
  laugh: string;
  wow: string;
  sad: string;
  angry: string;
  thumbsUp: string;
  thumbsDown: string;
  removeReaction: string;
  attachFile: string;
  fileTooLarge: string;
  uploadFailed: string;
  download: string;
  removeAttachment: string;
}

export interface MessageBubbleProps {
  message: ConversationMessage;
  isOwn: boolean;
  labels: MessageBubbleLabels;
  currentUserId?: string;
  allowReactions?: boolean;
  allowAttachments?: boolean;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  maxAttachmentSizeMb?: number;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  isUploadingAttachment?: boolean;
  onEdit: (messageId: string, body: string) => Promise<void> | void;
  onDelete: (messageId: string) => Promise<void> | void;
  onAddReaction?: (
    messageId: string,
    type: ReactionType,
  ) => Promise<void> | void;
  onRemoveReaction?: (messageId: string) => Promise<void> | void;
  onUploadAttachment?: (messageId: string, file: File) => Promise<void> | void;
  onDeleteAttachment?: (
    messageId: string,
    attachmentId: string,
  ) => Promise<void> | void;
}

function senderName(message: ConversationMessage) {
  return (
    message.sender?.name ||
    message.sender?.nameEn ||
    message.sender?.nameAr ||
    message.senderId ||
    ""
  );
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MessageBubble({
  allowAttachments = true,
  allowMessageDelete = true,
  allowMessageEdit = true,
  allowReactions = true,
  attachments = [],
  currentUserId,
  isOwn,
  isUploadingAttachment,
  labels,
  maxAttachmentSizeMb,
  message,
  onAddReaction,
  onDelete,
  onDeleteAttachment,
  onEdit,
  onRemoveReaction,
  onUploadAttachment,
  reactions = [],
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [body, setBody] = useState(message.body ?? "");
  const isDeleted = message.status === "deleted" || Boolean(message.deletedAt);
  const isEdited =
    Boolean(message.updatedAt && message.createdAt) &&
    message.updatedAt !== message.createdAt;
  const isPending = message.deliveryStatus === "pending";
  const canInteract = !isDeleted && !isPending;
  const hasOwnReaction = reactions.some(
    (reaction) => reaction.userId && reaction.userId === currentUserId,
  );

  const handleSave = async () => {
    await onEdit(message.id, body);
    setIsEditing(false);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(720px,85%)] rounded-2xl px-4 py-3 shadow-sm ${
          isOwn
            ? "rounded-br-sm bg-primary-600 text-white"
            : "rounded-bl-sm border border-slate-200 bg-white text-slate-900"
        }`}
      >
        {!isOwn && senderName(message) ? (
          <p className="mb-1 text-xs font-semibold text-slate-500">
            {senderName(message)}
          </p>
        ) : null}

        {isEditing ? (
          <div className="min-w-72 space-y-3">
            <Input
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsEditing(false)}
              >
                {labels.cancel}
              </Button>
              <Button type="button" size="sm" onClick={() => void handleSave()}>
                {labels.save}
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={`whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere] ${isDeleted ? "italic opacity-70" : ""}`}
          >
            {isDeleted ? labels.deleted : message.body}
          </p>
        )}

        {!isDeleted ? (
          <MessageAttachments
            attachments={attachments}
            canRemove={isOwn && Boolean(onDeleteAttachment)}
            labels={{
              download: labels.download,
              removeAttachment: labels.removeAttachment,
            }}
            onRemove={(attachmentId) =>
              onDeleteAttachment?.(message.id, attachmentId)
            }
          />
        ) : null}

        {!isDeleted ? (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            labels={{
              like: labels.like,
              love: labels.love,
              laugh: labels.laugh,
              wow: labels.wow,
              sad: labels.sad,
              angry: labels.angry,
              thumbsUp: labels.thumbsUp,
              thumbsDown: labels.thumbsDown,
            }}
          />
        ) : null}

        <div
          className={`mt-2 flex items-center gap-2 text-[11px] ${
            isOwn
              ? "justify-end text-primary-100"
              : "justify-start text-slate-500"
          }`}
        >
          <span>{formatDate(message.createdAt)}</span>
          {isEdited ? <span>{labels.edited}</span> : null}
          {message.deliveryStatus === "pending" ? (
            <CommunicationStatusChip label={labels.pending} tone="info" />
          ) : null}
          {message.deliveryStatus === "failed" ? (
            <CommunicationStatusChip label={labels.failed} tone="error" />
          ) : null}
          {isOwn && !isDeleted && message.deliveryStatus !== "pending" ? (
            <span className={isOwn ? "text-primary-100" : ""}>
              <MessageActionsMenu
                allowDelete={allowMessageDelete}
                allowEdit={allowMessageEdit}
                labels={{ edit: labels.edit, delete: labels.delete }}
                onEdit={() => setIsEditing(true)}
                onDelete={() => void onDelete(message.id)}
              />
            </span>
          ) : null}
        </div>

        {canInteract && (allowReactions || allowAttachments) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/20 pt-2">
            {allowReactions && onAddReaction && onRemoveReaction ? (
              <ReactionPicker
                labels={{
                  like: labels.like,
                  love: labels.love,
                  laugh: labels.laugh,
                  wow: labels.wow,
                  sad: labels.sad,
                  angry: labels.angry,
                  thumbsUp: labels.thumbsUp,
                  thumbsDown: labels.thumbsDown,
                  removeReaction: labels.removeReaction,
                }}
                hasOwnReaction={hasOwnReaction}
                onReact={(type) => onAddReaction(message.id, type)}
                onRemoveReaction={() => onRemoveReaction(message.id)}
              />
            ) : null}
            {allowAttachments && onUploadAttachment ? (
              <AttachmentUploader
                labels={{
                  attachFile: labels.attachFile,
                  fileTooLarge: labels.fileTooLarge,
                  uploadFailed: labels.uploadFailed,
                }}
                isUploading={isUploadingAttachment}
                maxAttachmentSizeMb={maxAttachmentSizeMb}
                onUpload={(file) => onUploadAttachment(message.id, file)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
