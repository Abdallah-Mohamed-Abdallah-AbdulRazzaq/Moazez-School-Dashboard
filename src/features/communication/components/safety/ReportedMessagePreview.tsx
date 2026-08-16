"use client";

import { MessageSquareWarning } from "lucide-react";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { Message } from "@/features/communication/types/message.types";

export interface ReportedMessagePreviewLabels {
  title: string;
  noMessage: string;
  deleted: string;
  hidden: string;
  auditReason: string;
  auditTimestamp: string;
  attachments: string;
  sender: string;
  conversation: string;
  createdAt: string;
  unknown: string;
}

export interface ReportedMessagePreviewProps {
  message?: Message | null;
  labels: ReportedMessagePreviewLabels;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function senderName(message: Message, fallback: string) {
  return (
    message.sender?.name ||
    message.sender?.nameEn ||
    message.sender?.nameAr ||
    message.senderId ||
    message.senderUserId ||
    fallback
  );
}

export default function ReportedMessagePreview({
  labels,
  message,
}: ReportedMessagePreviewProps) {
  const isDeleted = message?.status === "deleted" || Boolean(message?.deletedAt);
  const isHidden = !isDeleted && (message?.status === "hidden" || Boolean(message?.hiddenAt));
  const isUnavailable = isDeleted || isHidden;
  const moderationLabel = isDeleted ? labels.deleted : labels.hidden;
  const moderationTimestamp = isDeleted ? message?.deletedAt : message?.hiddenAt;
  const attachmentCount =
    message?.attachmentsCount ?? message?.attachments?.length ?? 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquareWarning className="h-5 w-5 text-red-600" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      </div>
      {!message ? (
        <p className="text-sm text-slate-500">{labels.noMessage}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4">
            {isUnavailable ? (
              <div className="mb-2">
                <CommunicationStatusChip label={moderationLabel} tone="error" />
              </div>
            ) : null}
            <p
              className={`whitespace-pre-wrap text-sm leading-6 text-slate-800 ${
                isUnavailable ? "italic opacity-70" : ""
              }`}
            >
              {isUnavailable
                ? moderationLabel
                : message.body || message.content || labels.noMessage}
            </p>
            {isUnavailable ? (
              <dl className="mt-3 grid gap-3 border-t border-slate-200 pt-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">{labels.auditReason}</dt>
                  <dd className="mt-1 text-slate-800">
                    {message.hiddenReason || labels.unknown}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{labels.auditTimestamp}</dt>
                  <dd className="mt-1 text-slate-800">
                    {formatDate(moderationTimestamp ?? undefined)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">{labels.sender}</dt>
              <dd className="font-medium text-slate-800">
                {senderName(message, labels.unknown)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{labels.conversation}</dt>
              <dd className="font-medium text-slate-800">
                {message.conversationId ?? labels.unknown}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{labels.createdAt}</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(message.createdAt)}
              </dd>
            </div>
            {attachmentCount > 0 ? (
              <div>
                <dt className="text-xs text-slate-500">{labels.attachments}</dt>
                <dd className="font-medium text-slate-800">{attachmentCount}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
    </section>
  );
}
