import {
  type ChangeEvent,
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Reply, ShieldAlert, Trash2 } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import {
  actorName,
  displayNameForUserId,
  getAvatarUrl,
} from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  formatTime,
  messageSenderUserId,
} from "@/features/communication/conversations_redesign/utils/formatters";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";
import { normalizeStatus } from "@/features/communication/utils/communication-errors";
import type {
  MessageAttachment,
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";
import { REACTION_OPTIONS } from "./reactionOptions";
import { BubbleContextMenu } from "./BubbleContextMenu";
import { FloatingReactionBar } from "./FloatingReactionBar";
import { AttachmentCard } from "./AttachmentCard";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { MessageText } from "./MessageText";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";

const SWIPE_REPLY_THRESHOLD = 64;
const SWIPE_REPLY_MAX_OFFSET = 88;
const SWIPE_DIRECTION_LOCK_DISTANCE = 8;

function replyPreviewBody(
  message: ConversationMessage | undefined,
  labels: ConversationRedesignLabels,
) {
  if (!message) return "...";
  const status = normalizeStatus(message.status);
  if (status === "deleted") return labels.errorMessageDeleted;
  if (status === "hidden") return labels.errorMessageHidden;
  return message.body || "...";
}

export function MessageBubble({
  allowActions = true,
  allowReactions,
  canDeleteMessages = true,
  canEditMessages = true,
  canManageAttachments = true,
  canReplyMessages = true,
  canReportMessages = true,
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
  allowActions?: boolean;
  allowReactions: boolean;
  canDeleteMessages?: boolean;
  canEditMessages?: boolean;
  canManageAttachments?: boolean;
  canReplyMessages?: boolean;
  canReportMessages?: boolean;
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
    message.editedAt ||
      (message.updatedAt && message.updatedAt !== message.createdAt),
  );
  const normStatus = normalizeStatus(message.status);
  const deleted = normStatus === "deleted" || normStatus === "hidden";
  const canMutateOwnMessage =
    isOwn &&
    !deleted &&
    message.deliveryStatus !== "pending" &&
    message.deliveryStatus !== "failed";
  const canDeleteMessage = canMutateOwnMessage && canDeleteMessages;
  const canEditMessage = canMutateOwnMessage && canEditMessages;
  const canManageMessageAttachments =
    canMutateOwnMessage && canManageAttachments;
  const readByOthersCount = (message.readByUserIds ?? []).filter(
    (id) => id !== currentUserId,
  ).length;
  const apiReadByOthers = typeof message.readCount === "number"
    ? message.readCount
    : 0;
  const isRead = isOwn
    ? readByOthersCount > 0 || apiReadByOthers > 0
    : false;

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await onAttachFile(file).catch(() => undefined);
  };

  const handleDelete = () => {
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    setIsActionPending(true);
    try {
      await onDeleteMessage();
    } catch {
      // ConversationDetail owns the user-facing mutation error.
    } finally {
      setIsActionPending(false);
    }
  };

  const confirmDialogElement = (
    <ConfirmDialog
      isOpen={isConfirmOpen}
      onClose={() => setIsConfirmOpen(false)}
      onConfirm={executeDelete}
      title={labels.deleteMessage || "Delete"}
      description={labels.deleteMessageConfirm}
      confirmLabel={labels.deleteMessage || "Delete"}
      cancelLabel={labels.cancel}
      loading={isActionPending}
      severity="danger"
    />
  );

  const handleReaction = async (type: ReactionType) => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      await onAddReaction(type);
    } catch {
      // ConversationDetail owns the user-facing mutation error.
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRemoveReaction = async () => {
    if (!allowReactions) return;
    setIsActionPending(true);
    try {
      await onRemoveReaction();
    } catch {
      // ConversationDetail owns the user-facing mutation error.
    } finally {
      setIsActionPending(false);
    }
  };

  // Long-press for mobile
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeGestureRef = useRef<{
    isSwiping: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const canSwipeReply =
    allowActions &&
    canReplyMessages &&
    !deleted &&
    message.deliveryStatus !== "pending";
  const canOpenMessageActions = allowActions && !deleted;

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    clearLongPressTimer();
    if (!canOpenMessageActions) return;

    const touch = event.touches[0];
    if (touch && canSwipeReply) {
      swipeGestureRef.current = {
        isSwiping: false,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
      };
    } else {
      swipeGestureRef.current = null;
    }

    longPressTimerRef.current = setTimeout(() => {
      setShowMobileMenu(true);
    }, 500);
  }, [
    canOpenMessageActions,
    canSwipeReply,
    clearLongPressTimer,
    setShowMobileMenu,
  ]);

  const resetSwipeGesture = useCallback(() => {
    swipeGestureRef.current = null;
    setSwipeOffset(0);
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimer();

    const gesture = swipeGestureRef.current;
    if (
      gesture?.isSwiping &&
      gesture.lastX - gesture.startX >= SWIPE_REPLY_THRESHOLD &&
      canSwipeReply
    ) {
      onReply(message);
    }
    resetSwipeGesture();
  }, [canSwipeReply, clearLongPressTimer, message, onReply, resetSwipeGesture]);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLElement>) => {
    const gesture = swipeGestureRef.current;
    const touch = event.touches[0];
    if (!gesture || !touch) {
      clearLongPressTimer();
      return;
    }

    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    gesture.lastX = touch.clientX;
    gesture.lastY = touch.clientY;

    if (!gesture.isSwiping) {
      if (
        absDeltaX < SWIPE_DIRECTION_LOCK_DISTANCE &&
        absDeltaY < SWIPE_DIRECTION_LOCK_DISTANCE
      ) {
        return;
      }

      if (absDeltaY > absDeltaX || deltaX <= 0) {
        clearLongPressTimer();
        resetSwipeGesture();
        return;
      }

      gesture.isSwiping = true;
    }

    if (gesture.isSwiping) {
      clearLongPressTimer();
      event.preventDefault();
      setSwipeOffset(
        Math.min(SWIPE_REPLY_MAX_OFFSET, Math.max(0, deltaX)),
      );
    }
  }, [clearLongPressTimer, resetSwipeGesture]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  return (
    <>
    <article
      data-message-id={message.id}
      className={`group flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-4" : "mt-0.5"}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={() => {
        clearLongPressTimer();
        resetSwipeGesture();
      }}
      onContextMenu={(e) => { e.preventDefault(); setShowMobileMenu(true); }}
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
        style={{
          transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset ? "none" : "transform 150ms ease-out",
        }}
      >
        {swipeOffset > 0 ? (
          <div
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-primary/10 p-2 text-primary opacity-90 ${
              isOwn ? "-left-12" : "-left-10"
            }`}
            aria-hidden="true"
          >
            <Reply className="h-4 w-4" />
          </div>
        ) : null}

        {!isOwn && isFirstInGroup ? (
          <div className="mb-1 ms-1 text-xs font-medium text-slate-600">
            {senderName}
          </div>
        ) : null}

        {/* Bubble */}
        <div
          onDoubleClick={() => {
            if (!deleted && canReplyMessages) {
              onReply(message);
            }
          }}
          className={`relative min-w-0 max-w-full rounded-2xl px-2.5 py-1.5 shadow-sm ${
            deleted
              ? "border border-dashed border-slate-300 bg-slate-100 text-slate-600"
              : isOwn
                ? `${isFirstInGroup ? "rounded-ee-md" : ""} bg-primary text-white`
                : `${isFirstInGroup ? "rounded-es-md" : ""} border border-slate-200 bg-white text-slate-950`
          }`}
        >
          {/* Chevron dropdown — appears on hover at top-end corner */}
          {allowActions && !deleted ? (
            <BubbleContextMenu
              allowReactions={allowReactions}
              canAttach={canManageMessageAttachments}
              canEdit={canEditMessage}
              canDelete={canDeleteMessage}
              canReply={canReplyMessages}
              canReport={canReportMessages}
              isOwn={isOwn}
              labels={labels}
              messageBody={message.body}
              onAddReaction={handleReaction}
              onAttach={() => fileInputRef.current?.click()}
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

          {!deleted && message.replyToMessageId ? (() => {
            const originalMsg = allMessages.find((m) => m.id === message.replyToMessageId);
            const originalSender = originalMsg
              ? (originalMsg.sender?.name as string) ||
                displayNameForUserId(
                  messageSenderUserId(originalMsg),
                  userDisplayNames,
                  labels.someone,
                )
              : labels.someone;
            const originalBody = replyPreviewBody(originalMsg, labels);
            return (
              <button
                type="button"
                onClick={() => {
                  const target = document.querySelector(
                    `[data-message-id="${message.replyToMessageId}"]`,
                  );
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                    target.classList.add("highlight-message");
                    setTimeout(() => target.classList.remove("highlight-message"), 1500);
                  }
                }}
                className={`mb-2 w-full rounded-lg overflow-hidden text-start transition hover:opacity-80 ${
                  isOwn ? "bg-primary-700/30" : "bg-slate-100"
                }`}
              >
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
              </button>
            );
          })() : null}

          {normStatus === "deleted" || normStatus === "hidden" ? (
            <p
              dir="auto"
              className="flex items-center gap-2 whitespace-pre-wrap break-words text-sm italic leading-6 [overflow-wrap:anywhere]"
            >
              {normStatus === "deleted" ? (
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {normStatus === "deleted"
                  ? labels.errorMessageDeleted
                  : labels.errorMessageHidden}
              </span>
            </p>
          ) : (
            <>
              <MessageText
                isOwn={isOwn}
                text={message.body ?? ""}
                readMoreLabel={labels.readMore}
                showLessLabel={labels.showLess}
              />
              <LinkPreviewCard isOwn={isOwn} text={message.body ?? ""} />
            </>
          )}

          {!deleted && attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  canDelete={canManageMessageAttachments}
                  isOwn={isOwn}
                  labels={labels}
                  onDelete={() => onDeleteAttachment(attachment.id)}
                />
              ))}
            </div>
          ) : null}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              deleted
                ? "text-slate-500"
                : isOwn
                  ? "text-white/80"
                  : "text-slate-400"
            }`}
          >
            {!deleted && edited ? <span>{labels.edited}</span> : null}
            <span className="italic mt-auto">{formatTime(message.createdAt, locale)}</span>
            {isOwn && !deleted ? (
              <MessageStatusIcon
                deliveryStatus={message.deliveryStatus}
                isRead={isRead}
                isOwn={isOwn}
                labels={labels}
              />
            ) : null}
          </div>
        </div>

        {/* Reaction badges at bottom-corner of bubble */}
        {!deleted && Object.keys(groupedReactions).length > 0 ? (
          <div className={`mt-1 flex flex-wrap items-center gap-0.5`}>
            {Object.entries(groupedReactions).map(([type, items]) => {
              const meta = REACTION_OPTIONS.find((r) => r.type === type);
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
                  <span>{meta?.emoji ?? "👍"}</span>
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

    {/* Mobile bottom sheet — shown on long press */}
    {canOpenMessageActions && showMobileMenu ? (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
        onClick={() => setShowMobileMenu(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Reaction bar at top of sheet */}
        {allowReactions && !deleted ? (
          <div className="relative z-10 mx-auto mb-2 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lg">
            {[
              { emoji: "👍", type: "thumbs_up" as ReactionType },
              { emoji: "👎", type: "thumbs_down" as ReactionType },
              { emoji: "❤️", type: "love" as ReactionType },
              { emoji: "😂", type: "laugh" as ReactionType },
              { emoji: "😮", type: "wow" as ReactionType },
              { emoji: "😢", type: "sad" as ReactionType },
              { emoji: "😡", type: "angry" as ReactionType },
              { emoji: "🙏", type: "like" as ReactionType },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu(false);
                  void handleReaction(item.type);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl transition active:scale-110 active:bg-slate-100"
              >
                {item.emoji}
              </button>
            ))}
          </div>
        ) : null}

        {/* Actions sheet */}
        <div
          className="relative z-10 rounded-t-2xl border-t border-slate-200 bg-white pb-6 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
          <div className="space-y-0.5 px-2">
            {/* Reply */}
            {canReplyMessages ? (
              <button
              type="button"
              onClick={() => { setShowMobileMenu(false); onReply(message); }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 active:bg-slate-100"
            >
              <span className="text-lg">↩️</span>
              {labels.reply}
              </button>
            ) : null}
            {/* Copy */}
            {message.body ? (
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  void navigator.clipboard.writeText(message.body ?? "");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 active:bg-slate-100"
              >
                <span className="text-lg">📋</span>
                {labels.copy}
              </button>
            ) : null}
            {/* Edit (own only) */}
            {canEditMessage ? (
              <button
                type="button"
                onClick={() => { setShowMobileMenu(false); onStartEdit(); }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 active:bg-slate-100"
              >
                <span className="text-lg">✏️</span>
                {labels.editMessage}
              </button>
            ) : null}
            {canManageMessageAttachments ? (
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 active:bg-slate-100"
              >
                <span className="text-lg">📎</span>
                {labels.attachFileToMessage}
              </button>
            ) : null}
            {/* Info (own only) */}
            {isOwn ? (
              <button
                type="button"
                onClick={() => { setShowMobileMenu(false); onInfo(message.id); }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-700 active:bg-slate-100"
              >
                <span className="text-lg">ℹ️</span>
                {labels.messageInfo}
              </button>
            ) : null}
            {/* Report (others only) */}
            {!isOwn && canReportMessages ? (
              <button
                type="button"
                onClick={() => { setShowMobileMenu(false); onReport(message.id); }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-amber-600 active:bg-amber-50"
              >
                <span className="text-lg">🚩</span>
                {labels.report}
              </button>
            ) : null}
            {/* Delete (own only) */}
            {canDeleteMessage ? (
              <button
                type="button"
                onClick={() => { setShowMobileMenu(false); void handleDelete(); }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-rose-600 active:bg-rose-50"
              >
                <span className="text-lg">🗑️</span>
                {labels.deleteMessage}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    ) : null}
    {confirmDialogElement}
    </>
  );
}
