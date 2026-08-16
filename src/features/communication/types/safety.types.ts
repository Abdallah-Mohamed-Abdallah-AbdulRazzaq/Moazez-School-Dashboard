import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationId,
  CommunicationRecord,
} from "./communication.types";

export type MessageReportStatus =
  | "open"
  | "pending"
  | "in_review"
  | "resolved"
  | "dismissed";

export type ReportReason =
  | "spam"
  | "harassment"
  | "bullying"
  | "abusive_language"
  | "inappropriate_content"
  | "safety"
  | "privacy"
  | "other";

export type ModerationActionType =
  | "hide"
  | "unhide"
  | "delete"
  | "restrict_sender"
  | "message_hidden"
  | "message_unhidden"
  | "message_deleted"
  | "user_restricted";
export type RestrictionStatus =
  | "active"
  | "lifted"
  | "revoked"
  | "expired";
export type RestrictionType =
  | "mute"
  | "read_only"
  | "send_disabled"
  | "group_create_disabled"
  | "direct_message_disabled";

export interface CreateMessageReportPayload {
  reason: ReportReason;
  description?: string | null;
  comment?: string | null;
  metadata?: CommunicationRecord | null;
}

export interface MessageReport extends CommunicationRecord {
  id: CommunicationId;
  messageId: CommunicationId;
  conversationId: CommunicationId;
  reporterId: CommunicationId;
  reporterUserId?: CommunicationId;
  reportedUserId?: CommunicationId | null;
  reporter?: CommunicationActor;
  reason?: ReportReason | null;
  reasonCode?: ReportReason | null;
  description?: string | null;
  reasonText?: string | null;
  details?: string;
  comment?: string | null;
  status: MessageReportStatus;
  note?: string | null;
  reviewedById?: CommunicationId | null;
  reviewedAt?: CommunicationDateTime | null;
  resolvedAt?: CommunicationDateTime | null;
  resolutionNote?: string;
  message?: {
    id: CommunicationId;
    conversationId: CommunicationId;
    senderUserId: CommunicationId | null;
    type: string;
    status: string;
    sentAt: CommunicationDateTime;
    hiddenAt: CommunicationDateTime | null;
    deletedAt: CommunicationDateTime | null;
  };
  metadata?: CommunicationRecord | null;
  createdAt: CommunicationDateTime;
  updatedAt: CommunicationDateTime;
}

export type ListMessageReportsParams = {
  messageId?: CommunicationId;
  status?: MessageReportStatus;
  reason?: ReportReason;
  conversationId?: CommunicationId;
  reporterId?: CommunicationId;
  limit?: number;
  page?: number;
};

export interface UpdateMessageReportPayload {
  status: MessageReportStatus;
  note?: string | null;
  resolutionNote?: string | null;
  metadata?: CommunicationRecord | null;
}

export interface CreateModerationActionPayload {
  action: ModerationActionType;
  reason?: string | null;
  note?: string | null;
  metadata?: CommunicationRecord | null;
}

export interface ModerationAction extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  moderatorId?: CommunicationId;
  moderator?: CommunicationActor;
  action?: ModerationActionType;
  reason?: string;
  createdAt?: CommunicationDateTime;
}

export interface CreateRestrictionPayload {
  targetUserId: CommunicationId;
  type: RestrictionType;
  reason?: string | null;
  startsAt?: CommunicationDateTime;
  expiresAt?: CommunicationDateTime;
  metadata?: CommunicationRecord | null;
}

export interface Restriction extends CommunicationRecord {
  id: CommunicationId;
  targetUserId?: CommunicationId;
  targetUser?: CommunicationActor;
  type?: RestrictionType;
  createdById?: CommunicationId;
  createdBy?: CommunicationActor;
  reason?: string | null;
  status?: RestrictionStatus;
  startsAt?: CommunicationDateTime;
  expiresAt?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export type ListRestrictionsParams = {
  userId?: CommunicationId;
  targetUserId?: CommunicationId;
  activeOnly?: boolean;
  status?: RestrictionStatus;
  type?: RestrictionType;
  limit?: number;
  page?: number;
};

export interface UpdateRestrictionPayload {
  reason?: string | null;
  startsAt?: CommunicationDateTime;
  expiresAt?: CommunicationDateTime;
  metadata?: CommunicationRecord | null;
}

export interface CreateBlockPayload {
  targetUserId: CommunicationId;
  reason?: string | null;
  metadata?: CommunicationRecord | null;
}

export interface UserBlock extends CommunicationRecord {
  id: CommunicationId;
  blockerUserId?: CommunicationId;
  targetUserId?: CommunicationId;
  targetUser?: CommunicationActor;
  reason?: string;
  createdAt?: CommunicationDateTime;
}

export type ListBlocksParams = {
  targetUserId?: CommunicationId;
  limit?: number;
  page?: number;
};
