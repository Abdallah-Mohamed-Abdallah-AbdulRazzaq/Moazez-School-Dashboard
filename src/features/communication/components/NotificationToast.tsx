"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Megaphone,
  MessageCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import type { NotificationPriority } from "@/features/communication/types/notification.types";
import { formatRelativeNotificationTime } from "@/features/communication/utils/notificationPresentation";

export type NotificationToastKind = "message" | "announcement" | "notification";

export interface NotificationToastItem {
  id: string;
  conversationId?: string;
  targetUrl?: string;
  title: string;
  body: string;
  contextLabel: string;
  actionLabel: string;
  kind: NotificationToastKind;
  priority?: NotificationPriority;
  timestamp: number;
}

interface NotificationToastProps {
  locale: string;
  notifications: NotificationToastItem[];
  onDismiss: (id: string) => void;
  onClick: (notification: NotificationToastItem) => void;
}

export function NotificationToastContainer({
  locale,
  notifications,
  onDismiss,
  onClick,
}: NotificationToastProps) {
  if (notifications.length === 0) return null;

  const copy = toastCopy(locale);

  return (
    <div
      aria-label={copy.notifications}
      aria-live="polite"
      aria-relevant="additions"
      className="fixed start-3 end-3 top-3 z-[100] flex flex-col gap-2 sm:start-auto sm:end-4 sm:top-4 sm:w-[370px]"
    >
      {notifications.slice(0, 3).map((notification) => (
        <NotificationItem
          key={notification.id}
          closeLabel={copy.dismiss}
          locale={locale}
          notification={notification}
          onDismiss={onDismiss}
          onClick={onClick}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  closeLabel,
  locale,
  notification,
  onDismiss,
  onClick,
}: {
  closeLabel: string;
  locale: string;
  notification: NotificationToastItem;
  onDismiss: (id: string) => void;
  onClick: (notification: NotificationToastItem) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [isPaused, notification.id, onDismiss]);

  const appearance = toastAppearance(notification.kind);
  const Icon = appearance.icon;
  const priority =
    notification.priority === "high" || notification.priority === "urgent"
      ? priorityAppearance(notification.priority, locale)
      : null;

  return (
    <article
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      className={`relative overflow-hidden rounded-xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.14)] motion-safe:animate-in motion-safe:slide-in-from-top-2 ${appearance.border}`}
    >
      <button
        type="button"
        onClick={() => onClick(notification)}
        aria-label={`${notification.actionLabel}: ${notification.title}`}
        className="flex w-full cursor-pointer items-start gap-2.5 p-3 pe-10 text-start transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${appearance.iconBackground}`}
        >
          <Icon
            className={`h-[18px] w-[18px] ${appearance.iconColor}`}
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-5 text-slate-950">
            {notification.title}
          </span>

          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-4">
            <span className="truncate font-semibold text-slate-600">
              {notification.contextLabel}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              •
            </span>
            <time
              dateTime={new Date(notification.timestamp).toISOString()}
              className="shrink-0 font-medium text-slate-500"
            >
              {formatRelativeNotificationTime(notification.timestamp, locale)}
            </time>
            {priority ? (
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 font-bold ${priority.className}`}
              >
                {priority.label}
              </span>
            ) : null}
          </span>

          <span
            dir="auto"
            className="mt-1 line-clamp-2 text-xs leading-[1.125rem] text-slate-700"
          >
            {notification.body}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        aria-label={`${closeLabel}: ${notification.title}`}
        className="absolute end-2 top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </article>
  );
}

function toastAppearance(kind: NotificationToastKind): {
  border: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
} {
  if (kind === "message") {
    return {
      border: "border-primary-200",
      icon: MessageCircle,
      iconBackground: "bg-primary",
      iconColor: "text-white",
    };
  }
  if (kind === "announcement") {
    return {
      border: "border-violet-200",
      icon: Megaphone,
      iconBackground: "bg-violet-600",
      iconColor: "text-white",
    };
  }
  return {
    border: "border-slate-200",
    icon: Bell,
    iconBackground: "bg-slate-100",
    iconColor: "text-slate-700",
  };
}

function priorityAppearance(
  priority: Extract<NotificationPriority, "high" | "urgent">,
  locale: string,
) {
  const labels =
    locale === "ar"
      ? { high: "عالية", urgent: "عاجلة" }
      : { high: "High", urgent: "Urgent" };
  const classes = {
    high: "bg-amber-50 text-amber-800",
    urgent: "bg-rose-50 text-rose-800",
  };
  return { className: classes[priority], label: labels[priority] };
}

function toastCopy(locale: string) {
  return locale === "ar"
    ? { dismiss: "إغلاق الإشعار", notifications: "الإشعارات" }
    : { dismiss: "Dismiss notification", notifications: "Notifications" };
}
