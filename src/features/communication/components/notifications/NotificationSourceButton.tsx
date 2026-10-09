"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/button/Button";
import {
  communicationConversationId,
  loadNotificationConversationId,
  notificationAnnouncementId,
  notificationMessageId,
} from "@/features/communication/utils/notificationPresentation";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";

export default function NotificationSourceButton({ notification, onClose }: {
  notification: CommunicationNotification;
  onClose: () => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const announcementId = notificationAnnouncementId(notification);
  const knownConversationId = communicationConversationId(notification);
  const messageId = notificationMessageId(notification);
  const [resolvedConversationId, setResolvedConversationId] = useState<string>();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (announcementId || knownConversationId || !messageId) return;
    let active = true;
    void loadNotificationConversationId(notification).then((conversationId) => {
      if (!active) return;
      setResolvedConversationId(conversationId);
      setResolved(true);
    });
    return () => { active = false; };
  }, [announcementId, knownConversationId, messageId, notification]);

  if (!announcementId && !knownConversationId && !messageId) return null;
  const conversationId = knownConversationId ?? resolvedConversationId;
  const target = announcementId
    ? `/${locale}/communication/announcements/${encodeURIComponent(announcementId)}`
    : conversationId ? `/${locale}/communication/conversations/${encodeURIComponent(conversationId)}` : undefined;
  const label = announcementId
    ? (locale === "ar" ? "عرض الإعلان" : "View announcement")
    : (locale === "ar" ? "فتح المحادثة" : "Open conversation");

  return (
    <Button
      variant="primary"
      disabled={!target}
      title={resolved && !target ? (locale === "ar" ? "تعذر العثور على المحادثة." : "Conversation unavailable.") : undefined}
      leftIcon={<ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
      onClick={() => {
        if (!target) return;
        onClose();
        router.push(target);
      }}
    >
      {label}
    </Button>
  );
}
