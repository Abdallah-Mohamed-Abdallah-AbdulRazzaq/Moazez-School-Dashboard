"use client";

import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import ConversationListItem, {
  type ConversationListItemLabels,
} from "./ConversationListItem";
import type { ConversationListItemModel } from "@/features/communication/hooks/useConversations";

export interface ConversationListProps {
  conversations: ConversationListItemModel[];
  emptyTitle: string;
  emptyDescription: string;
  labels: ConversationListItemLabels;
  onEdit: (conversation: ConversationListItemModel) => void;
  onClose: (conversationId: string) => void;
  onReopen: (conversationId: string) => void;
  onArchive: (conversationId: string) => void;
  disabled?: boolean;
}

export default function ConversationList({
  conversations,
  disabled,
  emptyDescription,
  emptyTitle,
  labels,
  onArchive,
  onClose,
  onEdit,
  onReopen,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <CommunicationEmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          labels={labels}
          onEdit={onEdit}
          onClose={onClose}
          onReopen={onReopen}
          onArchive={onArchive}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
