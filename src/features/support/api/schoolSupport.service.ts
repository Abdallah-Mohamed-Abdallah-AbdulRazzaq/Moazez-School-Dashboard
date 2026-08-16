import { apiGet, apiPost } from "@/lib/api";

const SCHOOL_SUPPORT_ENDPOINT = "/school-support";

export type SchoolSupportConversationStatus = "active" | "closed";
export type SchoolSupportSenderKind = "school" | "support" | "system";

export interface SchoolSupportConversationSummary {
  id: string;
  type?: "support";
  status: SchoolSupportConversationStatus;
  title?: string;
  lastMessageAt?: string | null;
}

export interface SchoolSupportUnreadSummary {
  count: number;
  lastReadAt?: string | null;
}

export interface SchoolSupportConversationResponse {
  conversation: SchoolSupportConversationSummary;
  unread?: SchoolSupportUnreadSummary;
}

export interface SchoolSupportMessageSender {
  kind: SchoolSupportSenderKind;
  displayName?: string;
}

export interface SchoolSupportMessage {
  id: string;
  conversationId: string;
  body: string | null;
  sender: SchoolSupportMessageSender;
  isMine?: boolean;
  sentAt: string;
}

export interface SchoolSupportMessagesResponse {
  conversation: Pick<SchoolSupportConversationSummary, "id" | "status">;
  items: SchoolSupportMessage[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ListSchoolSupportMessagesParams {
  before?: string;
  after?: string;
  page?: number;
  limit?: number;
}

export interface SendSchoolSupportMessagePayload {
  body: string;
  clientMessageId?: string;
}

export interface MarkSchoolSupportReadPayload {
  readAt?: string;
}

export function getSchoolSupportConversation() {
  return apiGet<SchoolSupportConversationResponse>(
    `${SCHOOL_SUPPORT_ENDPOINT}/conversation`,
  );
}

export function getSchoolSupportMessages(
  params?: ListSchoolSupportMessagesParams,
) {
  return apiGet<SchoolSupportMessagesResponse>(
    `${SCHOOL_SUPPORT_ENDPOINT}/messages`,
    { params },
  );
}

export function sendSchoolSupportMessage(
  payload: SendSchoolSupportMessagePayload,
) {
  return apiPost<SchoolSupportMessage | { message?: SchoolSupportMessage }>(
    `${SCHOOL_SUPPORT_ENDPOINT}/messages`,
    payload,
  );
}

export function markSchoolSupportRead(
  payload?: MarkSchoolSupportReadPayload,
) {
  return apiPost<{ conversationId: string; readAt: string; markedCount: number }>(
    `${SCHOOL_SUPPORT_ENDPOINT}/read`,
    payload,
  );
}
