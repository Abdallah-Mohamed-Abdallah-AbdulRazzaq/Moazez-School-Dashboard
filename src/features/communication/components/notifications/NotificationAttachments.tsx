"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Paperclip } from "lucide-react";
import { getNotificationAttachments } from "@/features/communication/api/notification-attachments.service";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import type { MessageAttachment } from "@/features/communication/types/message.types";
import NotificationAttachment from "./NotificationAttachment";

export default function NotificationAttachments({ notification }: { notification: CommunicationNotification }) {
  const locale = useLocale();
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void getNotificationAttachments(notification).then(
      (loadedAttachments) => {
        if (!active) return;
        setAttachments(loadedAttachments);
        setLoading(false);
      },
      () => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, [notification]);

  if (!loading && !failed && attachments.length === 0) return null;
  return (
    <section className="space-y-3" aria-label={locale === "ar" ? "المرفقات" : "Attachments"}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Paperclip className="h-4 w-4" aria-hidden="true" />{locale === "ar" ? "المرفقات" : "Attachments"}</h3>
      {loading ? <p role="status" className="text-sm text-slate-500">{locale === "ar" ? "جار تحميل المرفقات..." : "Loading attachments..."}</p> : null}
      {failed ? <p role="alert" className="text-sm text-rose-600">{locale === "ar" ? "تعذر تحميل المرفقات." : "Unable to load attachments."}</p> : null}
      {attachments.map((attachment) => <NotificationAttachment key={attachment.id} attachment={attachment} />)}
    </section>
  );
}
