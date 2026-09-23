import { useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { ArrowDown, RefreshCw } from "lucide-react";
import { CenteredState } from "@/features/communication/conversations_redesign/components/PanelLayout";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import { displayNameForUserId } from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  formatMessageDateSeparator,
  isOwnMessage,
  localDateKey,
  messageSenderUserId,
} from "@/features/communication/conversations_redesign/utils/formatters";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import type {
  MessageAttachment,
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";
import { MessageBubble } from "./MessageBubble";
import type { CommunicationMessageCapabilities } from "@/features/communication/authorization/communication-capabilities";
import type { SupportedModerationAction } from "@/features/communication/types/safety.types";

function preferredScrollBehavior(): "auto" | "smooth" {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export function MessagesPanel({
  allowActions = true,
  allowReactions,
  canDeleteMessages = true,
  canEditMessages = true,
  canManageAttachments = true,
  canReplyMessages = true,
  canReportMessages = true,
  attachmentsByMessageId,
  currentUserId,
  currentUserName,
  error,
  hasOlderMessages,
  isLoading,
  isLoadingOlder,
  labels,
  locale,
  messages,
  getMessageCapabilities,
  onAddReaction,
  onAttachFile,
  onDeleteAttachment,
  onDeleteMessage,
  onStartEdit,
  onLoadOlder,
  onVisibleMessageIdsChange,
  onInfo,
  onModerateMessage = async () => undefined,
  onRemoveReaction,
  onReply,
  onReport,
  onViewModerationHistory = () => undefined,
  onRetry,
  reactionsByMessageId,
  typingUsers,
  userDisplayNames,
  uploadingMessageId,
}: {
  allowActions?: boolean;
  allowReactions: boolean;
  canDeleteMessages?: boolean;
  canEditMessages?: boolean;
  canManageAttachments?: boolean;
  canReplyMessages?: boolean;
  canReportMessages?: boolean;
  attachmentsByMessageId: Record<string, MessageAttachment[]>;
  currentUserId?: string | null;
  currentUserName: string;
  error: string | null;
  hasOlderMessages: boolean;
  isLoading: boolean;
  isLoadingOlder: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  messages: ConversationMessage[];
  getMessageCapabilities?: (
    message: ConversationMessage,
  ) => CommunicationMessageCapabilities;
  onAddReaction: (messageId: string, type: ReactionType) => Promise<unknown>;
  onAttachFile: (messageId: string, file: File) => Promise<unknown>;
  onDeleteAttachment: (
    messageId: string,
    attachmentId: string,
  ) => Promise<unknown>;
  onDeleteMessage: (messageId: string) => Promise<unknown>;
  onStartEdit: (messageId: string, body: string) => void;
  onLoadOlder: () => void;
  onVisibleMessageIdsChange?: (messageIds: string[]) => void;
  onInfo: (messageId: string) => void;
  onModerateMessage?: (
    messageId: string,
    action: SupportedModerationAction,
    reason: string,
  ) => Promise<unknown>;
  onRemoveReaction: (messageId: string) => Promise<unknown>;
  onReply: (message: ConversationMessage) => void;
  onReport: (messageId: string) => void;
  onViewModerationHistory?: (messageId: string) => void;
  onRetry: () => void;
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  userDisplayNames: UserDisplayNameMap;
  uploadingMessageId: string | null;
}) {
  const listRef = useRef<VirtuosoHandle | null>(null);
  const isNearBottomRef = useRef(true);
  const messageSnapshotRef = useRef({
    lastId: messages.at(-1)?.id,
  });
  const [indexState, setIndexState] = useState({ messages, firstItemIndex: 1_000_000 });
  const loadingOlderRef = useRef(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const hasMessages = messages.length > 0;
  const listComponents = useMemo(() => ({
    EmptyPlaceholder: () => <CenteredState label={labels.noMessagesYetFull} />,
    Header: () => isLoadingOlder ? (
      <div className="flex justify-center py-3 text-xs text-slate-500">{labels.loading}</div>
    ) : !hasOlderMessages && hasMessages ? (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">{labels.endOfConversation}</span>
      </div>
    ) : null,
  }), [hasOlderMessages, hasMessages, isLoadingOlder, labels]);

  let firstItemIndex = indexState.firstItemIndex;
  if (indexState.messages !== messages) {
    const previous = indexState.messages;
    const oldFirstIndex = previous.length > 0 && messages[0]?.id !== previous[0]?.id
      ? messages.findIndex((message) => message.id === previous[0]?.id)
      : 0;
    if (oldFirstIndex > 0) firstItemIndex -= oldFirstIndex;
    setIndexState({ messages, firstItemIndex });
  }

  useEffect(() => {
    const previous = messageSnapshotRef.current;
    const current = {
      lastId: messages.at(-1)?.id,
    };
    const previousLastIndex = previous.lastId
      ? messages.findIndex((message) => message.id === previous.lastId)
      : -1;
    const appendedCount = previousLastIndex >= 0
      ? messages.length - previousLastIndex - 1
      : 0;
    if (appendedCount > 0) {
      const ownMessageWasAppended = messages
        .slice(-appendedCount)
        .some((message) => isOwnMessage(message, currentUserId));
      if (isNearBottomRef.current || ownMessageWasAppended) {
        listRef.current?.scrollToIndex({ index: firstItemIndex + messages.length - 1, align: "end", behavior: preferredScrollBehavior() });
        queueMicrotask(() => setNewMessageCount(0));
      } else {
        queueMicrotask(() => setNewMessageCount((count) => count + appendedCount));
      }
    }
    messageSnapshotRef.current = current;
  }, [currentUserId, firstItemIndex, messages]);

  useEffect(() => {
    loadingOlderRef.current = isLoadingOlder;
  }, [isLoadingOlder]);

  const scrollToLatest = () => {
    listRef.current?.scrollToIndex({ index: firstItemIndex + messages.length - 1, align: "end", behavior: preferredScrollBehavior() });
    isNearBottomRef.current = true;
    setNewMessageCount(0);
  };

  if (isLoading) {
    return <CenteredState isLoading label={labels.loadingMessages} />;
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <CommunicationErrorState
          message={error}
          action={
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {labels.retry}
            </button>
          }
        />
      </div>
    );
  }

  const newMessagesLabel =
    newMessageCount === 1
      ? labels.newMessage
      : labels.newMessages.replace("{count}", String(newMessageCount));

  return (
    <div dir="ltr" className="relative h-full">
      <Virtuoso
        ref={listRef}
        role="log"
        aria-label={labels.messages}
        dir="ltr"
        className="h-full px-1.5 py-5 sm:py-8"
        data={messages}
        defaultItemHeight={80}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={messages.length - 1}
        computeItemKey={(_index, message) => message.clientMessageId ?? message.id}
        atBottomStateChange={(atBottom) => {
          isNearBottomRef.current = atBottom;
          if (atBottom) setNewMessageCount(0);
        }}
        startReached={() => {
          if (hasOlderMessages && !loadingOlderRef.current && messages.length > 0) {
            loadingOlderRef.current = true;
            onLoadOlder();
          }
        }}
        rangeChanged={({ startIndex, endIndex }) => {
          const offset = startIndex >= firstItemIndex ? firstItemIndex : 0;
          const visibleIds = messages.slice(startIndex - offset, endIndex - offset + 1).map((message) => message.id);
          onVisibleMessageIdsChange?.(visibleIds);
        }}
        components={listComponents}
        itemContent={(index, message) => {
            const localIndex = index >= firstItemIndex ? index - firstItemIndex : index;
            const own = isOwnMessage(message, currentUserId);
            const messageDateKey = localDateKey(message.createdAt);
            const previousMessageDateKey = localDateKey(
              messages[localIndex - 1]?.createdAt,
            );
            const shouldShowDateSeparator =
              Boolean(messageDateKey) &&
              messageDateKey !== previousMessageDateKey;

            // Group consecutive messages from the same sender
            const prevMessage = messages[localIndex - 1];
            const prevSenderId = prevMessage
              ? messageSenderUserId(prevMessage)
              : null;
            const currentSenderId = messageSenderUserId(message);
            const isFirstInGroup =
              !prevMessage ||
              prevSenderId !== currentSenderId ||
              shouldShowDateSeparator;

            return (
              <div className="flex flex-col gap-0.5 pb-0.5">
                {shouldShowDateSeparator ? (
                  <div className="self-center rounded-full bg-slate-200 px-4 py-1 text-xs font-medium text-slate-700">
                    {formatMessageDateSeparator(
                      message.createdAt,
                      locale,
                      labels,
                    )}
                  </div>
                ) : null}
                <MessageBubble
                  allowActions={allowActions}
                  allowReactions={allowReactions}
                  canDeleteMessages={canDeleteMessages}
                  canEditMessages={canEditMessages}
                  canManageAttachments={canManageAttachments}
                  canReplyMessages={canReplyMessages}
                  canReportMessages={canReportMessages}
                  attachments={
                    attachmentsByMessageId[message.id] ??
                    message.attachments ??
                    []
                  }
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  isFirstInGroup={isFirstInGroup}
                  isOwn={own}
                  isUploadingAttachment={uploadingMessageId === message.id}
                  labels={labels}
                  locale={locale}
                  message={message}
                  capabilities={getMessageCapabilities?.(message)}
                  onAddReaction={(type: ReactionType) =>
                    onAddReaction(message.id, type)
                  }
                  onAttachFile={(file) => onAttachFile(message.id, file)}
                  onDeleteAttachment={(attachmentId) =>
                    onDeleteAttachment(message.id, attachmentId)
                  }
                  onDeleteMessage={() => onDeleteMessage(message.id)}
                  onStartEdit={() =>
                    onStartEdit(message.id, message.body ?? "")
                  }
                  onInfo={(msgId) => onInfo(msgId)}
                  onModerateMessage={(action, reason) =>
                    onModerateMessage(message.id, action, reason)
                  }
                  onRemoveReaction={() => onRemoveReaction(message.id)}
                  onReply={(msg) => onReply(msg)}
                  onReport={(msgId) => onReport(msgId)}
                  onViewModerationHistory={onViewModerationHistory}
                  allMessages={messages}
                  reactions={reactionsByMessageId[message.id] ?? []}
                  userDisplayNames={userDisplayNames}
                />
              </div>
            );
          }}
      />

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="min-h-5 text-xs italic text-slate-500"
          >
            {typingUsers.length > 0 ? (
              <span className="flex items-center gap-2">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
                </span>
                <span>
                  {typingUsers
                    .map(
                      (user) =>
                        user.name ||
                        displayNameForUserId(
                          user.userId,
                          userDisplayNames,
                          labels.someone,
                        ),
                    )
                    .join(", ")}{" "}
                  {labels.typing}
                </span>
              </span>
            ) : null}
          </div>
      {newMessageCount > 0 ? (
        <button
          type="button"
          onClick={scrollToLatest}
          aria-label={newMessagesLabel}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 shadow-md transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          {newMessagesLabel}
        </button>
      ) : null}
    </div>
  );
}
