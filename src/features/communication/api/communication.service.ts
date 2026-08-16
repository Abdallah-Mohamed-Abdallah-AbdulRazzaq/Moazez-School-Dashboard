import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/lib/api";
import {
  compactBackendPayload,
  toBackendAddParticipantPayload,
  toBackendAnnouncementAttachmentLinkPayload,
  toBackendAnnouncementCreatePayload,
  toBackendAnnouncementUpdatePayload,
  toBackendAttachmentLinkPayload,
  toBackendBlockCreatePayload,
  toBackendConversationInvitePayload,
  toBackendConversationCreatePayload,
  toBackendConversationUpdatePayload,
  toBackendCreateJoinRequestPayload,
  toBackendPolicyUpdatePayload,
  toBackendReportCreatePayload,
  toBackendReportUpdatePayload,
  toBackendRejectInvitePayload,
  toBackendRestrictionCreatePayload,
  toBackendRestrictionUpdatePayload,
  toBackendReviewJoinRequestPayload,
  toBackendRoleChangePayload,
  toBackendSendMessagePayload,
  toBackendUpdateParticipantPayload,
  toBackendUpdateMessagePayload,
} from "./communication.mappers";
import type {
  Announcement,
  AnnouncementReadSummary,
  CreateAnnouncementPayload,
  LinkAnnouncementAttachmentPayload,
  ListAnnouncementsParams,
  UpdateAnnouncementPayload,
} from "@/features/communication/types/announcement.types";
import type {
  AddParticipantPayload,
  Conversation,
  ConversationInvite,
  ConversationJoinRequest,
  ConversationParticipant,
  ConversationReadSummary,
  ConversationReadResult,
  ConversationReadSummaryParams,
  CreateConversationInvitePayload,
  CreateJoinRequestPayload,
  CreateConversationPayload,
  ListConversationsParams,
  MarkConversationReadPayload,
  ParticipantRoleChangePayload,
  RejectConversationInvitePayload,
  ReviewJoinRequestPayload,
  UpdateParticipantPayload,
  UpdateConversationPayload,
} from "@/features/communication/types/conversation.types";
import type {
  CommunicationAdminOverview,
  CommunicationListResponse,
  CommunicationPolicy,
  CommunicationResponse,
  UpdateCommunicationPolicyPayload,
} from "@/features/communication/types/communication.types";
import type {
  LinkAttachmentPayload,
  ListMessagesParams,
  Message,
  MessageAttachment,
  MessageInfo,
  MessageReaction,
  ReactionType,
  SendMessagePayload,
  UpdateMessagePayload,
} from "@/features/communication/types/message.types";
import type {
  CommunicationNotification,
  ListNotificationDeliveriesParams,
  ListNotificationsParams,
  NotificationDelivery,
} from "@/features/communication/types/notification.types";
import type {
  CreateBlockPayload,
  CreateMessageReportPayload,
  CreateModerationActionPayload,
  CreateRestrictionPayload,
  ListBlocksParams,
  ListMessageReportsParams,
  ListRestrictionsParams,
  MessageReport,
  ModerationAction,
  Restriction,
  UpdateMessageReportPayload,
  UpdateRestrictionPayload,
  UserBlock,
} from "@/features/communication/types/safety.types";

const COMMUNICATION_ENDPOINT = "/communication";

type FlexibleDeleteResponse = CommunicationResponse<{
  success?: boolean;
  ok?: boolean;
}>;

const ANNOUNCEMENT_QUERY_KEYS = [
  "status",
  "priority",
  "audienceType",
  "search",
  "publishedFrom",
  "publishedTo",
  "createdById",
  "page",
  "limit",
] as const;
const CONVERSATION_QUERY_KEYS = [
  "status",
  "type",
  "search",
  "page",
  "limit",
] as const;
const MESSAGE_QUERY_KEYS = [
  "type",
  "status",
  "before",
  "after",
  "page",
  "limit",
] as const;
const PAGINATION_QUERY_KEYS = ["page", "limit"] as const;
const NOTIFICATION_QUERY_KEYS = [
  "status",
  "priority",
  "type",
  "sourceModule",
  "sourceType",
  "sourceId",
  "recipientUserId",
  "createdFrom",
  "createdTo",
  "page",
  "limit",
] as const;
const NOTIFICATION_DELIVERY_QUERY_KEYS = [
  "notificationId",
  "recipientUserId",
  "channel",
  "status",
  "deliveryStatus",
  "provider",
  "createdFrom",
  "createdTo",
  "page",
  "limit",
] as const;
const MESSAGE_REPORT_QUERY_KEYS = [
  "messageId",
  "status",
  "reason",
  "conversationId",
  "reporterId",
  "page",
  "limit",
] as const;
const RESTRICTION_QUERY_KEYS = [
  "userId",
  "targetUserId",
  "activeOnly",
  "status",
  "type",
  "page",
  "limit",
] as const;

function compactParams(
  params?: Record<string, unknown>,
): Record<string, string | number | boolean | string[]> | undefined {
  if (!params) return undefined;

  const compacted = Object.entries(params).reduce<
    Record<string, string | number | boolean | string[]>
  >((acc, [key, value]) => {
    if (Array.isArray(value)) {
      const values = value
        .filter(
          (item): item is string | number | boolean =>
            (typeof item === "string" ||
              typeof item === "number" ||
              typeof item === "boolean") &&
            item !== "",
        )
        .map(String);

      if (values.length > 0) {
        acc[key] = values;
      }

      return acc;
    }

    if (
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean") &&
      value !== ""
    ) {
      acc[key] = value;
    }

    return acc;
  }, {});

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function pickParams(
  params: Record<string, unknown> | undefined,
  allowedKeys: readonly string[],
): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const allowed = new Set(allowedKeys);
  const output = Object.entries(params).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (allowed.has(key)) acc[key] = value;
      return acc;
    },
    {},
  );
  return Object.keys(output).length > 0 ? output : undefined;
}

const queryConfig = (
  params?: Record<string, unknown>,
  allowedKeys?: readonly string[],
) => ({
  params: compactParams(allowedKeys ? pickParams(params, allowedKeys) : params),
});

export function getPolicy(): Promise<CommunicationResponse<CommunicationPolicy>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/policies`);
}

export function updatePolicy(
  payload: UpdateCommunicationPolicyPayload,
): Promise<CommunicationResponse<CommunicationPolicy>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/policies`,
    toBackendPolicyUpdatePayload(payload),
  );
}

export function getAdminOverview(): Promise<
  CommunicationResponse<CommunicationAdminOverview>
> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/admin/overview`);
}

export function createAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements`,
    toBackendAnnouncementCreatePayload(payload),
  );
}

export function getAnnouncements(
  params?: ListAnnouncementsParams,
): Promise<CommunicationListResponse<Announcement>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/announcements`,
    queryConfig(params, ANNOUNCEMENT_QUERY_KEYS),
  );
}

export function getAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/announcements/${announcementId}`);
}

export function updateAnnouncement(
  announcementId: string,
  payload: UpdateAnnouncementPayload,
): Promise<CommunicationResponse<Announcement>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}`,
    toBackendAnnouncementUpdatePayload(payload),
  );
}

export function publishAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/publish`,
  );
}

export function markAnnouncementRead(
  announcementId: string,
): Promise<CommunicationResponse<AnnouncementReadSummary>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/read`,
  );
}

export function getAnnouncementReadSummary(
  announcementId: string,
): Promise<CommunicationResponse<AnnouncementReadSummary>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/read-summary`,
  );
}

export function archiveAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/archive`,
  );
}

export function cancelAnnouncement(
  announcementId: string,
): Promise<CommunicationResponse<Announcement>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/cancel`,
  );
}

export function getAnnouncementAttachments(
  announcementId: string,
): Promise<CommunicationListResponse<MessageAttachment>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/attachments`,
  );
}

export function linkAnnouncementAttachment(
  announcementId: string,
  payload: LinkAnnouncementAttachmentPayload,
): Promise<CommunicationResponse<MessageAttachment>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/attachments`,
    toBackendAnnouncementAttachmentLinkPayload(payload),
  );
}

export function deleteAnnouncementAttachment(
  announcementId: string,
  attachmentId: string,
): Promise<FlexibleDeleteResponse> {
  return apiDelete(
    `${COMMUNICATION_ENDPOINT}/announcements/${announcementId}/attachments/${attachmentId}`,
  );
}

export function createConversation(
  payload: CreateConversationPayload,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations`,
    toBackendConversationCreatePayload(payload),
  );
}

export function getConversations(
  params?: ListConversationsParams,
): Promise<CommunicationListResponse<Conversation>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations`,
    queryConfig(params, CONVERSATION_QUERY_KEYS),
  );
}

export function getConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/conversations/${conversationId}`);
}

export function updateConversation(
  conversationId: string,
  payload: UpdateConversationPayload,
): Promise<CommunicationResponse<Conversation>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}`,
    toBackendConversationUpdatePayload(payload),
  );
}

export function closeConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/close`);
}

export function reopenConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/reopen`,
  );
}

export function archiveConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/archive`,
  );
}

export function addParticipant(
  conversationId: string,
  payload: AddParticipantPayload,
): Promise<CommunicationResponse<ConversationParticipant>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants`,
    toBackendAddParticipantPayload(payload),
  );
}

export function getParticipants(
  conversationId: string,
): Promise<CommunicationListResponse<ConversationParticipant>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants`,
  );
}

export function updateParticipant(
  conversationId: string,
  participantId: string,
  payload: UpdateParticipantPayload,
): Promise<CommunicationResponse<ConversationParticipant>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants/${participantId}`,
    toBackendUpdateParticipantPayload(payload),
  );
}

export function removeParticipant(
  conversationId: string,
  participantId: string,
): Promise<FlexibleDeleteResponse> {
  return apiDelete(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants/${participantId}`,
  );
}

export function leaveConversation(
  conversationId: string,
): Promise<CommunicationResponse<Conversation>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/leave`);
}

export function promoteParticipant(
  conversationId: string,
  participantId: string,
  payload: ParticipantRoleChangePayload,
): Promise<CommunicationResponse<ConversationParticipant>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants/${participantId}/promote`,
    toBackendRoleChangePayload(payload),
  );
}

export function demoteParticipant(
  conversationId: string,
  participantId: string,
  payload: ParticipantRoleChangePayload,
): Promise<CommunicationResponse<ConversationParticipant>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/participants/${participantId}/demote`,
    toBackendRoleChangePayload(payload),
  );
}

export function getConversationInvites(
  conversationId: string,
): Promise<CommunicationListResponse<ConversationInvite>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/invites`,
  );
}

export function createConversationInvite(
  conversationId: string,
  payload: CreateConversationInvitePayload,
): Promise<CommunicationResponse<ConversationInvite>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/invites`,
    toBackendConversationInvitePayload(payload),
  );
}

export function acceptConversationInvite(
  inviteId: string,
): Promise<CommunicationResponse<ConversationInvite>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/conversation-invites/${inviteId}/accept`);
}

export function rejectConversationInvite(
  inviteId: string,
  payload?: RejectConversationInvitePayload,
): Promise<CommunicationResponse<ConversationInvite>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversation-invites/${inviteId}/reject`,
    payload ? toBackendRejectInvitePayload(payload) : undefined,
  );
}

export function getJoinRequests(
  conversationId: string,
): Promise<CommunicationListResponse<ConversationJoinRequest>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/join-requests`,
  );
}

export function createJoinRequest(
  conversationId: string,
  payload?: CreateJoinRequestPayload,
): Promise<CommunicationResponse<ConversationJoinRequest>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/join-requests`,
    payload ? toBackendCreateJoinRequestPayload(payload) : undefined,
  );
}

export function approveJoinRequest(
  requestId: string,
  payload?: ReviewJoinRequestPayload,
): Promise<CommunicationResponse<ConversationJoinRequest>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/join-requests/${requestId}/approve`,
    payload ? toBackendReviewJoinRequestPayload(payload) : undefined,
  );
}

export function rejectJoinRequest(
  requestId: string,
  payload?: ReviewJoinRequestPayload,
): Promise<CommunicationResponse<ConversationJoinRequest>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/join-requests/${requestId}/reject`,
    payload ? toBackendReviewJoinRequestPayload(payload) : undefined,
  );
}

export function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
): Promise<CommunicationResponse<Message>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/messages`,
    toBackendSendMessagePayload(payload),
  );
}

export function getMessages(
  conversationId: string,
  params?: ListMessagesParams,
): Promise<CommunicationListResponse<Message>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/messages`,
    queryConfig(params, MESSAGE_QUERY_KEYS),
  );
}

export function getMessage(
  messageId: string,
): Promise<CommunicationResponse<Message>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}`);
}

export function getMessageInfo(
  messageId: string,
): Promise<CommunicationResponse<MessageInfo>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/info`);
}

export function updateMessage(
  messageId: string,
  payload: UpdateMessagePayload,
): Promise<CommunicationResponse<Message>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}`,
    toBackendUpdateMessagePayload(payload),
  );
}

export function deleteMessage(messageId: string): Promise<FlexibleDeleteResponse> {
  return apiDelete(`${COMMUNICATION_ENDPOINT}/messages/${messageId}`);
}

export function markMessageRead(
  messageId: string,
): Promise<CommunicationResponse<Message>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/read`);
}

export function markConversationRead(
  conversationId: string,
  payload?: MarkConversationReadPayload,
): Promise<CommunicationResponse<ConversationReadResult>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/read`,
    payload
      ? compactBackendPayload({
          readAt: payload.readAt,
        })
      : undefined,
  );
}

export function getConversationReadSummary(
  conversationId: string,
  params?: ConversationReadSummaryParams,
): Promise<CommunicationResponse<ConversationReadSummary>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/conversations/${conversationId}/read-summary`,
    queryConfig(params, PAGINATION_QUERY_KEYS),
  );
}

export function getNotifications(
  params?: ListNotificationsParams,
): Promise<CommunicationListResponse<CommunicationNotification>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/notifications`,
    queryConfig(params, NOTIFICATION_QUERY_KEYS),
  );
}

export function getNotification(
  notificationId: string,
): Promise<CommunicationResponse<CommunicationNotification>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/notifications/${notificationId}`);
}

export function markNotificationRead(
  notificationId: string,
): Promise<CommunicationResponse<CommunicationNotification>> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/notifications/${notificationId}/read`);
}

export function archiveNotification(
  notificationId: string,
): Promise<CommunicationResponse<CommunicationNotification>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/notifications/${notificationId}/archive`,
  );
}

export function markAllNotificationsRead(): Promise<
  CommunicationResponse<{ updatedCount?: number }>
> {
  return apiPost(`${COMMUNICATION_ENDPOINT}/notifications/read-all`);
}

export function getNotificationDeliveries(
  params?: ListNotificationDeliveriesParams,
): Promise<CommunicationListResponse<NotificationDelivery>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/notification-deliveries`,
    queryConfig(params, NOTIFICATION_DELIVERY_QUERY_KEYS),
  );
}

export function getNotificationDelivery(
  deliveryId: string,
): Promise<CommunicationResponse<NotificationDelivery>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/notification-deliveries/${deliveryId}`);
}

export function upsertReaction(
  messageId: string,
  type: ReactionType,
): Promise<CommunicationResponse<MessageReaction>> {
  return apiPut(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/reactions`, {
    type,
  });
}

export function getReactions(
  messageId: string,
): Promise<CommunicationListResponse<MessageReaction>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/reactions`);
}

export function deleteMyReaction(messageId: string): Promise<FlexibleDeleteResponse> {
  return apiDelete(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/reactions/me`,
  );
}

export function linkAttachment(
  messageId: string,
  payload: LinkAttachmentPayload,
): Promise<CommunicationResponse<MessageAttachment>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/attachments`,
    toBackendAttachmentLinkPayload(payload),
  );
}

export function getAttachments(
  messageId: string,
): Promise<CommunicationListResponse<MessageAttachment>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/messages/${messageId}/attachments`);
}

export function deleteAttachment(
  messageId: string,
  attachmentId: string,
): Promise<FlexibleDeleteResponse> {
  return apiDelete(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/attachments/${attachmentId}`,
  );
}

export function createMessageReport(
  messageId: string,
  payload: CreateMessageReportPayload,
): Promise<CommunicationResponse<MessageReport>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/reports`,
    toBackendReportCreatePayload(payload),
  );
}

export function getMessageReports(
  params?: ListMessageReportsParams,
): Promise<CommunicationListResponse<MessageReport>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/message-reports`,
    queryConfig(params, MESSAGE_REPORT_QUERY_KEYS),
  );
}

export function getMessageReport(
  reportId: string,
): Promise<CommunicationResponse<MessageReport>> {
  return apiGet(`${COMMUNICATION_ENDPOINT}/message-reports/${reportId}`);
}

export function updateMessageReport(
  reportId: string,
  payload: UpdateMessageReportPayload,
): Promise<CommunicationResponse<MessageReport>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/message-reports/${reportId}`,
    toBackendReportUpdatePayload(payload),
  );
}

export function createModerationAction(
  messageId: string,
  payload: CreateModerationActionPayload,
): Promise<CommunicationResponse<ModerationAction>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/moderation-actions`,
    compactBackendPayload(
      {
        action: payload.action,
        reason: payload.reason,
        note: payload.note,
        metadata: payload.metadata,
      },
      ["reason", "note", "metadata"],
    ),
  );
}

export function getModerationActions(
  messageId: string,
): Promise<CommunicationListResponse<ModerationAction>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/messages/${messageId}/moderation-actions`,
  );
}

export function createRestriction(
  payload: CreateRestrictionPayload,
): Promise<CommunicationResponse<Restriction>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/restrictions`,
    toBackendRestrictionCreatePayload(payload),
  );
}

export function getRestrictions(
  params?: ListRestrictionsParams,
): Promise<CommunicationListResponse<Restriction>> {
  return apiGet(
    `${COMMUNICATION_ENDPOINT}/restrictions`,
    queryConfig(params, RESTRICTION_QUERY_KEYS),
  );
}

export function updateRestriction(
  restrictionId: string,
  payload: UpdateRestrictionPayload,
): Promise<CommunicationResponse<Restriction>> {
  return apiPatch(
    `${COMMUNICATION_ENDPOINT}/restrictions/${restrictionId}`,
    toBackendRestrictionUpdatePayload(payload),
  );
}

export function deleteRestriction(
  restrictionId: string,
): Promise<FlexibleDeleteResponse> {
  return apiDelete(`${COMMUNICATION_ENDPOINT}/restrictions/${restrictionId}`);
}

export function createBlock(
  payload: CreateBlockPayload,
): Promise<CommunicationResponse<UserBlock>> {
  return apiPost(
    `${COMMUNICATION_ENDPOINT}/blocks`,
    toBackendBlockCreatePayload(payload),
  );
}

export function getBlocks(
  params?: ListBlocksParams,
): Promise<CommunicationListResponse<UserBlock>> {
  void params;
  return apiGet(`${COMMUNICATION_ENDPOINT}/blocks`);
}

export function deleteBlock(blockId: string): Promise<FlexibleDeleteResponse> {
  return apiDelete(`${COMMUNICATION_ENDPOINT}/blocks/${blockId}`);
}

export const communicationService = {
  getPolicy,
  updatePolicy,
  getAdminOverview,
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  markAnnouncementRead,
  getAnnouncementReadSummary,
  archiveAnnouncement,
  cancelAnnouncement,
  getAnnouncementAttachments,
  linkAnnouncementAttachment,
  deleteAnnouncementAttachment,
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  closeConversation,
  reopenConversation,
  archiveConversation,
  addParticipant,
  getParticipants,
  updateParticipant,
  removeParticipant,
  leaveConversation,
  promoteParticipant,
  demoteParticipant,
  getConversationInvites,
  createConversationInvite,
  acceptConversationInvite,
  rejectConversationInvite,
  getJoinRequests,
  createJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  sendMessage,
  getMessages,
  getMessage,
  getMessageInfo,
  updateMessage,
  deleteMessage,
  markMessageRead,
  markConversationRead,
  getConversationReadSummary,
  getNotifications,
  getNotification,
  markNotificationRead,
  archiveNotification,
  markAllNotificationsRead,
  getNotificationDeliveries,
  getNotificationDelivery,
  upsertReaction,
  getReactions,
  deleteMyReaction,
  linkAttachment,
  getAttachments,
  deleteAttachment,
  createMessageReport,
  getMessageReports,
  getMessageReport,
  updateMessageReport,
  createModerationAction,
  getModerationActions,
  createRestriction,
  getRestrictions,
  updateRestriction,
  deleteRestriction,
  createBlock,
  getBlocks,
  deleteBlock,
};
