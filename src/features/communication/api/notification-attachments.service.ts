import { getAnnouncementAttachments, getAttachments, getMessageInfo } from "./communication.service";
import { notificationAnnouncementId, notificationMessageId } from "@/features/communication/utils/notificationPresentation";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import type { MessageAttachment, MessageInfo } from "@/features/communication/types/message.types";
import type { CommunicationEnvelope, CommunicationList, CommunicationListResponse } from "@/features/communication/types/communication.types";

function attachmentList(response: CommunicationListResponse<MessageAttachment>): MessageAttachment[] {
  if (Array.isArray(response)) return response;
  const envelope = response as CommunicationEnvelope<CommunicationList<MessageAttachment> | MessageAttachment[]>;
  const nested = response.items ?? envelope.data ?? envelope.item ?? envelope.result ?? envelope.payload;
  if (!nested) throw new Error("Attachment response did not contain a list.");
  return attachmentList(nested as CommunicationListResponse<MessageAttachment>);
}

export async function getNotificationAttachments(notification: CommunicationNotification) {
  const announcementId = notificationAnnouncementId(notification);
  if (announcementId) return attachmentList(await getAnnouncementAttachments(announcementId));
  const messageId = notificationMessageId(notification);
  if (!messageId) return [];
  const response = await getMessageInfo(messageId);
  const envelope = response as CommunicationEnvelope<MessageInfo>;
  const messageInfo = envelope.data ?? envelope.item ?? envelope.result ?? envelope.payload ?? response as MessageInfo;
  if (messageInfo.message.status === "hidden" || messageInfo.message.status === "deleted") return [];
  return attachmentList(await getAttachments(messageId));
}
