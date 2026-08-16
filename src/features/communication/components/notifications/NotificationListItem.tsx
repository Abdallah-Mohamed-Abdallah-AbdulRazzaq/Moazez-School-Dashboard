"use client";

import { Archive, BellRing, Check, Eye } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

export interface NotificationListItemLabels {
  unread: string;
  read: string;
  untitled: string;
  noBody: string;
  type: string;
  markRead: string;
  archive: string;
  viewDetails: string;
  archived?: string;
}

export interface NotificationListItemProps {
  notification: CommunicationNotification;
  locale: string;
  labels: NotificationListItemLabels;
  currentUserId?: string;
  isMutating?: boolean;
  onArchive?: (notificationId: string) => void;
  onMarkRead?: (notificationId: string) => void;
  onViewDetails?: (notificationId: string) => void;
}

function titleForNotification(
  notification: CommunicationNotification,
  locale: string,
  fallback: string,
) {
  const preferred =
    locale === "ar" ? notification.titleAr : notification.titleEn;
  const secondary =
    locale === "ar" ? notification.titleEn : notification.titleAr;
  return preferred || secondary || notification.title || fallback;
}

function bodyForNotification(
  notification: CommunicationNotification,
  locale: string,
  fallback: string,
) {
  const preferred = locale === "ar" ? notification.bodyAr : notification.bodyEn;
  const secondary = locale === "ar" ? notification.bodyEn : notification.bodyAr;
  return preferred || secondary || notification.body || fallback;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationListItem({
  labels,
  locale,
  notification,
  currentUserId,
  isMutating,
  onArchive,
  onMarkRead,
  onViewDetails,
}: NotificationListItemProps) {
  const isRead = Boolean(notification.readAt);
  const isOwned = Boolean(currentUserId) && (notification.recipientUserId === currentUserId || notification.userId === currentUserId);

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(notification.id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      data-testid="notification-card"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`rounded-lg border p-4 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        isRead
          ? "border-slate-200 bg-white"
          : "border-primary-200 bg-primary-50/70"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isRead
              ? "bg-slate-100 text-slate-500"
              : "bg-primary-100 text-primary-700"
          }`}
        >
          <BellRing className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {titleForNotification(notification, locale, labels.untitled)}
            </h3>
            <CommunicationStatusChip
              label={isRead ? labels.read : labels.unread}
              tone={isRead ? "success" : "info"}
            />
            {notification.status && notification.status !== (isRead ? "read" : "unread") ? (() => {
              let secondaryTone: "success" | "info" | "warning" | "neutral" = "neutral";
              let secondaryLabel = "";
              const statusStr = notification.status as string;
              if (statusStr === "archived") {
                secondaryTone = "warning";
                secondaryLabel = labels.archived ?? "Archived";
              } else if (statusStr === "read") {
                secondaryTone = "success";
                secondaryLabel = labels.read;
              } else if (statusStr === "unread") {
                secondaryTone = "info";
                secondaryLabel = labels.unread;
              } else {
                secondaryTone = "neutral";
                secondaryLabel = statusStr.replace(/_/g, " ");
              }
              return (
                <CommunicationStatusChip
                  label={secondaryLabel}
                  tone={secondaryTone}
                />
              );
            })() : null}
            {notification.type ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {labels.type}: {notification.type}
              </span>
            ) : null}
          </div>
          <p className="line-clamp-2 text-sm text-slate-600">
            {bodyForNotification(notification, locale, labels.noBody)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {formatDate(notification.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onViewDetails ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(notification.id);
                }}
                leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {labels.viewDetails}
              </Button>
            ) : null}
            {isOwned && !isRead && onMarkRead ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                leftIcon={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {labels.markRead}
              </Button>
            ) : null}
            {isOwned && notification.status !== "archived" && onArchive ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(notification.id);
                }}
                leftIcon={
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                }
              >
                {labels.archive}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
