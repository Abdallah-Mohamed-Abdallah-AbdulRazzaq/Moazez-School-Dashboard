import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type {
  Message,
  MessageStatus,
} from "@/features/communication/types/message.types";
import { normalizeStatus } from "@/features/communication/utils/communication-errors";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function normalizedMessageStatus(value: unknown): MessageStatus | undefined {
  const status = normalizeStatus(typeof value === "string" ? value : undefined);
  return status === "sent" || status === "hidden" || status === "deleted"
    ? status
    : undefined;
}

export function messageFromRealtimePayload(payload: unknown): Message | null {
  if (!isRecord(payload)) return null;
  const source =
    [payload.message, payload.data, payload.payload].find(isRecord) ?? payload;
  if (!isRecord(source)) return null;

  const id = nonEmptyString(source.id);
  if (!id) return null;

  const message = { ...(source as Message), id };
  const conversationId =
    nonEmptyString(source.conversationId) ??
    nonEmptyString(payload.conversationId);
  if (conversationId) message.conversationId = conversationId;

  const body = [source.body, source.content, source.text].find(
    (value): value is string => typeof value === "string",
  );
  if (body !== undefined) message.body = body;

  const status = normalizedMessageStatus(source.status);
  if (status) message.status = status;
  else delete message.status;

  return message;
}
