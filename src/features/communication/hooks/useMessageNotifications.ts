"use client";

import { useCallback, useRef, useState } from "react";
import type {
  NotificationToastItem,
  NotificationToastKind,
} from "@/features/communication/components/NotificationToast";
import type { NotificationPriority } from "@/features/communication/types/notification.types";
import { useNotificationSound } from "./useNotificationSound";

export function useMessageNotifications(currentConversationId?: string | null) {
  const [notifications, setNotifications] = useState<NotificationToastItem[]>([]);
  const { play: playSound } = useNotificationSound();
  const idCounterRef = useRef(0);

  const notify = useCallback(
    (params: {
      actionLabel: string;
      senderUserId?: string;
      body: string;
      contextLabel: string;
      conversationId?: string;
      kind: NotificationToastKind;
      priority?: NotificationPriority;
      targetUrl?: string;
      timestamp?: number;
      title: string;
      currentUserId?: string;
    }) => {
      // Don't notify for own messages
      if (params.currentUserId && params.senderUserId === params.currentUserId) return;
      // Don't notify if user is currently viewing that conversation
      if (
        params.conversationId &&
        params.conversationId === currentConversationId
      ) {
        return;
      }

      const id = `notif-${Date.now()}-${++idCounterRef.current}`;
      const notification: NotificationToastItem = {
        actionLabel: params.actionLabel,
        body: params.body.slice(0, 180),
        contextLabel: params.contextLabel,
        conversationId: params.conversationId,
        id,
        kind: params.kind,
        priority: params.priority,
        targetUrl: params.targetUrl,
        timestamp: params.timestamp ?? Date.now(),
        title: params.title,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      playSound();

      // Browser notification if tab is not focused
      if (typeof document !== "undefined" && document.hidden) {
        showBrowserNotification(params.title, params.body);
      }
    },
    [currentConversationId, playSound],
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, notify, dismiss, clearAll };
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body.slice(0, 100),
      icon: "/favicon.ico",
      tag: "moazez-message",
    });
  } else if (Notification.permission !== "denied") {
    void Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body: body.slice(0, 100),
          icon: "/favicon.ico",
          tag: "moazez-message",
        });
      }
    });
  }
}
