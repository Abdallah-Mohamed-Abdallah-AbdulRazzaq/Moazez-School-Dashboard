import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
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

function preferredScrollBehavior(): ScrollBehavior {
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
  onAddReaction,
  onAttachFile,
  onDeleteAttachment,
  onDeleteMessage,
  onStartEdit,
  onLoadOlder,
  onInfo,
  onRemoveReaction,
  onReply,
  onReport,
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
  onAddReaction: (messageId: string, type: ReactionType) => Promise<unknown>;
  onAttachFile: (messageId: string, file: File) => Promise<unknown>;
  onDeleteAttachment: (
    messageId: string,
    attachmentId: string,
  ) => Promise<unknown>;
  onDeleteMessage: (messageId: string) => Promise<unknown>;
  onStartEdit: (messageId: string, body: string) => void;
  onLoadOlder: () => void;
  onInfo: (messageId: string) => void;
  onRemoveReaction: (messageId: string) => Promise<unknown>;
  onReply: (message: ConversationMessage) => void;
  onReport: (messageId: string) => void;
  onRetry: () => void;
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  userDisplayNames: UserDisplayNameMap;
  uploadingMessageId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);
  const messageSnapshotRef = useRef({
    count: messages.length,
    firstId: messages[0]?.id,
    lastId: messages.at(-1)?.id,
  });
  const loadOlderSnapshotRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const wasLoadingOlderRef = useRef(isLoadingOlder);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Scroll to bottom on initial load and when new messages arrive at the bottom
  // The unread jump control depends on measured scroll position, which is not
  // available during render.
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const previous = messageSnapshotRef.current;
    const current = {
      count: messages.length,
      firstId: messages[0]?.id,
      lastId: messages.at(-1)?.id,
    };

    if (isInitialLoadRef.current) {
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
    } else {
      const wasPrepended =
        Boolean(previous.firstId) &&
        current.firstId !== previous.firstId &&
        current.lastId === previous.lastId;
      const appendedCount =
        current.lastId !== previous.lastId && current.count > previous.count
          ? current.count - previous.count
          : 0;
      const ownMessageWasAppended =
        appendedCount > 0 &&
        messages
          .slice(-appendedCount)
          .some((message) => isOwnMessage(message, currentUserId));

      if (wasPrepended && loadOlderSnapshotRef.current) {
        const snapshot = loadOlderSnapshotRef.current;
        container.scrollTop =
          snapshot.scrollTop + container.scrollHeight - snapshot.scrollHeight;
        loadOlderSnapshotRef.current = null;
      } else if (
        appendedCount > 0 &&
        (isNearBottomRef.current || ownMessageWasAppended)
      ) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: preferredScrollBehavior(),
        });
        setNewMessageCount(0);
      } else if (appendedCount > 0) {
        setNewMessageCount((count) => count + appendedCount);
      }
    }

    messageSnapshotRef.current = current;
  }, [currentUserId, messages]);

  useEffect(() => {
    if (wasLoadingOlderRef.current && !isLoadingOlder) {
      loadOlderSnapshotRef.current = null;
    }
    wasLoadingOlderRef.current = isLoadingOlder;
  }, [isLoadingOlder]);

  // Detect scroll to top for loading older messages
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = distanceFromBottom < 120;
      if (isNearBottomRef.current) {
        setNewMessageCount(0);
      }

      if (
        container.scrollTop < 100 &&
        hasOlderMessages &&
        !isLoadingOlder &&
        !loadOlderSnapshotRef.current
      ) {
        loadOlderSnapshotRef.current = {
          scrollHeight: container.scrollHeight,
          scrollTop: container.scrollTop,
        };
        onLoadOlder();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasOlderMessages, isLoadingOlder, onLoadOlder]);

  const scrollToLatest = () => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: preferredScrollBehavior(),
    });
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
      <div
        ref={scrollRef}
        role="log"
        aria-label={labels.messages}
        aria-live="polite"
        aria-relevant="additions"
        dir="ltr"
        className="h-full overflow-y-auto px-1.5 py-5 sm:py-8"
      >
        <div className="flex min-h-full flex-col gap-0.5">
          {/* Loading older messages indicator */}
          {isLoadingOlder ? (
            <div className="flex justify-center py-3">
              <span className="text-xs text-slate-500">{labels.loading}</span>
            </div>
          ) : null}

          {!hasOlderMessages && messages.length > 0 ? (
            <div className="flex justify-center py-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
                {labels.endOfConversation}
              </span>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <CenteredState label={labels.noMessagesYetFull} />
          ) : null}

          {messages.map((message, index) => {
            const own = isOwnMessage(message, currentUserId);
            const messageDateKey = localDateKey(message.createdAt);
            const previousMessageDateKey = localDateKey(
              messages[index - 1]?.createdAt,
            );
            const shouldShowDateSeparator =
              Boolean(messageDateKey) &&
              messageDateKey !== previousMessageDateKey;

            // Group consecutive messages from the same sender
            const prevMessage = messages[index - 1];
            const prevSenderId = prevMessage
              ? messageSenderUserId(prevMessage)
              : null;
            const currentSenderId = messageSenderUserId(message);
            const isFirstInGroup =
              !prevMessage ||
              prevSenderId !== currentSenderId ||
              shouldShowDateSeparator;

            return (
              <Fragment key={message.clientMessageId ?? message.id}>
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
                  onRemoveReaction={() => onRemoveReaction(message.id)}
                  onReply={(msg) => onReply(msg)}
                  onReport={(msgId) => onReport(msgId)}
                  allMessages={messages}
                  reactions={reactionsByMessageId[message.id] ?? []}
                  userDisplayNames={userDisplayNames}
                />
              </Fragment>
            );
          })}

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
        </div>
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
