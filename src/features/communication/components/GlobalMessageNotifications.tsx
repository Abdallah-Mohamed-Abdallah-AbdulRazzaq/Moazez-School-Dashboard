"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationSocket } from "@/features/communication/hooks/useCommunicationSocket";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { useMessageNotifications } from "@/features/communication/hooks/useMessageNotifications";
import { NotificationToastContainer } from "@/features/communication/components/NotificationToast";
import {
  notificationPresentation,
  notificationPresentationFallback,
} from "@/features/communication/utils/notificationPresentation";

function eventRecord(payload: unknown, envelopeKey: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }
  const envelope = payload as Record<string, unknown>;
  const content = envelope[envelopeKey] ?? envelope.data ?? envelope;
  return content && typeof content === "object" && !Array.isArray(content)
    ? (content as Record<string, unknown>)
    : undefined;
}

/**
 * Global message notification listener.
 * Renders floating toasts + plays sound for new messages across the dashboard.
 * Mount this once at the layout level.
 *
 * The backend broadcasts notification events to the user room. Message toasts
 * use their safe deep-link ids for display enrichment without joining every
 * conversation room.
 */
export default function GlobalMessageNotifications() {
  const { socket } = useCommunicationSocket();
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { notifications, notify, dismiss } = useMessageNotifications(null);

  useEffect(() => {
    if (!socket) return;
    let isActive = true;

    const showNotificationToast = (payload: unknown) => {
      const notification = eventRecord(payload, "notification");
      if (!notification) return;

      void notificationPresentation(notification, locale).then(
        (presentation) => {
          if (isActive) notify({ ...presentation, currentUserId: user?.id });
        },
      );
    };

    const showAnnouncementToast = (payload: unknown) => {
      const announcement = eventRecord(payload, "announcement");
      if (!announcement) return;
      const presentation = notificationPresentationFallback(
        {
          ...announcement,
          body: announcement.body ?? announcement.content,
          type: "announcement_published",
        },
        locale,
      );

      notify({
        ...presentation,
        currentUserId: user?.id,
      });
    };

    socket.on(
      COMMUNICATION_SOCKET_EVENTS.notificationCreated,
      showNotificationToast,
    );
    socket.on(
      COMMUNICATION_SOCKET_EVENTS.announcementPublished,
      showAnnouncementToast,
    );

    return () => {
      isActive = false;
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.notificationCreated,
        showNotificationToast,
      );
      socket.off(
        COMMUNICATION_SOCKET_EVENTS.announcementPublished,
        showAnnouncementToast,
      );
    };
  }, [locale, socket, notify, user?.id]);

  return (
    <NotificationToastContainer
      locale={locale}
      notifications={notifications}
      onDismiss={dismiss}
      onClick={(notification) => {
        dismiss(notification.id);
        if (notification.targetUrl) {
          router.push(notification.targetUrl);
        } else if (notification.conversationId) {
          router.push(
            `/${locale}/communication/conversations?conversationId=${notification.conversationId}`,
          );
        } else {
          router.push(`/${locale}/communication/notifications`);
        }
      }}
    />
  );
}
