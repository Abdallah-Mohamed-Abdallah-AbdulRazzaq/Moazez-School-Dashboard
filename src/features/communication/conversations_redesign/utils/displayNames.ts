import type { Conversation } from "@/features/communication/types/conversation.types";
import type { ConversationListItemModel } from "@/features/communication/hooks/useConversations";
import type { CommunicationActor, CommunicationRecord } from "@/features/communication/types/communication.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { useAuth } from "@/hooks/use-auth";

export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}


export function actorName(actor?: CommunicationActor | null) {
  return actor?.displayName || actor?.name || actor?.nameEn || actor?.nameAr;
}

export function displayNameForUserId(
  userId: string | null | undefined,
  userDisplayNames: UserDisplayNameMap,
  fallback: string,
) {
  if (!userId) return fallback;
  return userDisplayNames[userId] || fallback;
}

export function addDisplayName(
  target: UserDisplayNameMap,
  ids: Array<string | null | undefined>,
  name: string | null | undefined,
) {
  const displayName = name?.trim();
  if (!displayName) return;

  ids.forEach((id) => {
    const key = id?.trim();
    if (key) target[key] = displayName;
  });
}


export function getAvatarUrl(
  value?: Conversation | ConversationListItemModel | CommunicationActor | null,
) {
  if (!value) return undefined;
  const record = value as CommunicationRecord;
  return (
    stringValue(record.avatarUrl) ||
    stringValue(record.avatar) ||
    stringValue(record.imageUrl) ||
    stringValue(record.photoUrl)
  );
}

/**
 * Returns the avatarFileId if present (for authenticated download).
 */
export function getAvatarFileId(
  value?: Conversation | ConversationListItemModel | CommunicationActor | null,
): string | undefined {
  if (!value) return undefined;
  const record = value as CommunicationRecord;
  return stringValue(record.avatarFileId);
}


export function currentUserName(
  user: ReturnType<typeof useAuth>["user"],
  labels: ConversationRedesignLabels,
) {
  if (!user) return "";
  return (
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.username ||
    user.email ||
    labels.you
  );
}
