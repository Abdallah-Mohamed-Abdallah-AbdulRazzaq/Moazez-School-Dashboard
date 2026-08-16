import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationId,
  CommunicationRecord,
} from "./communication.types";

export type ConversationStatus = "active" | "archived" | "closed";
export type ConversationType =
  | "direct"
  | "group"
  | "classroom"
  | "grade"
  | "section"
  | "stage"
  | "school_wide"
  | "support"
  | "system";
export type ParticipantRole =
  | "owner"
  | "admin"
  | "moderator"
  | "member"
  | "read_only"
  | "system";
export type ParticipantStatus =
  | "active"
  | "invited"
  | "left"
  | "removed"
  | "muted"
  | "blocked";

export interface Conversation extends CommunicationRecord {
  id: CommunicationId;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  type?: ConversationType;
  status?: ConversationStatus;
  participantsCount?: number;
  unreadCount?: number;
  lastMessageAt?: CommunicationDateTime | null;
  createdBy?: CommunicationActor;
  createdById?: CommunicationId;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
  isReadOnly?: boolean;
  readOnly?: boolean;
}

export interface CreateConversationPayload {
  type: ConversationType;
  title?: string | null;
  description?: string | null;
  avatarFileId?: CommunicationId | null;
  academicYearId?: CommunicationId;
  termId?: CommunicationId;
  stageId?: CommunicationId;
  gradeId?: CommunicationId;
  sectionId?: CommunicationId;
  classroomId?: CommunicationId;
  subjectId?: CommunicationId;
  isReadOnly?: boolean;
  isPinned?: boolean;
  metadata?: CommunicationRecord | null;
}

export interface UpdateConversationPayload {
  title?: string | null;
  description?: string | null;
  avatarFileId?: CommunicationId | null;
  isReadOnly?: boolean;
  isPinned?: boolean;
  metadata?: CommunicationRecord | null;
}

export type ListConversationsParams = {
  status?: ConversationStatus;
  type?: ConversationType;
  search?: string;
  page?: number;
  limit?: number;
};

export interface ConversationParticipant extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  userId?: CommunicationId;
  role?: ParticipantRole;
  status?: ParticipantStatus;
  actor?: CommunicationActor;
  mutedUntil?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
  joinedAt?: CommunicationDateTime;
  leftAt?: CommunicationDateTime | null;
  user?: {
    id: string;
    displayName: string;
    userType: string;
  };
  isBlocked?: boolean;
  isRestricted?: boolean;
}

export interface AddParticipantPayload {
  userId: CommunicationId;
  role?: ParticipantRole;
  status?: ParticipantStatus;
  mutedUntil?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
}

export interface UpdateParticipantPayload {
  role?: ParticipantRole;
  status?: ParticipantStatus;
  mutedUntil?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
}

export interface ParticipantRoleChangePayload {
  targetRole?: ParticipantRole;
}

export interface ConversationInvite extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  invitedUserId?: CommunicationId;
  invitedUser?: CommunicationActor;
  status?: "pending" | "accepted" | "rejected" | "expired";
  expiresAt?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface CreateConversationInvitePayload {
  invitedUserId: CommunicationId;
  expiresAt?: CommunicationDateTime | null;
  metadata?: CommunicationRecord | null;
}

export interface RejectConversationInvitePayload {
  reason?: string;
}

export interface ConversationJoinRequest extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  requestedById?: CommunicationId;
  requestedBy?: {
    id: CommunicationId;
    displayName: string;
    userType: string;
  };
  userId?: CommunicationId;
  user?: CommunicationActor;
  status?: "pending" | "approved" | "rejected";
  note?: string | null;
  metadata?: CommunicationRecord | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface CreateJoinRequestPayload {
  note?: string;
  metadata?: CommunicationRecord | null;
}

export interface ReviewJoinRequestPayload {
  reason?: string;
}

export interface MarkConversationReadPayload {
  readAt?: CommunicationDateTime;
}

export interface ConversationMessageReadCount {
  messageId: CommunicationId;
  readCount: number;
}

export interface ConversationReadResult extends CommunicationRecord {
  conversationId: CommunicationId;
  readAt: CommunicationDateTime;
  markedCount: number;
  messages: ConversationMessageReadCount[];
}

export type ConversationReadSummaryParams = {
  limit?: number;
  page?: number;
};

export interface ConversationReadSummary extends CommunicationRecord {
  conversationId: CommunicationId;
  items: ConversationMessageReadCount[];
  total: number;
  limit: number;
  page: number;
}
