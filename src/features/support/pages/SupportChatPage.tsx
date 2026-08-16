"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import {
  MessageComposer,
  MessagesPanel,
} from "@/features/communication/conversations_redesign/components/MessagesPanel";
import { ToastMessage } from "@/features/communication/conversations_redesign/components/ToastMessage";
import { labelsForLocale } from "@/features/communication/conversations_redesign/labels";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { useSchoolSupportChat } from "@/features/support/hooks/useSchoolSupportChat";
import SupportPermissionGuard from "../components/SupportPermissionGuard";

const copy = {
  en: {
    title: "Moazez Support",
    subtitle: "Live chat support",
    back: "Back to help",
    closed: "This support conversation is closed.",
  },
  ar: {
    title: "دعم معزز",
    subtitle: "الدعم بالمحادثة المباشرة",
    back: "العودة للمساعدة",
    closed: "تم إغلاق محادثة الدعم هذه.",
  },
} as const;

export default function SupportChatPage() {
  return (
    <SupportPermissionGuard permission="school.support.view">
      <SupportChatContent />
    </SupportPermissionGuard>
  );
}

function SupportChatContent() {
  const locale = useLocale();
  const router = useRouter();
  const labels = labelsForLocale(locale);
  const pageLabels = locale === "ar" ? copy.ar : copy.en;
  const supportChat = useSchoolSupportChat();
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const toast =
    supportChat.error && supportChat.error !== dismissedError
      ? supportChat.error
      : null;

  return (
    <main className="flex h-[calc(100dvh-96px)] min-h-[620px] min-w-0 flex-col overflow-hidden bg-slate-50 text-slate-950">
      <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/help`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={pageLabels.back}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <Avatar name={pageLabels.title} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-slate-950">
              {pageLabels.title}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span>{pageLabels.subtitle}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void supportChat.refresh()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={labels.refreshConversation}
        >
          {supportChat.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </button>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden">
        <MessagesPanel
          allowActions={false}
          allowReactions={false}
          attachmentsByMessageId={{}}
          currentUserId={supportChat.currentUserId}
          currentUserName={supportChat.currentUserName}
          error={supportChat.error}
          hasOlderMessages={supportChat.hasOlderMessages}
          isLoading={supportChat.isLoading}
          isLoadingOlder={supportChat.isLoadingOlder}
          labels={labels}
          locale={locale}
          messages={supportChat.messages}
          onAddReaction={async () => undefined}
          onAttachFile={async () => undefined}
          onDeleteAttachment={async () => undefined}
          onDeleteMessage={async () => undefined}
          onInfo={() => undefined}
          onLoadOlder={() => void supportChat.loadOlderMessages()}
          onRemoveReaction={async () => undefined}
          onReply={() => undefined}
          onReport={() => undefined}
          onRetry={() => void supportChat.refresh()}
          onStartEdit={() => undefined}
          reactionsByMessageId={{}}
          typingUsers={[]}
          uploadingMessageId={null}
          userDisplayNames={{
            "moazez-support": pageLabels.title,
          }}
        />
      </section>

      {supportChat.isClosed ? (
        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <div className="flex min-h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-center text-sm font-medium text-slate-500">
            {pageLabels.closed}
          </div>
        </div>
      ) : (
        <MessageComposer
          allowAttachments={false}
          allowVoice={false}
          disabled={
            !supportChat.canSend ||
            supportChat.isSending ||
            supportChat.isLoading
          }
          editingMessage={null}
          labels={labels}
          onCancelEdit={() => undefined}
          onCancelReply={() => undefined}
          onEditMessage={async () => undefined}
          onSend={supportChat.send}
          onSendVoice={async () => undefined}
          onSendWithAttachment={async () => undefined}
          onStopTyping={() => undefined}
          onTyping={() => undefined}
          replyTo={null}
        />
      )}

      {toast ? (
        <ToastMessage
          tone="error"
          message={toast}
          closeLabel={labels.dismiss}
          onClose={() => setDismissedError(toast)}
        />
      ) : null}
    </main>
  );
}
