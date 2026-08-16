import {
  type ChangeEvent,
  type ComponentType,
  Fragment,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Angry,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  CornerUpLeft,
  Edit3,
  FileText,
  Flag,
  Frown,
  Heart,
  Info,
  Laugh,
  Mic,
  Paperclip,
  Send,
  Smile,
  SmilePlus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import type { ReactionType } from "@/features/communication/types/message.types";
import EmojiPicker, { type EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";
import Input from "@/components/ui/input/Input";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { CenteredState } from "@/features/communication/conversations_redesign/components/PanelLayout";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import type { MessageAttachment, MessageReaction } from "@/features/communication/types/message.types";
import {
  actorName,
  displayNameForUserId,
  getAvatarUrl,
} from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  formatFileSize,
  formatMessageDateSeparator,
  formatTime,
  isOwnMessage,
  localDateKey,
  messageSenderUserId,
} from "@/features/communication/conversations_redesign/utils/formatters";

/* ==================================================================
 * MessagesPanel.tsx — Components Table of Contents
 * ==================================================================
 * 1. REACTION_OPTIONS (constant)
 * 2. MessagesPanel (exported) — main scrollable message list
 * 3. MessageBubble — individual message bubble with actions
 * 4. BubbleContextMenu — chevron dropdown (edit, delete, copy, reply, report)
 * 5. FloatingReactionBar — emoji reaction picker (smiley trigger + bar)
 * 6. AttachmentCard — file attachment display with download
 * 7. MessageStatusIcon — WhatsApp-style check marks
 * 8. MessageComposer (exported) — input with files, voice, emoji, reply, edit
 * 9. ReadOnlyComposer (exported) — read-only placeholder
 * 10. EmojiPickerButton — emoji picker popover for composer
 * ================================================================== */

/* ------------------------------------------------------------------ */
/* Reaction picker options                                             */
/* ------------------------------------------------------------------ */

const REACTION_OPTIONS: {
  type: ReactionType;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  color: string;
}[] = [
  { type: "thumbs_up", icon: ThumbsUp, label: "👍 Thumbs Up", color: "text-blue-600" },
  { type: "love", icon: Heart, label: "❤️ Love", color: "text-rose-500" },
  { type: "laugh", icon: Laugh, label: "😂 Laugh", color: "text-amber-500" },
  { type: "wow", icon: SmilePlus, label: "😮 Wow", color: "text-amber-600" },
  { type: "sad", icon: Frown, label: "😢 Sad", color: "text-indigo-500" },
  { type: "angry", icon: Angry, label: "😡 Angry", color: "text-red-600" },
  { type: "thumbs_down", icon: ThumbsDown, label: "👎 Thumbs Down", color: "text-slate-600" },
  { type: "like", icon: ThumbsUp, label: "👍 Like", color: "text-blue-500" },
];

export function MessagesPanel({
  allowReactions,
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
  reactionsByMessageId,
  typingUsers,
  userDisplayNames,
  uploadingMessageId,
}: {
  allowReactions: boolean;
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
  onEditMessage: (messageId: string, body: string) => Promise<unknown>;
  onStartEdit: (messageId: string, body: string) => void;
  onLoadOlder: () => void;
  onInfo: (messageId: string) => void;
  onRemoveReaction: (messageId: string) => Promise<unknown>;
  onReply: (message: ConversationMessage) => void;
  onReport: (messageId: string) => void;
  reactionsByMessageId: Record<string, MessageReaction[]>;
  typingUsers: Array<{ userId: string; name?: string }>;
  userDisplayNames: UserDisplayNameMap;
  uploadingMessageId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  const [isScrollReady, setIsScrollReady] = useState(false);

  // Scroll to bottom on initial load and when new messages arrive at the bottom
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;

    if (isInitialLoadRef.current) {
      // Initial load — scroll to bottom immediately
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      prevMessageCountRef.current = messages.length;
      // Show content after scroll is positioned
      setIsScrollReady(true);
      return;
    }

    // If messages were added at the bottom (new message), scroll to bottom
    if (messages.length > prevMessageCountRef.current) {
      const wasNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (wasNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Detect scroll to top for loading older messages
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasOlderMessages && !isLoadingOlder) {
        onLoadOlder();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasOlderMessages, isLoadingOlder, onLoadOlder]);

  // Preserve scroll position when older messages are prepended
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    // If scroll is at the very top after prepend, nudge it down to show new content
    if (container.scrollTop === 0 && messages.length > 0 && !isInitialLoadRef.current) {
      // The browser will have already adjusted; we just need to not auto-scroll to bottom
    }
  }, [messages]);

  if (isLoading) {
    return <CenteredState label={labels.loadingMessages} />;
  }

  if (error) {
    return <CenteredState label={error} />;
  }

  return (
    <div ref={scrollRef} className={`h-full overflow-y-auto px-4 py-8 ${isScrollReady ? "opacity-100" : "opacity-0"}`}>
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-0.5">
        {/* Loading older messages indicator */}
        {isLoadingOlder ? (
          <div className="flex justify-center py-3">
            <span className="text-xs text-slate-500">{labels.loading}</span>
          </div>
        ) : null}

        {!hasOlderMessages && messages.length > 0 ? (
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
              {labels.noMessagesYet}
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
            Boolean(messageDateKey) && messageDateKey !== previousMessageDateKey;

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
                  {formatMessageDateSeparator(message.createdAt, locale, labels)}
                </div>
              ) : null}
              <MessageBubble
                allowReactions={allowReactions}
                attachments={
                  attachmentsByMessageId[message.id] ?? message.attachments ?? []
                }
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isFirstInGroup={isFirstInGroup}
                isOwn={own}
                isUploadingAttachment={uploadingMessageId === message.id}
                labels={labels}
                locale={locale}
                message={message}
                onAddReaction={(type: ReactionType) => onAddReaction(message.id, type)}
                onAttachFile={(file) => onAttachFile(message.id, file)}
                onDeleteAttachment={(attachmentId) =>
                  onDeleteAttachment(message.id, attachmentId)
                }
                onDeleteMessage={() => onDeleteMessage(message.id)}
                onStartEdit={() => onStartEdit(message.id, message.body ?? "")}
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

        {typingUsers.length > 0 ? (
          <div className="flex items-center gap-2 text-xs italic text-slate-500">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            </span>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({
  allowReactions,
  attachments,
  currentUserId,
  currentUserName,
  isFirstInGroup,
  isOwn,
  isUploadingAttachment,
  labels,
  locale,
  message,
  onAddReaction,
  onAttachFile,
  onDeleteAttachment,
  onDeleteMessage,
  onStartEdit,
  onInfo,
  onRemoveReaction,
  onReply,
  onReport,
  allMessages,
  reactions,
  userDisplayNames,
}: {
  allowReactions: boolean;
  attachments: MessageAttachment[];
  currentUserId?: string | null;
  currentUserName: string;
  isFirstInGroup: boolean;
  isOwn: boolean;
  isUploadingAttachment: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  message: ConversationMessage;
  onAddReaction: (type: ReactionType) => Promise<unknown>;
  onAttachFile: (file: File) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: string) => Promise<unknown>;
  onDeleteMessage: () => Promise<unknown>;
  onStartEdit: () => void;
  onInfo: (messageId: string) => void;
  onRemoveReaction: () => Promise<unknown>;
  onReply: (message: ConversationMessage) => void;
  onReport: (messageId: string) => void;
  allMessages: ConversationMessage[];
  reactions: MessageReaction[];
  userDisplayNames: UserDisplayNameMap;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const senderName = isOwn
    ? currentUserName || labels.you
    : actorName(message.sender) ||
      displayNameForUserId(
        messageSenderUserId(message),
        userDisplayNames,
        labels.participant,
      );
  const avatar = getAvatarUrl(message.sender);
  const groupedReactions = reactions.reduce<Record<string, MessageReaction[]>>(
    (groups, reaction) => {
      const key = reaction.type || "like";
      return { ...groups, [key]: [...(groups[key] ?? []), reaction] };
    },
    {},
  );
  const edited = Boolean(
    message.updatedAt && message.updatedAt !== message.createdAt,
  );
  const deleted = message.status === "deleted";
  const canMutateMessage =
    isOwn &&
    !deleted &&
    message.deliveryStatus !== "pending" &&
    message.deliveryStatus !== "failed";
  const readByOthersCount = (message.readByUserIds ?? []).filter(
    (id) => id !== currentUserId,
  ).length;
  // For own messages: only show blue checks when someone ELSE has read it
  // For others' messages: not applicable (checks only show on own messages)
  // readByOthersCount comes from realtime events (explicit other-user reads)
  // message.readCount from API includes self-reads, so for own messages we subtract 1
  const apiReadByOthers = typeof message.readCount === "number"
    ? Math.max(0, message.readCount - 1)
    : 0;
  const isRead = isOwn
    ? readByOthersCount > 0 || apiReadByOthers > 0
    : false;

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await onAttachFile(file);
  };

  const handleDelete = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(labels.deleteMessageConfirm)
    )
      return;
    setIsActionPending(true);
    try {
      await onDeleteMessage();
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      await onAddReaction(type);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRemoveReaction = async () => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      await onRemoveReaction();
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <article
      className={`group flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-4" : "mt-0.5"}`}
    >
      {!isOwn ? (
        isFirstInGroup ? (
          <Avatar avatarUrl={avatar} name={senderName} size="sm" />
        ) : (
          <div className="w-8 shrink-0" />
        )
      ) : null}

      <div
        className={`relative flex max-w-[78vw] flex-col md:max-w-[560px] ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn && isFirstInGroup ? (
          <div className="mb-1 ms-1 text-xs font-medium text-slate-600">
            {senderName}
          </div>
        ) : null}

        {/* Bubble */}
        <div
          className={`relative min-w-0 rounded-2xl px-2.5 py-1.5 shadow-sm ${
            isOwn
              ? `${isFirstInGroup? "rounded-ee-md": "" } bg-primary text-white`
              : `${isFirstInGroup? "rounded-es-md": "" } border border-slate-200 bg-white text-slate-950`
          }`}
        >
          {/* Chevron dropdown — appears on hover at top-end corner */}
          {!deleted ? (
            <BubbleContextMenu
              allowReactions={allowReactions}
              canEdit={canMutateMessage}
              canDelete={canMutateMessage}
              isOwn={isOwn}
              labels={labels}
              messageBody={message.body}
              onAddReaction={handleReaction}
              onCopy={() => {
                if (message.body) {
                  void navigator.clipboard.writeText(message.body);
                }
              }}
              onDelete={() => void handleDelete()}
              onEdit={() => onStartEdit()}
              onInfo={() => onInfo(message.id)}
              onReply={() => onReply(message)}
              onReport={() => onReport(message.id)}
            />
          ) : null}

          {/* Reaction trigger button — smiley face beside the bubble */}
          {allowReactions && !deleted ? (
            <FloatingReactionBar
              isOwn={isOwn}
              isActionPending={isActionPending}
              onReact={handleReaction}
            />
          ) : null}

          {message.replyToMessageId ? (() => {
            const originalMsg = allMessages.find((m) => m.id === message.replyToMessageId);
            const originalSender = originalMsg
              ? (originalMsg.sender?.name as string) ||
                displayNameForUserId(
                  messageSenderUserId(originalMsg),
                  userDisplayNames,
                  labels.someone,
                )
              : labels.someone;
            const originalBody = originalMsg?.body || "...";
            return (
              <div className={`mb-2 rounded-lg overflow-hidden ${
                isOwn ? "bg-primary-700/30" : "bg-slate-100"
              }`}>
                <div className={`border-s-4 px-3 py-2 ${
                  isOwn ? "border-s-white/60" : "border-s-primary"
                }`}>
                  <p className={`text-xs font-bold ${isOwn ? "text-white/90" : "text-primary"}`}>
                    {originalSender}
                  </p>
                  <p className={`mt-0.5 line-clamp-3 text-xs leading-relaxed ${isOwn ? "text-white/70" : "text-slate-600"}`}>
                    {originalBody}
                  </p>
                </div>
              </div>
            );
          })() : null}

          <p className="overflow-hidden whitespace-pre-wrap break-all text-sm leading-6">
            {deleted ? labels.messageDeleted : message.body}
          </p>

          {attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  canDelete={canMutateMessage}
                  isOwn={isOwn}
                  labels={labels}
                  onDelete={() => onDeleteAttachment(attachment.id)}
                />
              ))}
            </div>
          ) : null}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOwn ? "text-white/80" : "text-slate-400"}`}
          >
            {edited ? <span>{labels.edited}</span> : null}
            <span className="italic mt-auto">{formatTime(message.createdAt, locale)}</span>
            {isOwn ? (
              <MessageStatusIcon
                deliveryStatus={message.deliveryStatus}
                isRead={isRead}
                isOwn={isOwn}
              />
            ) : null}
          </div>
        </div>

        {/* Reaction badges at bottom-corner of bubble */}
        {Object.keys(groupedReactions).length > 0 ? (
          <div className={`mt-1 flex flex-wrap items-center gap-0.5`}>
            {Object.entries(groupedReactions).map(([type, items]) => {
              const meta = REACTION_OPTIONS.find((r) => r.type === type);
              const Icon = meta?.icon ?? ThumbsUp;
              const isOwnType = items.some(
                (r) =>
                  r.userId === currentUserId ||
                  r.actor?.userId === currentUserId ||
                  r.actor?.id === currentUserId,
              );
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    void (isOwnType
                      ? handleRemoveReaction()
                      : handleReaction(type as ReactionType))
                  }
                  disabled={isActionPending || !allowReactions}
                  className={`inline-flex h-5 items-center gap-0.5 rounded-full border px-1.5 text-[10px] shadow-sm transition disabled:opacity-60 ${
                    isOwnType
                      ? "border-primary-200 bg-primary-50 text-primary"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  title={meta?.label ?? type}
                >
                  <Icon className="h-2.5 w-2.5" aria-hidden />
                  <span>{items.length}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {isUploadingAttachment ? (
          <span className="mt-1 text-xs text-slate-500">
            {labels.uploadingAttachment}
          </span>
        ) : null}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        fullWidth={false}
        onChange={(event) => void handleAttach(event)}
      />
    </article>
  );
}

function BubbleContextMenu({
  allowReactions,
  canEdit,
  canDelete,
  isOwn,
  labels,
  messageBody,
  onAddReaction,
  onCopy,
  onDelete,
  onEdit,
  onInfo,
  onReply,
  onReport,
}: {
  allowReactions: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isOwn: boolean;
  labels: ConversationRedesignLabels;
  messageBody?: string;
  onAddReaction: (type: ReactionType) => Promise<unknown>;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onInfo: () => void;
  onReply: () => void;
  onReport: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    open,
    placement: isOwn ? "bottom-start" : "bottom-end",
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ["top-start", "top-end", "bottom"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const { setReference, setFloating } = refs;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`absolute top-1 z-30 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "start-1" : "end-1"}`}
    >
      <button
        ref={setReference}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${
          isOwn
            ? "bg-primary text-white/90"
            : "bg-white text-slate-400"
        }`}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div
          ref={setFloating}
          style={floatingStyles}
          className="z-50 min-w-[150px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {/* Reply */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReply();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            <CornerUpLeft className="h-3.5 w-3.5" />
            {labels.reply}
          </button>
          {/* Copy */}
          {messageBody ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCopy();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" />
              {labels.copy}
            </button>
          ) : null}
          {/* React */}
          {allowReactions ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void onAddReaction("thumbs_up");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Smile className="h-3.5 w-3.5" />
              {labels.like}
            </button>
          ) : null}
          {/* Edit (own messages only) */}
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {labels.editMessage}
            </button>
          ) : null}
          {/* Report (other's messages only) */}
          {!isOwn ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-amber-600 hover:bg-amber-50"
            >
              <Flag className="h-3.5 w-3.5" />
              {labels.report}
            </button>
          ) : null}
          {/* Info / Read by (own messages only) */}
          {isOwn ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onInfo();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Info className="h-3.5 w-3.5" />
              {labels.messageInfo}
            </button>
          ) : null}
          {/* Delete (own messages only) */}
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {labels.deleteMessage}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating Reaction Bar (uses @floating-ui for edge-aware positioning) */
/* ------------------------------------------------------------------ */

import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";

function FloatingReactionBar({
  isOwn,
  isActionPending,
  onReact,
}: {
  isOwn: boolean;
  isActionPending: boolean;
  onReact: (type: ReactionType) => Promise<unknown>;
}) {
  const [showBar, setShowBar] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    open: showBar,
    placement: "top",
    middleware: [
      offset(6),
      flip({ fallbackPlacements: ["bottom", "top-start", "top-end"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const { setReference, setFloating } = refs;

  useEffect(() => {
    if (!showBar && !showFullPicker) return;
    const handleClickOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowBar(false);
        setShowFullPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBar, showFullPicker]);

  const quickReactions: { emoji: string; type: ReactionType }[] = [
    { emoji: "👍", type: "thumbs_up" },
    { emoji: "❤️", type: "love" },
    { emoji: "😂", type: "laugh" },
    { emoji: "😮", type: "wow" },
    { emoji: "😢", type: "sad" },
    { emoji: "🙏", type: "like" },
  ];

  return (
    <div ref={containerRef} className={`absolute bottom-1 z-30 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "start-[-36px]" : "end-[-36px]"}`}>
      {/* Smiley trigger button */}
      <button
        ref={setReference}
        type="button"
        onClick={() => setShowBar((prev) => !prev)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-600"
      >
        <Smile className="h-4 w-4" />
      </button>

      {/* Reaction bar popover */}
      {showBar ? (
        <div
          ref={setFloating}
          style={floatingStyles}
          className="z-50"
        >
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lg">
            {quickReactions.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  void onReact(item.type);
                  setShowBar(false);
                }}
                disabled={isActionPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xl transition hover:scale-125 hover:bg-slate-100 disabled:opacity-60"
              >
                {item.emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowFullPicker((prev) => !prev)}
              disabled={isActionPending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-slate-500 transition hover:scale-110 hover:bg-slate-100"
            >
              +
            </button>
          </div>
          {showFullPicker ? (
            <div className="absolute top-full z-50 mt-1 end-0">
              <EmojiPicker
                onEmojiClick={() => {
                  setShowFullPicker(false);
                  setShowBar(false);
                  void onReact("thumbs_up");
                }}
                emojiStyle={EmojiStyle.NATIVE}
                theme={Theme.LIGHT}
                width={320}
                height={350}
                lazyLoadEmojis
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AttachmentCard({
  attachment,
  canDelete,
  isOwn,
  labels,
  onDelete,
}: {
  attachment: MessageAttachment;
  canDelete: boolean;
  isOwn: boolean;
  labels: ConversationRedesignLabels;
  onDelete: () => Promise<unknown>;
}) {
  const file = attachment.file;
  const name =
    attachment.name ||
    file?.originalName ||
    file?.filename ||
    (file as Record<string, unknown> | undefined)?.displayName as string ||
    attachment.url?.split("/").pop() ||
    labels.attachment;
  const size = formatFileSize(
    attachment.size ||
    file?.size ||
    (file as Record<string, unknown> | undefined)?.sizeBytes as string | undefined,
  );
  const fileId = attachment.fileId || file?.id;
  const href = attachment.url || file?.url || (fileId ? `${process.env.NEXT_PUBLIC_API_URL || "https://api.moazez.sa/api/v1"}/files/${fileId}/download` : undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      typeof window !== "undefined" &&
      !window.confirm(labels.deleteAttachmentConfirm)
    )
      return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      const { apiClient: client } = await import("@/lib/api");
      // Fetch the file as a blob (axios follows the 307 redirect to S3)
      const response = await client.get(`/files/${fileId}/download`, {
        responseType: "blob",
      });
      // Create a download link from the blob
      const blob = new Blob([response.data as BlobPart]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open the URL directly (might work for public files)
      if (href) window.open(href, "_blank");
    }
  };

  const content = (
    <div
      className={`flex items-center gap-3 rounded-lg p-3 mb-2 ${
        isOwn ? "bg-primary-700/50" : "bg-slate-100"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isOwn ? "bg-primary-400" : "bg-white"}`}
      >
        <FileText
          className={`h-5 w-5 ${isOwn ? "text-white" : "text-primary"}`}
        />
      </span>
      <span className="max-w-[150px]">
        <span className="block truncate text-sm font-bold">{name}</span>
        {size ? <span className="block text-xs opacity-85">{size}</span> : null}
      </span>
      {fileId ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleDownload();
          }}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
            isOwn
              ? "text-white/80 hover:bg-white/10"
              : "text-primary hover:bg-primary/10"
          }`}
          aria-label="Download"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={(event) => void handleDelete(event)}
          disabled={isDeleting}
          className={`ms-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:opacity-60 ${
            isOwn
              ? "text-white/80 hover:bg-white/10"
              : "text-rose-700 hover:bg-rose-50"
          }`}
          aria-label={labels.deleteAttachmentConfirm}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  return content;
}

/* ------------------------------------------------------------------ */
/* Message status checks (WhatsApp-style)                              */
/* ------------------------------------------------------------------ */

function MessageStatusIcon({
  deliveryStatus,
  isRead,
  isOwn,
}: {
  deliveryStatus?: string;
  isRead: boolean;
  isOwn: boolean;
}) {
  if (!isOwn) return null;

  // Pending — clock icon
  if (deliveryStatus === "pending") {
    return <Clock className="h-3.5 w-3.5" style={{ opacity: 0.6 , marginTop: "auto", marginBottom: "4px"}} />;
  }

  // Failed — red indicator
  if (deliveryStatus === "failed") {
    return (
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full mt-auto mb-1 bg-red-500 text-[8px] font-bold text-white">
        !
      </span>
    );
  }

  // Read — double blue check (override parent color)
  if (isRead) {
    return <CheckCheck className="h-4 w-4" style={{ color: "#38bdf8" ,marginTop: "auto", marginBottom: "4px"}} />;
  }

  // Sent/delivered — double check (visible on both light and dark backgrounds)
  return <CheckCheck className="h-4 w-4" style={{ opacity: 0.7 , marginTop: "auto", marginBottom: "4px"}} />;
}

export function MessageComposer({
  disabled,
  editingMessage,
  labels,
  maxLength,
  onCancelEdit,
  onCancelReply,
  onEditMessage,
  onSend,
  onSendWithAttachment,
  onStopTyping,
  onTyping,
  replyTo,
}: {
  disabled: boolean;
  editingMessage: { id: string; body: string } | null;
  labels: ConversationRedesignLabels;
  maxLength?: number;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  onEditMessage: (messageId: string, body: string) => Promise<unknown>;
  onSend: (body: string) => Promise<unknown>;
  onSendWithAttachment: (files: File[], caption: string) => Promise<unknown>;
  onStopTyping: () => void;
  onTyping: () => void;
  replyTo: { id: string; senderName: string; body: string } | null;
}) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When editingMessage changes, populate the composer with the message body
  const prevEditIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (editingMessage && editingMessage.id !== prevEditIdRef.current) {
      setBody(editingMessage.body);
      prevEditIdRef.current = editingMessage.id;
    }
    if (!editingMessage) {
      prevEditIdRef.current = null;
    }
  }, [editingMessage]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || disabled) return;

    // Edit mode — save the edited message
    if (editingMessage) {
      const trimmed = body.trim();
      if (!trimmed || trimmed === editingMessage.body.trim()) {
        onCancelEdit();
        return;
      }
      setIsSubmitting(true);
      try {
        await onEditMessage(editingMessage.id, trimmed);
        setBody("");
        onCancelEdit();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If there's pending files, send message + attachments together
    if (pendingFiles.length > 0) {
      setIsSubmitting(true);
      try {
        await onSendWithAttachment(pendingFiles, body.trim());
        setBody("");
        setPendingFiles([]);
        onStopTyping();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Normal text-only send
    const trimmed = body.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onSend(trimmed);
      setBody("");
      onStopTyping();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || disabled) return;
    const selected = Array.from(files);
    event.target.value = "";
    setPendingFiles((prev) => [...prev, ...selected]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Microphone permission denied or not available
    }
  };

  const stopAndSendRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;

    // Stop recording and wait for data
    const audioBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        resolve(blob);
      };
      mediaRecorder.stop();
    });

    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (audioBlob.size === 0) return;

    // Create a File from the blob and send as attachment
    const extension = mediaRecorder.mimeType.includes("webm") ? "webm" : "ogg";
    const audioFile = new File(
      [audioBlob],
      `voice-note-${Date.now()}.${extension}`,
      { type: mediaRecorder.mimeType },
    );

    setIsSubmitting(true);
    try {
      await onSendWithAttachment([audioFile], "🎤");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canSend = pendingFiles.length > 0 || Boolean(body.trim()) || Boolean(editingMessage);
  const showMicButton = !canSend && pendingFiles.length === 0 && !isRecording && !editingMessage;

  // Recording UI
  if (isRecording) {
    return (
      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4">
          <button
            type="button"
            onClick={cancelRecording}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-700"
            aria-label={labels.cancel}
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-xs text-red-600">{labels.recording}</span>
          </div>
          <button
            type="button"
            onClick={() => void stopAndSendRecording()}
            disabled={isSubmitting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-hover disabled:opacity-60"
            aria-label={labels.send}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="shrink-0 border-t border-slate-200 bg-white p-4"
    >
      {/* Editing banner */}
      {editingMessage ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-s-4 border-s-amber-500 border border-slate-200 bg-amber-50 px-3 py-2">
          <Edit3 className="h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-700">{labels.editMessage}</p>
            <p className="truncate text-xs text-slate-600">{editingMessage.body}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              setBody("");
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label={labels.cancel}
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
      ) : null}

      {/* Reply preview bar */}
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-s-4 border-s-primary border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-primary">{replyTo.senderName}</p>
            <p className="truncate text-xs text-slate-600">{replyTo.body}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label={labels.cancel}
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
      ) : null}

      {/* File preview bar */}
      {pendingFiles.length > 0 ? (
        <div className="mb-2 space-y-1">
          {pendingFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {file.size < 1024 * 1024
                  ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                  : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
              </span>
              <button
                type="button"
                onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                aria-label={labels.cancel}
              >
                <span className="text-sm leading-none">&times;</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-primary"
          aria-label={labels.attachFile}
          disabled={disabled || isSubmitting}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => void handleFileSelect(event)}
        />
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onBlur={onStopTyping}
            onChange={(event) => {
              setBody(event.target.value);
              onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend || pendingFiles.length > 0) {
                  void handleSubmit(event as unknown as FormEvent);
                }
              }
            }}
            placeholder={pendingFiles.length > 0 ? labels.addCaption : labels.writeMessage}
            maxLength={maxLength}
            disabled={disabled || isSubmitting}
            rows={1}
            className="max-h-32 min-h-[48px] w-full resize-none border-0 bg-transparent px-0 pt-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            style={{ height: "auto", overflow: "hidden" }}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                el.style.overflow = el.scrollHeight > 128 ? "auto" : "hidden";
              }
            }}
          />
          <p className="text-[10px] text-slate-400 leading-none pb-1">
            Shift + Enter {labels.send === "إرسال" ? "لسطر جديد" : "for new line"}
          </p>
        </div>
        <EmojiPickerButton
          disabled={disabled || isSubmitting}
          labels={labels}
          onSelect={(emoji) => setBody((prev) => prev + emoji)}
        />
        {showMicButton ? (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={disabled || isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
            aria-label={labels.voiceNote}
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || isSubmitting || !canSend}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-500 transition enabled:bg-primary enabled:text-white enabled:hover:bg-hover"
            aria-label={labels.send}
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}

export function ReadOnlyComposer({ labels }: { labels: ConversationRedesignLabels }) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
        {labels.readOnlyComposer}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Emoji Picker                                                        */
/* ------------------------------------------------------------------ */

function EmojiPickerButton({
  disabled,
  labels,
  onSelect,
}: {
  disabled: boolean;
  labels: ConversationRedesignLabels;
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-primary"
        aria-label={labels.emoji}
        disabled={disabled}
      >
        <Smile className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute bottom-full end-0 z-50 mb-2">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.LIGHT}
            width={350}
            height={400}
            searchPlaceHolder={labels.emoji}
            lazyLoadEmojis
          />
        </div>
      ) : null}
    </div>
  );
}

