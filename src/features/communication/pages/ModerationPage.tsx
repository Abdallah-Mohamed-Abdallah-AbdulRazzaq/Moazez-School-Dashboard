"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import ModerationActionForm from "@/features/communication/components/safety/ModerationActionForm";
import ModerationActionsPanel from "@/features/communication/components/safety/ModerationActionsPanel";
import ModerationHistoryTable from "@/features/communication/components/safety/ModerationHistoryTable";
import { useModerationActions } from "@/features/communication/hooks/useModerationActions";
import { useToast } from "@/components/ui/toast/Toast";
import type { SupportedModerationAction } from "@/features/communication/types/safety.types";
import SafetyNavigation from "@/features/communication/components/safety/SafetyNavigation";

const labels = {
  en: {
    title: "Moderation",
    description:
      "Load a message, review its moderation history, and hide or restore visibility.",
    errorTitle: "Unable to complete moderation action",
    panelTitle: "Message Lookup",
    conversationSelect: "Conversation",
    messageId: "Message",
    selectConversationFirst: "Select a conversation first",
    load: "Load Message",
    currentStatus: "Current status",
    sender: "Sender",
    conversation: "Conversation",
    messageBody: "Message body",
    noMessage: "Load a message by ID to review moderation controls.",
    hidden: "Hidden",
    deleted: "Deleted",
    visible: "Visible",
    unknown: "Unknown",
    actionTitle: "Moderation Action",
    reason: "Reason",
    reasonPlaceholder: "Explain why this moderation action is needed.",
    hide: "Hide Message",
    unhide: "Unhide Message",
    reasonRequired: "Add a reason before submitting.",
    historyTitle: "Moderation History",
    action: "Action",
    moderator: "Moderator",
    createdAt: "Created",
    delete: "Delete",
    emptyHistoryTitle: "No moderation history",
    emptyHistoryDescription:
      "Actions for the loaded message will appear here after they are created.",
    actionComplete: "Moderation action saved.",
    actionFailed: "Action failed. Please try again.",
  },
  ar: {
    title: "الإشراف",
    description: "حمّل رسالة وراجع سجل الإشراف وأخفها أو أعد إظهارها.",
    errorTitle: "تعذر تنفيذ إجراء الإشراف",
    panelTitle: "بحث الرسالة",
    conversationSelect: "المحادثة",
    messageId: "الرسالة",
    selectConversationFirst: "اختر محادثة أولا",
    load: "تحميل الرسالة",
    currentStatus: "الحالة الحالية",
    sender: "المرسل",
    conversation: "المحادثة",
    messageBody: "محتوى الرسالة",
    noMessage: "حمّل رسالة بالمعرف لعرض أدوات الإشراف.",
    hidden: "مخفية",
    deleted: "محذوفة",
    visible: "مرئية",
    unknown: "غير معروف",
    actionTitle: "إجراء الإشراف",
    reason: "السبب",
    reasonPlaceholder: "اشرح سبب الحاجة لهذا الإجراء.",
    hide: "إخفاء الرسالة",
    unhide: "إظهار الرسالة",
    reasonRequired: "أضف سببا قبل الإرسال.",
    historyTitle: "سجل الإشراف",
    action: "الإجراء",
    moderator: "المشرف",
    createdAt: "تاريخ الإنشاء",
    delete: "حذف",
    emptyHistoryTitle: "لا يوجد سجل إشراف",
    emptyHistoryDescription: "ستظهر إجراءات الرسالة المحملة هنا بعد إنشائها.",
    actionComplete: "تم حفظ إجراء الإشراف.",
    actionFailed: "فشل الإجراء. حاول مرة أخرى.",
  },
};

type LocaleKey = keyof typeof labels;

export default function ModerationPage() {
  const locale = useLocale() as LocaleKey;
  const searchParams = useSearchParams();
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const [conversationId, setConversationId] = useState("");
  const {
    actions,
    error,
    isLoading,
    isMutating,
    loadConversation,
    load,
    message,
    conversation,
    messageId,
    runAction,
    senderParticipant,
    selectMessage,
    setMessageId,
  } = useModerationActions();

  useEffect(() => {
    const requestedMessageId = searchParams.get("messageId")?.trim();
    if (!requestedMessageId) return;
    setMessageId(requestedMessageId);
    void load(requestedMessageId);
  }, [load, searchParams, setMessageId]);

  const handleAction = async (
    action: SupportedModerationAction,
    reason?: string,
  ) => {
    try {
      await runAction(action, reason);
      showSuccess(t.actionComplete);
    } catch {
      showError(t.actionFailed);
    }
  };

  return (
    <div className="space-y-6">
      <CommunicationPageHeader title={t.title} description={t.description} />
      <CommunicationTabs />
      <SafetyNavigation />

      {error ? (
        <CommunicationErrorState title={t.errorTitle} message={error} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ModerationActionsPanel
            conversationId={conversationId}
            messageId={messageId}
            message={message}
            conversation={conversation}
            senderParticipant={senderParticipant}
            isLoading={isLoading}
            onConversationIdChange={(nextConversationId) => {
              setConversationId(nextConversationId);
              void loadConversation(nextConversationId);
            }}
            onMessageIdChange={setMessageId}
            onMessageChange={selectMessage}
            onLoad={() => load()}
            labels={{
              title: t.panelTitle,
              conversationSelect: t.conversationSelect,
              messageId: t.messageId,
              selectConversationFirst: t.selectConversationFirst,
              load: t.load,
              currentStatus: t.currentStatus,
              sender: t.sender,
              conversation: t.conversation,
              messageBody: t.messageBody,
              noMessage: t.noMessage,
              hidden: t.hidden,
              deleted: t.deleted,
              visible: t.visible,
              unknown: t.unknown,
            }}
          />
          <ModerationHistoryTable
            actions={actions}
            labels={{
              title: t.historyTitle,
              action: t.action,
              moderator: t.moderator,
              reason: t.reason,
              createdAt: t.createdAt,
              hide: t.hide,
              unhide: t.unhide,
              delete: t.delete,
              emptyTitle: t.emptyHistoryTitle,
              emptyDescription: t.emptyHistoryDescription,
              unknown: t.unknown,
            }}
          />
        </div>
        <ModerationActionForm
          disabled={!message}
          isSubmitting={isMutating}
          messageStatus={message?.status}
          onSubmit={handleAction}
          labels={{
            title: t.actionTitle,
            reason: t.reason,
            reasonPlaceholder: t.reasonPlaceholder,
            hide: t.hide,
            unhide: t.unhide,
            delete: t.delete,
            reasonRequired: t.reasonRequired,
          }}
        />
      </div>
    </div>
  );
}
