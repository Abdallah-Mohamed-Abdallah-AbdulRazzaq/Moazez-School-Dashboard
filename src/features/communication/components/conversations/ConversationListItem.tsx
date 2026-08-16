"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Archive,
  Edit,
  Lock,
  MoreVertical,
  Pin,
  RotateCcw,
} from "lucide-react";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { ConversationListItemModel } from "@/features/communication/hooks/useConversations";

export interface ConversationListItemLabels {
  untitled: string;
  deletedMessage: string;
  noLastMessage: string;
  unread: string;
  edit: string;
  close: string;
  reopen: string;
  archive: string;
  pinned: string;
}

export interface ConversationListItemProps {
  conversation: ConversationListItemModel;
  labels: ConversationListItemLabels;
  onEdit: (conversation: ConversationListItemModel) => void;
  onClose: (conversationId: string) => void;
  onReopen: (conversationId: string) => void;
  onArchive: (conversationId: string) => void;
  disabled?: boolean;
}

function localizedValue(
  locale: string,
  conversation: ConversationListItemModel,
): string {
  const preferred =
    locale === "ar" ? conversation.titleAr : conversation.titleEn;
  const fallback =
    locale === "ar" ? conversation.titleEn : conversation.titleAr;
  return preferred || fallback || conversation.title || "";
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ConversationListItem({
  conversation,
  disabled = false,
  labels,
  onArchive,
  onClose,
  onEdit,
  onReopen,
}: ConversationListItemProps) {
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const title = localizedValue(locale, conversation) || labels.untitled;
  const href = `/${locale}/communication/conversations/${conversation.id}`;
  const lastMessage =
    conversation.lastMessage?.status === "deleted"
      ? labels.deletedMessage
      : conversation.lastMessage?.body || labels.noLastMessage;
  const updatedAt = formatDate(
    conversation.lastMessage?.createdAt ??
      conversation.lastMessageAt ??
      conversation.updatedAt ??
      conversation.createdAt,
    locale,
  );
  const canClose =
    conversation.status !== "closed" && conversation.status !== "archived";
  const canReopen = conversation.status === "closed";
  const canArchive = conversation.status !== "archived";

  const handleAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-200">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-slate-950">
              {title}
            </h2>
            {conversation.isPinned ? (
              <CommunicationStatusChip
                label={labels.pinned}
                tone="info"
                className="shrink-0"
              />
            ) : null}
            {conversation.status ? (
              <CommunicationStatusChip
                label={conversation.status}
                tone={
                  conversation.status === "active"
                    ? "success"
                    : conversation.status === "closed"
                      ? "warning"
                      : "default"
                }
                className="shrink-0"
              />
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {conversation.type ? <span>{conversation.type}</span> : null}
            {conversation.type && updatedAt ? <span>•</span> : null}
            {updatedAt ? <span>{updatedAt}</span> : null}
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {conversation.lastMessage?.senderName
              ? `${conversation.lastMessage.senderName}: ${lastMessage}`
              : lastMessage}
          </p>
        </Link>

        <div className="flex shrink-0 items-start gap-1">
          {conversation.isPinned ? (
            <Pin className="mt-2 h-4 w-4 text-primary-600" aria-hidden="true" />
          ) : null}
          {typeof conversation.unreadCount === "number" &&
          conversation.unreadCount > 0 ? (
            <span className="mt-1 inline-flex min-w-6 items-center justify-center rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white">
              {conversation.unreadCount}
            </span>
          ) : null}
          <div className="relative">
            <button
              type="button"
              aria-label="Conversation actions"
              disabled={disabled}
              onClick={() => setIsMenuOpen((current) => !current)}
              onBlur={() => window.setTimeout(() => setIsMenuOpen(false), 100)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {isMenuOpen ? (
              <div className="absolute end-0 z-30 mt-1 min-w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-2 text-start text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleAction(() => onEdit(conversation))}
                >
                  <Edit className="me-2 h-4 w-4" />
                  {labels.edit}
                </button>
                {canClose ? (
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-start text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleAction(() => onClose(conversation.id))}
                  >
                    <Lock className="me-2 h-4 w-4" />
                    {labels.close}
                  </button>
                ) : null}
                {canReopen ? (
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-start text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      handleAction(() => onReopen(conversation.id))
                    }
                  >
                    <RotateCcw className="me-2 h-4 w-4" />
                    {labels.reopen}
                  </button>
                ) : null}
                {canArchive ? (
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-start text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      handleAction(() => onArchive(conversation.id))
                    }
                  >
                    <Archive className="me-2 h-4 w-4" />
                    {labels.archive}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
