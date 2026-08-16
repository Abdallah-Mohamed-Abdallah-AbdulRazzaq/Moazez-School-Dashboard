import type {
  CommunicationActor,
  CommunicationDateTime,
  CommunicationFile,
  CommunicationId,
  CommunicationRecord,
} from "./communication.types";

export type MessageStatus = "sent" | "hidden" | "deleted";
export type MessageType = "text" | "image" | "file" | "audio" | "video" | "system";
export type SendableMessageType = Exclude<MessageType, "system"> | "voice";
export type MessageKind = MessageType;
export type ReactionType =
  | "like"
  | "love"
  | "laugh"
  | "wow"
  | "sad"
  | "angry"
  | "thumbs_up"
  | "thumbs_down";

export interface Message extends CommunicationRecord {
  id: CommunicationId;
  conversationId?: CommunicationId;
  senderId?: CommunicationId;
  senderUserId?: CommunicationId;
  sender?: CommunicationActor;
  body?: string;
  content?: string;
  type?: MessageType;
  kind?: MessageKind;
  status?: MessageStatus;
  attachments?: MessageAttachment[];
  attachmentsCount?: number;
  reactionsCount?: number;
  replyToMessageId?: CommunicationId;
  clientMessageId?: CommunicationId;
  readCount?: number;
  sentAt?: CommunicationDateTime;
  editedAt?: CommunicationDateTime | null;
  hiddenAt?: CommunicationDateTime | null;
  hiddenById?: CommunicationId | null;
  hiddenReason?: string | null;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
  deletedAt?: CommunicationDateTime | null;
  deletedById?: CommunicationId | null;
  metadata?: CommunicationRecord | null;
}

export interface MessageReader {
  userId: CommunicationId;
  displayName: string;
  userType: string;
  isMe: boolean;
  readAt: CommunicationDateTime;
}

export interface MessageInfoSender {
  userId: CommunicationId | null;
  displayName: string | null;
  userType: string | null;
  isMe: boolean;
}

export interface MessageInfoSummary {
  messageId: CommunicationId;
  conversationId: CommunicationId;
  sender: MessageInfoSender;
  type: string;
  status: string;
  body: string | null;
  content: string | null;
  createdAt: CommunicationDateTime;
  readCount: number;
}

export interface MessageInfo {
  message: MessageInfoSummary;
  readers: MessageReader[];
  readCount: number;
  participantsCount: number;
  fullyRead: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SendMessagePayload {
  type?: SendableMessageType;
  body?: string;
  content?: string;
  caption?: string;
  clientMessageId?: string;
  replyToMessageId?: CommunicationId;
  attachments?: SendMessageAttachmentPayload[];
  metadata?: CommunicationRecord | null;
}

export interface SendMessageAttachmentPayload {
  fileId: CommunicationId;
  mediaKind?: "image" | "file" | "audio" | "video";
  caption?: string;
  sortOrder?: number;
}

export interface UpdateMessagePayload {
  body?: string;
  content?: string;
}

export type ListMessagesParams = {
  type?: MessageType;
  status?: MessageStatus;
  before?: string;
  after?: string;
  page?: number;
  limit?: number;
};

export interface MessageReaction extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  userId?: CommunicationId;
  type: ReactionType;
  actor?: CommunicationActor;
  createdAt?: CommunicationDateTime;
  updatedAt?: CommunicationDateTime;
}

export interface MessageAttachment extends CommunicationRecord {
  id: CommunicationId;
  messageId?: CommunicationId;
  fileId?: CommunicationId;
  file?: CommunicationFile;
  name?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  createdAt?: CommunicationDateTime;
}

export interface LinkAttachmentPayload {
  fileId: CommunicationId;
  caption?: string;
  sortOrder?: number;
}
