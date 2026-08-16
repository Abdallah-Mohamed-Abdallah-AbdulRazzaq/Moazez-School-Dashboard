"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import { useAuth } from "@/hooks/use-auth";
import { useCommunicationPolicy } from "@/features/communication/hooks/useCommunicationPolicy";
import { useConversation } from "@/features/communication/hooks/useConversation";
import { useConversationInvites } from "@/features/communication/hooks/useConversationInvites";
import { useConversationJoinRequests } from "@/features/communication/hooks/useConversationJoinRequests";
import { useConversationMessages } from "@/features/communication/hooks/useConversationMessages";
import { useConversationParticipants } from "@/features/communication/hooks/useConversationParticipants";
import { useConversationRealtime } from "@/features/communication/hooks/useConversationRealtime";
import { useMessageAttachments } from "@/features/communication/hooks/useMessageAttachments";
import { useMessageReactions } from "@/features/communication/hooks/useMessageReactions";
import { usePresence } from "@/features/communication/hooks/usePresence";
import { useTypingIndicator } from "@/features/communication/hooks/useTypingIndicator";
import { communicationErrorMessage } from "@/features/communication/utils/communication-errors";
import { getConversationPermissionFlags } from "@/features/communication/utils/conversation-permissions";
import ConversationInvitesPanel from "./ConversationInvitesPanel";
import JoinRequestsPanel from "./JoinRequestsPanel";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import MessageReadReceipts from "./MessageReadReceipts";
import ParticipantsPanel from "./ParticipantsPanel";
import TypingIndicator from "./TypingIndicator";

export interface ConversationThreadProps {
  conversationId: string;
}

const labels = {
  en: {
    back: "Back to conversations",
    loading: "Loading conversation...",
    refresh: "Refresh",
    errorTitle: "Unable to load thread",
    untitled: "Untitled conversation",
    messages: "Messages",
    participants: "Participants",
    invites: "Invites",
    joinRequests: "Join Requests",
    participantsCount: "{count} participants",
    invitesCount: "{count} invites",
    joinRequestsCount: "{count} join requests",
    addParticipant: "Add Participant",
    createInvite: "Create invite",
    createJoinRequest: "Create join request",
    userId: "User",
    inviteId: "Invite ID",
    requestId: "Request ID",
    invitedUserId: "Invited user",
    requesterUserId: "Requester user ID",
    role: "Role",
    status: "Status",
    note: "Note",
    joinedAt: "Joined",
    mutedUntil: "Muted until",
    expiresAt: "Expires at",
    createdAt: "Created at",
    noParticipants: "No participants loaded.",
    noInvites: "No invites yet.",
    noJoinRequests: "No join requests yet.",
    participantsLoading: "Loading participants...",
    invitesLoading: "Loading invites...",
    joinRequestsLoading: "Loading join requests...",
    participantsErrorTitle: "Unable to load participants",
    invitesErrorTitle: "Unable to load invites",
    joinRequestsErrorTitle: "Unable to load join requests",
    editParticipant: "Edit",
    promoteParticipant: "Promote",
    demoteParticipant: "Demote",
    removeParticipant: "Remove",
    leaveConversation: "Leave conversation",
    addParticipantTitle: "Add participant",
    editParticipantTitle: "Edit participant",
    promoteParticipantTitle: "Promote participant",
    demoteParticipantTitle: "Demote participant",
    removeParticipantTitle: "Remove participant",
    removeParticipantDescription:
      "This participant will be removed from the conversation.",
    leaveConversationTitle: "Leave conversation",
    leaveConversationDescription:
      "You will leave this conversation and may need to be added again to rejoin.",
    createInviteTitle: "Create invite",
    rejectInviteTitle: "Reject invite",
    rejectInviteDescription: "This invite will be rejected.",
    createJoinRequestTitle: "Create join request",
    approveJoinRequestTitle: "Approve join request",
    rejectJoinRequestTitle: "Reject join request",
    approveJoinRequestDescription: "This join request will be approved.",
    rejectJoinRequestDescription: "This join request will be rejected.",
    acceptInvite: "Accept",
    rejectInvite: "Reject",
    approveJoinRequest: "Approve",
    rejectJoinRequest: "Reject",
    create: "Create",
    reason: "Reason",
    targetRole: "Target role",
    add: "Add",
    userRequired: "Select a user.",
    owner: "Owner",
    admin: "Admin",
    moderator: "Moderator",
    member: "Member",
    readOnly: "Read only",
    system: "System",
    active: "Active",
    invited: "Invited",
    left: "Left",
    removed: "Removed",
    muted: "Muted",
    blocked: "Blocked",
    communicationDisabled: "Communication is currently disabled by policy.",
    composerPlaceholder: "Write a message...",
    send: "Send",
    maxMessageLength: "Message is {count}/{max} characters.",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    deleted: "Message deleted",
    pending: "Pending",
    failed: "Failed",
    edited: "Edited",
    like: "Like",
    love: "Love",
    laugh: "Laugh",
    wow: "Wow",
    sad: "Sad",
    angry: "Angry",
    thumbsUp: "Thumbs up",
    thumbsDown: "Thumbs down",
    removeReaction: "Remove",
    attachFile: "Attach",
    fileTooLarge: "File must be {size}MB or smaller.",
    uploadFailed: "Unable to upload attachment.",
    download: "Open attachment",
    removeAttachment: "Remove attachment",
    read: "Read",
    unread: "Unread",
    typing: "is typing",
    noMessages: "No messages yet. Start the conversation.",
    mutationFailed: "Action failed. Please try again.",
    participantAdded: "Participant added.",
    participantUpdated: "Participant updated.",
    participantRemoved: "Participant removed.",
    conversationLeft: "Conversation left.",
    inviteCreated: "Invite created.",
    inviteAccepted: "Invite accepted.",
    inviteRejected: "Invite rejected.",
    joinRequestCreated: "Join request created.",
    joinRequestApproved: "Join request approved.",
    joinRequestRejected: "Join request rejected.",
    online: "Online",
    offline: "Offline",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
    approved: "Approved",
  },
  ar: {
    back: "العودة إلى المحادثات",
    loading: "جار تحميل المحادثة...",
    refresh: "تحديث",
    errorTitle: "تعذر تحميل المحادثة",
    untitled: "محادثة بدون عنوان",
    messages: "الرسائل",
    participants: "المشاركون",
    invites: "الدعوات",
    joinRequests: "طلبات الانضمام",
    participantsCount: "{count} مشارك",
    invitesCount: "{count} دعوة",
    joinRequestsCount: "{count} طلب انضمام",
    addParticipant: "إضافة مشارك",
    createInvite: "إنشاء دعوة",
    createJoinRequest: "إنشاء طلب انضمام",
    userId: "المستخدم",
    inviteId: "معرف الدعوة",
    requestId: "معرف الطلب",
    invitedUserId: "المستخدم المدعو",
    requesterUserId: "معرف المستخدم مقدم الطلب",
    role: "الدور",
    status: "الحالة",
    note: "ملاحظة",
    joinedAt: "انضم في",
    mutedUntil: "مكتوم حتى",
    expiresAt: "تنتهي في",
    createdAt: "تم الإنشاء في",
    noParticipants: "لم يتم تحميل مشاركين.",
    noInvites: "لا توجد دعوات بعد.",
    noJoinRequests: "لا توجد طلبات انضمام بعد.",
    participantsLoading: "جار تحميل المشاركين...",
    invitesLoading: "جار تحميل الدعوات...",
    joinRequestsLoading: "جار تحميل طلبات الانضمام...",
    participantsErrorTitle: "تعذر تحميل المشاركين",
    invitesErrorTitle: "تعذر تحميل الدعوات",
    joinRequestsErrorTitle: "تعذر تحميل طلبات الانضمام",
    editParticipant: "تعديل",
    promoteParticipant: "ترقية",
    demoteParticipant: "خفض الدور",
    removeParticipant: "إزالة",
    leaveConversation: "مغادرة المحادثة",
    addParticipantTitle: "إضافة مشارك",
    editParticipantTitle: "تعديل المشارك",
    promoteParticipantTitle: "ترقية المشارك",
    demoteParticipantTitle: "خفض دور المشارك",
    removeParticipantTitle: "إزالة المشارك",
    removeParticipantDescription: "سيتم إزالة هذا المشارك من المحادثة.",
    leaveConversationTitle: "مغادرة المحادثة",
    leaveConversationDescription:
      "ستغادر هذه المحادثة وقد تحتاج إلى إضافتك مرة أخرى للانضمام.",
    createInviteTitle: "إنشاء دعوة",
    rejectInviteTitle: "رفض الدعوة",
    rejectInviteDescription: "سيتم رفض هذه الدعوة.",
    createJoinRequestTitle: "إنشاء طلب انضمام",
    approveJoinRequestTitle: "قبول طلب الانضمام",
    rejectJoinRequestTitle: "رفض طلب الانضمام",
    approveJoinRequestDescription: "سيتم قبول طلب الانضمام هذا.",
    rejectJoinRequestDescription: "سيتم رفض طلب الانضمام هذا.",
    acceptInvite: "قبول",
    rejectInvite: "رفض",
    approveJoinRequest: "قبول",
    rejectJoinRequest: "رفض",
    create: "إنشاء",
    reason: "السبب",
    targetRole: "الدور المستهدف",
    add: "إضافة",
    userRequired: "اختر مستخدمًا.",
    owner: "مالك",
    admin: "مسؤول",
    moderator: "مشرف",
    member: "عضو",
    readOnly: "قراءة فقط",
    system: "النظام",
    active: "نشط",
    invited: "مدعو",
    left: "غادر",
    removed: "مزال",
    muted: "مكتوم",
    blocked: "محظور",
    communicationDisabled: "التواصل معطل حاليا حسب السياسة.",
    composerPlaceholder: "اكتب رسالة...",
    send: "إرسال",
    maxMessageLength: "الرسالة {count}/{max} حرفا.",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    deleted: "تم حذف الرسالة",
    pending: "قيد الإرسال",
    failed: "فشل",
    edited: "تم التعديل",
    like: "إعجاب",
    love: "مفضلة",
    laugh: "ضحك",
    wow: "إعجاب شديد",
    sad: "حزن",
    angry: "غضب",
    thumbsUp: "إعجاب",
    thumbsDown: "عدم إعجاب",
    removeReaction: "إزالة",
    attachFile: "إرفاق",
    fileTooLarge: "يجب ألا يتجاوز الملف {size} ميجابايت.",
    uploadFailed: "تعذر رفع المرفق.",
    download: "فتح المرفق",
    removeAttachment: "إزالة المرفق",
    read: "مقروء",
    unread: "غير مقروء",
    typing: "يكتب الآن",
    noMessages: "لا توجد رسائل بعد. ابدأ المحادثة.",
    mutationFailed: "تعذر تنفيذ الإجراء. حاول مرة أخرى.",
    participantAdded: "تم إضافة المشارك.",
    participantUpdated: "تم تحديث المشارك.",
    participantRemoved: "تم إزالة المشارك.",
    conversationLeft: "تمت مغادرة المحادثة.",
    inviteCreated: "تم إنشاء الدعوة.",
    inviteAccepted: "تم قبول الدعوة.",
    inviteRejected: "تم رفض الدعوة.",
    joinRequestCreated: "تم إنشاء طلب الانضمام.",
    joinRequestApproved: "تم قبول طلب الانضمام.",
    joinRequestRejected: "تم رفض طلب الانضمام.",
    online: "متصل",
    offline: "غير متصل",
    accepted: "مقبولة",
    rejected: "مرفوضة",
    expired: "منتهية",
    approved: "مقبول",
  },
};

type LocaleKey = keyof typeof labels;
type ConversationDetailTab =
  | "messages"
  | "participants"
  | "invites"
  | "joinRequests";

function conversationTitle(
  locale: LocaleKey,
  conversation: ReturnType<typeof useConversation>["conversation"],
  fallback: string,
) {
  if (!conversation) return fallback;
  const preferred =
    locale === "ar" ? conversation.titleAr : conversation.titleEn;
  const secondary =
    locale === "ar" ? conversation.titleEn : conversation.titleAr;
  return preferred || secondary || conversation.title || fallback;
}

export default function ConversationThread({
  conversationId,
}: ConversationThreadProps) {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const conversationState = useConversation(conversationId);
  const messagesState = useConversationMessages(conversationId);
  const [activeTab, setActiveTab] = useState<ConversationDetailTab>("messages");
  const [loadedTabs, setLoadedTabs] = useState<
    Record<ConversationDetailTab, boolean>
  >({
    messages: true,
    participants: false,
    invites: false,
    joinRequests: false,
  });
  const shouldLoadParticipants =
    loadedTabs.participants || loadedTabs.invites || loadedTabs.joinRequests;
  const participantsState = useConversationParticipants(conversationId, {
    enabled: shouldLoadParticipants,
  });
  const invitesState = useConversationInvites(conversationId, {
    enabled: loadedTabs.invites,
  });
  const joinRequestsState = useConversationJoinRequests(conversationId, {
    enabled: loadedTabs.joinRequests,
  });
  const { policy } = useCommunicationPolicy();
  const presenceState = usePresence({
    enabled: policy?.allowOnlinePresence !== false,
  });
  const typingState = useTypingIndicator(conversationId);
  const messageIds = useMemo(
    () =>
      messagesState.messages
        .filter((message) => message.id && message.deliveryStatus !== "pending")
        .map((message) => message.id),
    [messagesState.messages],
  );
  const attachmentMessages = useMemo(
    () =>
      messagesState.messages.filter(
        (message) => message.id && message.deliveryStatus !== "pending",
      ),
    [messagesState.messages],
  );
  const reactionsState = useMessageReactions(messageIds);
  const attachmentsState = useMessageAttachments(
    attachmentMessages,
    policy?.maxAttachmentSizeMb,
  );
  const refreshConversation = conversationState.refresh;
  const refreshMessages = messagesState.refresh;
  const refreshParticipants = participantsState.refresh;
  const refreshInvites = invitesState.refresh;
  const refreshJoinRequests = joinRequestsState.refresh;
  const refreshReactions = reactionsState.refreshAll;

  const permissions = useMemo(
    () =>
      getConversationPermissionFlags({
        currentUserId: user?.id,
        participants: participantsState.participants,
        conversation: conversationState.conversation,
      }),
    [conversationState.conversation, participantsState.participants, user?.id],
  );
  const isPermissionDataLoading =
    (activeTab === "participants" ||
      activeTab === "invites" ||
      activeTab === "joinRequests") &&
    participantsState.isLoading;

  const handleTabChange = useCallback((tab: ConversationDetailTab) => {
    setActiveTab(tab);
    setLoadedTabs((current) => ({
      ...current,
      [tab]: true,
      ...(tab === "invites" || tab === "joinRequests"
        ? { participants: true }
        : {}),
    }));
  }, []);

  const refreshAll = useCallback(() => {
    void refreshConversation();
    void refreshMessages();
    if (shouldLoadParticipants) void refreshParticipants();
    if (loadedTabs.invites) void refreshInvites();
    if (loadedTabs.joinRequests) void refreshJoinRequests();
    void refreshReactions();
  }, [
    loadedTabs.invites,
    loadedTabs.joinRequests,
    refreshConversation,
    refreshInvites,
    refreshJoinRequests,
    refreshMessages,
    refreshParticipants,
    refreshReactions,
    shouldLoadParticipants,
  ]);

  const runMutation = useCallback(
    async <T,>(operation: () => Promise<T>, successMessage: string) => {
      try {
        const result = await operation();
        showSuccess(successMessage);
        return result;
      } catch (error) {
        showError(communicationErrorMessage(error, t.mutationFailed));
        throw error;
      }
    },
    [showError, showSuccess, t.mutationFailed],
  );

  useConversationRealtime({
    conversationId,
    onMessageCreated: messagesState.upsertFromRealtime,
    onMessageUpdated: messagesState.patchFromRealtime,
    onMessageDeleted: messagesState.deleteFromRealtime,
    onMessageRead: messagesState.patchReadFromRealtime,
    onReactionUpserted: refreshReactions,
    onReactionDeleted: refreshReactions,
    onTypingStarted: typingState.handleTypingStarted,
    onTypingStopped: typingState.handleTypingStopped,
    onPresenceUpdated: presenceState.handlePresenceUpdated,
    onReconnect: refreshAll,
  });

  useEffect(() => {
    const latestReadable = [...messagesState.messages]
      .reverse()
      .find((message) => message.senderId !== user?.id && message.id);
    if (latestReadable) {
      void messagesState.markRead(latestReadable.id);
    }
  }, [messagesState, user?.id]);

  const isLoading = conversationState.isLoading || messagesState.isLoading;
  const firstError = conversationState.error || messagesState.error;
  const title = conversationTitle(
    locale,
    conversationState.conversation,
    t.untitled,
  );
  const backHref = `/${locale}/communication/conversations`;
  const isCommunicationEnabled = policy?.isEnabled !== false;
  const allowReactions = policy?.allowReactions !== false;
  const allowAttachments = policy?.allowAttachments !== false;
  const allowMessageEdit =
    policy?.allowMessageEdit ?? policy?.allowMessageEditing ?? true;
  const allowMessageDelete =
    policy?.allowMessageDelete ?? policy?.allowMessageDeleting ?? true;
  const maxMessageLength =
    typeof policy?.maxMessageLength === "number" && policy.maxMessageLength > 0
      ? policy.maxMessageLength
      : undefined;
  const detailTabs: Array<{ value: ConversationDetailTab; label: string }> = [
    { value: "messages", label: t.messages },
    { value: "participants", label: t.participants },
    { value: "invites", label: t.invites },
    { value: "joinRequests", label: t.joinRequests },
  ];

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </Link>

      <CommunicationPageHeader
        title={title}
        description={conversationState.conversation?.type}
        actions={
          <>
            {conversationState.conversation?.status ? (
              <CommunicationStatusChip
                label={conversationState.conversation.status}
                tone={
                  conversationState.conversation.status === "active"
                    ? "success"
                    : "warning"
                }
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={refreshAll}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
          </>
        }
      />

      {firstError ? (
        <CommunicationErrorState title={t.errorTitle} message={firstError} />
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {detailTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "messages" ? (
          <section className="flex min-h-[640px] flex-col rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messagesState.messages.length > 0 ? (
                messagesState.messages.map((message) => {
                  const senderUserId =
                    message.sender?.userId ?? message.sender?.id;
                  const isOwn =
                    message.senderId === user?.id ||
                    senderUserId === user?.id ||
                    message.sender?.id === user?.id;

                  return (
                    <MessageBubble
                      key={message.clientMessageId ?? message.id}
                      message={message}
                      isOwn={Boolean(isOwn)}
                      labels={{
                        edit: t.edit,
                        delete: t.delete,
                        save: t.save,
                        cancel: t.cancel,
                        deleted: t.deleted,
                        pending: t.pending,
                        failed: t.failed,
                        edited: t.edited,
                        like: t.like,
                        love: t.love,
                        laugh: t.laugh,
                        wow: t.wow,
                        sad: t.sad,
                        angry: t.angry,
                        thumbsUp: t.thumbsUp,
                        thumbsDown: t.thumbsDown,
                        removeReaction: t.removeReaction,
                        attachFile: t.attachFile,
                        fileTooLarge: t.fileTooLarge,
                        uploadFailed: t.uploadFailed,
                        download: t.download,
                        removeAttachment: t.removeAttachment,
                      }}
                      currentUserId={user?.id}
                      allowReactions={allowReactions}
                      allowAttachments={allowAttachments}
                      allowMessageEdit={allowMessageEdit}
                      allowMessageDelete={allowMessageDelete}
                      maxAttachmentSizeMb={policy?.maxAttachmentSizeMb}
                      reactions={
                        reactionsState.reactionsByMessageId[message.id] ?? []
                      }
                      attachments={
                        attachmentsState.attachmentsByMessageId[message.id] ??
                        message.attachments ??
                        []
                      }
                      isUploadingAttachment={
                        attachmentsState.uploadingMessageId === message.id
                      }
                      onEdit={messagesState.edit}
                      onDelete={messagesState.remove}
                      onAddReaction={reactionsState.addReaction}
                      onRemoveReaction={reactionsState.removeMyReaction}
                      onUploadAttachment={attachmentsState.attachFile}
                      onDeleteAttachment={attachmentsState.removeAttachment}
                    />
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  {t.noMessages}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {!isCommunicationEnabled ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <span>{t.communicationDisabled}</span>
                </div>
              ) : null}
              <TypingIndicator
                users={typingState.typingUsers}
                label={t.typing}
              />
              <MessageReadReceipts
                readSummary={messagesState.readSummary}
                labels={{ read: t.read, unread: t.unread }}
              />
              <MessageComposer
                placeholder={t.composerPlaceholder}
                sendLabel={t.send}
                maxLength={maxMessageLength}
                maxLengthLabel={t.maxMessageLength}
                disabled={
                  !isCommunicationEnabled ||
                  conversationState.conversation?.status === "closed"
                }
                onTyping={typingState.emitTyping}
                onStopTyping={typingState.stopOwnTyping}
                onSend={(body) => {
                  void messagesState.send(body);
                }}
              />
            </div>
          </section>
        ) : null}

        {activeTab === "participants" ? (
          <ParticipantsPanel
            participants={participantsState.participants}
            total={participantsState.total}
            presenceByUserId={
              policy?.allowOnlinePresence === false
                ? {}
                : presenceState.presenceByUserId
            }
            isLoading={participantsState.isLoading}
            isRefreshing={participantsState.isRefreshing}
            isMutating={participantsState.isMutating}
            error={participantsState.error}
            onRefresh={participantsState.refresh}
            onAddParticipant={(values) =>
              runMutation(
                () => participantsState.add(values),
                t.participantAdded,
              )
            }
            onUpdateParticipant={(participantId, values) =>
              runMutation(
                () => participantsState.update(participantId, values),
                t.participantUpdated,
              )
            }
            onRemoveParticipant={(participantId) =>
              runMutation(
                () => participantsState.remove(participantId),
                t.participantRemoved,
              )
            }
            onLeaveConversation={() =>
              runMutation(() => participantsState.leave(), t.conversationLeft)
            }
            onPromoteParticipant={(participantId, values) =>
              runMutation(
                () => participantsState.promote(participantId, values),
                t.participantUpdated,
              )
            }
            onDemoteParticipant={(participantId, values) =>
              runMutation(
                () => participantsState.demote(participantId, values),
                t.participantUpdated,
              )
            }
            canManageParticipants={permissions.canManageParticipants}
            canLeaveConversation={permissions.canLeaveConversation}
            currentUserId={user?.id}
            labels={{
              title: t.participants,
              count: t.participantsCount,
              addParticipant: t.addParticipant,
              refresh: t.refresh,
              loading: t.participantsLoading,
              errorTitle: t.participantsErrorTitle,
              userId: t.userId,
              role: t.role,
              status: t.status,
              joinedAt: t.joinedAt,
              mutedUntil: t.mutedUntil,
              empty: t.noParticipants,
              edit: t.editParticipant,
              promote: t.promoteParticipant,
              demote: t.demoteParticipant,
              remove: t.removeParticipant,
              leave: t.leaveConversation,
              cancel: t.cancel,
              save: t.save,
              add: t.add,
              targetRole: t.targetRole,
              addTitle: t.addParticipantTitle,
              editTitle: t.editParticipantTitle,
              promoteTitle: t.promoteParticipantTitle,
              demoteTitle: t.demoteParticipantTitle,
              removeTitle: t.removeParticipantTitle,
              removeDescription: t.removeParticipantDescription,
              leaveTitle: t.leaveConversationTitle,
              leaveDescription: t.leaveConversationDescription,
              userRequired: t.userRequired,
              owner: t.owner,
              admin: t.admin,
              moderator: t.moderator,
              member: t.member,
              readOnly: t.readOnly,
              system: t.system,
              active: t.active,
              invited: t.invited,
              left: t.left,
              removed: t.removed,
              muted: t.muted,
              blocked: t.blocked,
              online: t.online,
              offline: t.offline,
            }}
          />
        ) : null}

        {activeTab === "invites" ? (
          <ConversationInvitesPanel
            invites={invitesState.invites}
            total={invitesState.total}
            isLoading={invitesState.isLoading || isPermissionDataLoading}
            isRefreshing={invitesState.isRefreshing}
            isMutating={invitesState.isMutating}
            error={invitesState.error}
            onRefresh={invitesState.refresh}
            onCreateInvite={(values) =>
              runMutation(() => invitesState.create(values), t.inviteCreated)
            }
            onAcceptInvite={(inviteId) =>
              runMutation(() => invitesState.accept(inviteId), t.inviteAccepted)
            }
            onRejectInvite={(inviteId, values) =>
              runMutation(
                () => invitesState.reject(inviteId, values),
                t.inviteRejected,
              )
            }
            canCreateInvite={permissions.canManageInvites}
            currentUserId={user?.id}
            labels={{
              title: t.invites,
              count: t.invitesCount,
              createInvite: t.createInvite,
              refresh: t.refresh,
              loading: t.invitesLoading,
              empty: t.noInvites,
              errorTitle: t.invitesErrorTitle,
              inviteId: t.inviteId,
              invitedUserId: t.invitedUserId,
              status: t.status,
              expiresAt: t.expiresAt,
              createdAt: t.createdAt,
              accept: t.acceptInvite,
              reject: t.rejectInvite,
              cancel: t.cancel,
              create: t.create,
              createTitle: t.createInviteTitle,
              rejectTitle: t.rejectInviteTitle,
              rejectDescription: t.rejectInviteDescription,
              reason: t.reason,
              userRequired: t.userRequired,
              pending: t.pending,
              accepted: t.accepted,
              rejected: t.rejected,
              expired: t.expired,
            }}
          />
        ) : null}

        {activeTab === "joinRequests" ? (
          <JoinRequestsPanel
            joinRequests={joinRequestsState.joinRequests}
            total={joinRequestsState.total}
            isLoading={joinRequestsState.isLoading || isPermissionDataLoading}
            isRefreshing={joinRequestsState.isRefreshing}
            isMutating={joinRequestsState.isMutating}
            error={joinRequestsState.error}
            onRefresh={joinRequestsState.refresh}
            onCreateJoinRequest={(values) =>
              runMutation(
                () => joinRequestsState.create(values),
                t.joinRequestCreated,
              )
            }
            onApproveJoinRequest={(requestId, values) =>
              runMutation(
                () => joinRequestsState.approve(requestId, values),
                t.joinRequestApproved,
              )
            }
            onRejectJoinRequest={(requestId, values) =>
              runMutation(
                () => joinRequestsState.reject(requestId, values),
                t.joinRequestRejected,
              )
            }
            canCreateJoinRequest={
              !isPermissionDataLoading && permissions.canCreateJoinRequest
            }
            canReviewJoinRequests={permissions.canReviewJoinRequests}
            labels={{
              title: t.joinRequests,
              count: t.joinRequestsCount,
              createJoinRequest: t.createJoinRequest,
              refresh: t.refresh,
              loading: t.joinRequestsLoading,
              empty: t.noJoinRequests,
              errorTitle: t.joinRequestsErrorTitle,
              requestId: t.requestId,
              requesterUserId: t.requesterUserId,
              status: t.status,
              note: t.note,
              createdAt: t.createdAt,
              approve: t.approveJoinRequest,
              reject: t.rejectJoinRequest,
              cancel: t.cancel,
              create: t.create,
              createTitle: t.createJoinRequestTitle,
              approveTitle: t.approveJoinRequestTitle,
              rejectTitle: t.rejectJoinRequestTitle,
              approveDescription: t.approveJoinRequestDescription,
              rejectDescription: t.rejectJoinRequestDescription,
              reason: t.reason,
              pending: t.pending,
              approved: t.approved,
              rejected: t.rejected,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
