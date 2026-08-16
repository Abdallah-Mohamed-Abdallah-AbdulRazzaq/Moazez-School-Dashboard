"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Bell,
  Megaphone,
  MessageSquare,
  Calendar,
  Award,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Archive,
  Volume2,
  VolumeX,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  getNotificationMuted,
  setNotificationMuted,
} from "@/features/communication/hooks/useNotificationSound";
import { getMessage } from "@/features/communication/api/communication.service";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import {
  communicationConversationId,
  formatRelativeNotificationTime,
  isAnnouncementNotification,
  notificationMessageId,
  notificationPresentation,
  notificationPresentationFallback,
  type NotificationPresentation,
  type NotificationPresentationKind,
} from "@/features/communication/utils/notificationPresentation";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

type NotificationTab = "all" | "chat" | "announcements";

const DOMAIN_NOTIFICATION_ICONS: ReadonlyArray<
  readonly [keyword: string, icon: LucideIcon]
> = [
  ["attendance", Calendar],
  ["grade", Award],
  ["behavior", ShieldAlert],
  ["reinforcement", Gift],
  ["system", AlertTriangle],
];

interface TopNavNotificationDropdownProps {
  notifications: CommunicationNotification[];
  unreadCount: number;
  onMarkRead: (notificationId: string) => Promise<unknown> | void;
  onMarkAllRead: () => Promise<unknown> | void;
  onArchive: (notificationId: string) => Promise<unknown> | void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<unknown> | void;
  isOpen: boolean;
  onClose: () => void;
  activeTab?: NotificationTab;
  onTabChange?: (tab: NotificationTab) => void;
  labels?: {
    title?: string;
    unreadCount?: string;
    markAllRead?: string;
    emptyStateTitle?: string;
    emptyStateDesc?: string;
    archive?: string;
    urgent?: string;
    high?: string;
    mute?: string;
    unmute?: string;
    loading?: string;
    errorTitle?: string;
    retry?: string;
    refresh?: string;
    listLabel?: string;
    tabsLabel?: string;
    viewAll?: string;
    untitled?: string;
    noPreview?: string;
    all?: string;
    chat?: string;
    announcements?: string;
    archived?: string;
    close?: string;
  };
}

function presentationCacheKey(
  notification: CommunicationNotification,
  locale: string,
) {
  return `${locale}:${notification.id}:${notification.updatedAt ?? notification.createdAt ?? ""}`;
}

function useNotificationPresentations(
  notifications: CommunicationNotification[],
  isOpen: boolean,
  locale: string,
) {
  const cacheRef = useRef(new Map<string, NotificationPresentation>());
  const [presentationsById, setPresentationsById] = useState<
    Record<string, NotificationPresentation>
  >({});

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const loadPresentations = async () => {
      const enrichableNotifications = notifications.filter((notification) => {
        const fallback = notificationPresentationFallback(notification, locale);
        return (
          fallback.kind === "message" &&
          Boolean(notificationMessageId(notification))
        );
      });
      if (enrichableNotifications.length === 0) return;

      const entries = await Promise.all(
        enrichableNotifications.map(async (notification) => {
          const cacheKey = presentationCacheKey(notification, locale);
          const cachedPresentation = cacheRef.current.get(cacheKey);
          const presentation =
            cachedPresentation ??
            (await notificationPresentation(notification, locale));
          cacheRef.current.set(cacheKey, presentation);
          return [notification.id, presentation] as const;
        }),
      );

      if (active) setPresentationsById(Object.fromEntries(entries));
    };

    void loadPresentations();
    return () => {
      active = false;
    };
  }, [isOpen, locale, notifications]);

  return presentationsById;
}

function notificationAppearance(
  kind: NotificationPresentationKind,
  type?: string,
  sourceModule?: string,
): {
  icon: LucideIcon;
  readIconClass: string;
  unreadIconClass: string;
} {
  if (kind === "message") {
    return {
      icon: MessageSquare,
      readIconClass: "bg-primary-50 text-primary-700",
      unreadIconClass: "bg-primary text-white",
    };
  }
  if (kind === "announcement") {
    return {
      icon: Megaphone,
      readIconClass: "bg-violet-50 text-violet-700",
      unreadIconClass: "bg-violet-600 text-white",
    };
  }

  return {
    icon: domainNotificationIcon(type, sourceModule),
    readIconClass: "bg-slate-100 text-slate-600",
    unreadIconClass: "bg-slate-800 text-white",
  };
}

function domainNotificationIcon(
  type?: string,
  sourceModule?: string,
): LucideIcon {
  const key = `${type ?? ""} ${sourceModule ?? ""}`.toLowerCase();
  return (
    DOMAIN_NOTIFICATION_ICONS.find(([keyword]) => key.includes(keyword))?.[1] ??
    Bell
  );
}

export default function TopNavNotificationDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onArchive,
  isLoading = false,
  isRefreshing = false,
  error,
  onRefresh,
  isOpen,
  onClose,
  activeTab = "all",
  onTabChange,
  labels,
}: TopNavNotificationDropdownProps) {
  const router = useRouter();
  const locale = useLocale();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const presentationsById = useNotificationPresentations(
    notifications,
    isOpen,
    locale,
  );

  // Track mute state locally to handle state update correctly
  const [muted, setMuted] = useState(getNotificationMuted);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    const opened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!opened) {
      return;
    }

    // Re-sync if another notification control changed the persisted preference
    // while this dropdown was closed.
    void Promise.resolve().then(() => setMuted(getNotificationMuted()));
  }, [isOpen]);

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setNotificationMuted(nextMuted);
    setMuted(nextMuted);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mergedLabels = {
    title: labels?.title ?? "Notifications",
    unreadCount:
      labels?.unreadCount ??
      (unreadCount === 1 ? "1 unread update" : `${unreadCount} unread updates`),
    markAllRead: labels?.markAllRead ?? "Mark all",
    emptyStateTitle: labels?.emptyStateTitle ?? "No notifications yet",
    emptyStateDesc:
      labels?.emptyStateDesc ??
      "New messages, announcements, and school updates will appear here.",
    archive: labels?.archive ?? "Archive",
    urgent: labels?.urgent ?? "Urgent",
    high: labels?.high ?? "High",
    mute: labels?.mute ?? "Mute notifications",
    unmute: labels?.unmute ?? "Unmute notifications",
    loading: labels?.loading ?? "Loading notifications",
    errorTitle: labels?.errorTitle ?? "Unable to load notifications",
    retry: labels?.retry ?? "Retry",
    refresh: labels?.refresh ?? "Refresh notifications",
    listLabel: labels?.listLabel ?? "Notification list",
    tabsLabel: labels?.tabsLabel ?? "Notification filters",
    viewAll: labels?.viewAll ?? "View all notifications",
    untitled: labels?.untitled ?? "Untitled update",
    noPreview: labels?.noPreview ?? "No preview available.",
    all: labels?.all ?? "All",
    chat: labels?.chat ?? "Chat",
    announcements: labels?.announcements ?? "Announcements",
    archived: labels?.archived ?? "Archived",
    close: labels?.close ?? "Close notifications",
  };

  // Resolve route target using the same conversation target as message toasts.
  const getNotificationUrl = (notification: CommunicationNotification) => {
    const conversationId = communicationConversationId(notification);
    if (conversationId) {
      return `/${locale}/communication/conversations?conversationId=${encodeURIComponent(conversationId)}`;
    }

    if (isAnnouncementNotification(notification)) {
      return `/${locale}/communication/notifications?notificationId=${encodeURIComponent(notification.id)}`;
    }
    return null;
  };

  const getAsyncNotificationUrl = async (
    notification: CommunicationNotification,
  ) => {
    const messageId = notificationMessageId(notification);
    if (!messageId) return null;

    const response = await getMessage(messageId);
    const message = recordValue(response);
    const payload = recordValue(message?.data) ?? recordValue(message?.item);
    const conversationId =
      stringValue(message?.conversationId) ??
      stringValue(message?.conversation_id) ??
      stringValue(payload?.conversationId) ??
      stringValue(payload?.conversation_id);

    return conversationId
      ? `/${locale}/communication/conversations?conversationId=${encodeURIComponent(conversationId)}`
      : null;
  };

  const getPriorityBadge = (
    priority?: string,
    currentLabels?: typeof mergedLabels,
  ) => {
    if (priority === "urgent") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
          {currentLabels?.urgent || "Urgent"}
        </span>
      );
    }
    if (priority === "high") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
          {currentLabels?.high || "High"}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/30 sm:hidden"
      />
      <div
        ref={dropdownRef}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:end-0 sm:top-full sm:mt-3 sm:block sm:w-[400px] sm:max-h-[calc(100dvh-6rem)] sm:rounded-2xl"
        role="dialog"
        aria-label={mergedLabels.title}
      >
      {/* Header */}
      <div className="relative border-b border-slate-200/80 bg-slate-50/50 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              {mergedLabels.title}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {mergedLabels.unreadCount}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => void onRefresh?.()}
              disabled={isRefreshing || !onRefresh}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={mergedLabels.refresh}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={muted ? mergedLabels.unmute : mergedLabels.mute}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            {/* Mark All Read Button */}
            <button
              type="button"
              onClick={() => void onMarkAllRead()}
              disabled={unreadCount === 0}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {mergedLabels.markAllRead}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={mergedLabels.close}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-slate-100 bg-white px-2"
        role="tablist"
        aria-label={mergedLabels.tabsLabel}
      >
        {(["all", "chat", "announcements"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = mergedLabels[tab];
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange?.(tab)}
              className={`flex-1 cursor-pointer border-b-2 py-2.5 text-center text-xs font-semibold capitalize transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                isActive
                  ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:max-h-[24rem]"
        role="list"
        aria-label={mergedLabels.listLabel}
      >
        {isLoading ? (
          <div className="space-y-2 p-1" aria-label={mergedLabels.loading}>
            {[0, 1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-xl px-3 py-3 motion-safe:animate-pulse"
              >
                <span className="h-9 w-9 rounded-xl bg-slate-200" />
                <span className="space-y-2">
                  <span className="block h-3 w-2/3 rounded bg-slate-200" />
                  <span className="block h-3 w-full rounded bg-slate-100" />
                  <span className="block h-2 w-1/3 rounded bg-slate-100" />
                </span>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </span>
            <p className="text-sm font-bold text-slate-950">
              {mergedLabels.errorTitle}
            </p>
            <button
              type="button"
              onClick={() => void onRefresh?.()}
              disabled={isRefreshing || !onRefresh}
              className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mergedLabels.retry}
            </button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-1.5">
            {notifications.map((notification) => {
              const isUnread =
                notification.status === "unread" ||
                (notification.status !== "read" && !notification.readAt);
              const fallbackPresentation = notificationPresentationFallback(
                notification,
                locale,
              );
              const presentation =
                presentationsById[notification.id] ?? fallbackPresentation;
              const appearance = notificationAppearance(
                presentation.kind,
                notification.type,
                notification.sourceModule,
              );
              const Icon = appearance.icon;
              const title = presentation.title || mergedLabels.untitled;
              const body = presentation.body || mergedLabels.noPreview;

              const handleCardClick = async () => {
                if (isUnread) {
                  void onMarkRead(notification.id);
                }
                try {
                  const target =
                    (presentation.conversationId
                      ? `/${locale}/communication/conversations?conversationId=${encodeURIComponent(presentation.conversationId)}`
                      : presentation.targetUrl) ??
                    getNotificationUrl(notification) ??
                    (await getAsyncNotificationUrl(notification));
                  if (target) {
                    router.push(target);
                  }
                } catch (error) {
                  console.warn("Failed to resolve notification target:", error);
                } finally {
                  onClose();
                }
              };

              return (
                <div
                  key={notification.id}
                  role="listitem"
                  className={`group grid w-full grid-cols-[1fr_2rem] rounded-xl border transition-colors duration-200 ${
                    isUnread
                      ? "border-primary-100 bg-primary-50/30 hover:bg-primary-50/60"
                      : "border-transparent bg-white hover:border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void handleCardClick()}
                    aria-label={`${presentation.actionLabel}: ${title}`}
                    className="grid min-w-0 cursor-pointer grid-cols-[2.25rem_1fr] gap-2.5 rounded-s-xl px-3 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${
                        isUnread
                          ? appearance.unreadIconClass
                          : appearance.readIconClass
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-start justify-between gap-2">
                        <span
                          className={`min-w-0 truncate text-sm leading-5 text-slate-950 ${
                            isUnread ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {title}
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          {notification.status === "archived" ? (
                            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              {mergedLabels.archived}
                            </span>
                          ) : null}
                          {presentation.priority === "urgent" ||
                          presentation.priority === "high"
                            ? getPriorityBadge(
                                presentation.priority,
                                mergedLabels,
                              )
                            : null}
                        </span>
                      </span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-slate-500">
                        <span className="truncate font-semibold text-slate-600">
                          {presentation.contextLabel}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          •
                        </span>
                        <time
                          dateTime={new Date(
                            presentation.timestamp,
                          ).toISOString()}
                          className="shrink-0 font-medium"
                        >
                          {formatRelativeNotificationTime(
                            presentation.timestamp,
                            locale,
                          )}
                        </time>
                      </span>
                      <span
                        dir="auto"
                        className="mt-1 line-clamp-2 text-xs leading-[1.125rem] text-slate-700"
                      >
                        {body}
                      </span>
                    </span>
                  </button>

                  <span className="flex h-full shrink-0 flex-col items-center justify-between py-2.5 pe-2">
                    <span className="flex h-4 items-center justify-center">
                      {isUnread ? (
                        <span
                          data-testid="unread-indicator"
                          className="h-2 w-2 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="h-2 w-2" />
                      )}
                    </span>
                    <span className="flex h-7 items-center justify-center">
                      <button
                        type="button"
                        onClick={() => void onArchive(notification.id)}
                        aria-label={`${mergedLabels.archive}: ${title}`}
                        className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-950">
              {mergedLabels.emptyStateTitle}
            </p>
            <p className="mt-1 max-w-64 text-xs leading-5 text-slate-600">
              {mergedLabels.emptyStateDesc}
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 bg-white p-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push(`/${locale}/communication/notifications`);
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-primary-700 transition-colors duration-200 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {mergedLabels.viewAll}
          <ArrowRight
            className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      </div>
    </>
  );
}
