"use client";

import {
  AlertCircle,
  CheckCheck,
  Clock3,
  Eye,
  MessageSquareText,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type {
  MessageInfo,
  MessageReader,
} from "@/features/communication/types/message.types";

interface MessageInfoDialogProps {
  error: string | null;
  messageInfo: MessageInfo | null;
  isLoading: boolean;
  isOpen: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  onClose: () => void;
  onRetry: () => void;
}

export default function MessageInfoDialog({
  error,
  messageInfo,
  isLoading,
  isOpen,
  labels,
  locale,
  onClose,
  onRetry,
}: MessageInfoDialogProps) {
  return (
    <Modal
      closeOnOverlayClick={false}
      description={labels.messageInfoDescription}
      icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={labels.messageDetails}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {labels.dismiss}
        </button>
      }
    >
      <div className="pb-5">
        {isLoading ? <MessageInfoSkeleton label={labels.loading} /> : null}
        {!isLoading && error ? (
          <MessageInfoError error={error} labels={labels} onRetry={onRetry} />
        ) : null}
        {!isLoading && !error && messageInfo ? (
          <MessageInfoContent
            messageInfo={messageInfo}
            labels={labels}
            locale={locale}
          />
        ) : null}
      </div>
    </Modal>
  );
}

function MessageInfoSkeleton({ label }: { label: string }) {
  return (
    <div aria-label={label} className="space-y-4">
      <div className="h-20 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
        <div className="h-20 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
      </div>
      <div className="h-28 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
    </div>
  );
}

function MessageInfoError({
  error,
  labels,
  onRetry,
}: {
  error: string;
  labels: ConversationRedesignLabels;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50/60 p-6 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-700 shadow-sm">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-950">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {labels.retry}
      </button>
    </div>
  );
}

function MessageInfoContent({
  messageInfo,
  labels,
  locale,
}: {
  messageInfo: MessageInfo;
  labels: ConversationRedesignLabels;
  locale: string;
}) {
  const recipientsCount = Math.max(messageInfo.participantsCount - 1, 0);
  const readSummary = messageReadSummary(
    messageInfo.readCount,
    recipientsCount,
    messageInfo.fullyRead,
    labels,
  );

  return (
    <div className="space-y-4">
      <SenderCard messageInfo={messageInfo} labels={labels} locale={locale} />

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          icon={readSummary.icon}
          label={readSummary.label}
          tone={readSummary.tone}
          value={`${messageInfo.readCount}/${recipientsCount}`}
        />
        <SummaryCard
          icon={UsersRound}
          label={labels.participantsCount}
          tone="neutral"
          value={String(messageInfo.participantsCount)}
        />
      </div>

      <section aria-labelledby="message-preview-title">
        <h3
          id="message-preview-title"
          className="text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          {labels.messageInfoPreview}
        </h3>
        <p
          dir="auto"
          className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 [overflow-wrap:anywhere]"
        >
          {messageInfo.message.body || messageInfo.message.content || "—"}
        </p>
      </section>

      <ReadersList
        labels={labels}
        locale={locale}
        readers={messageInfo.readers}
      />
    </div>
  );
}

function SenderCard({
  messageInfo,
  labels,
  locale,
}: {
  messageInfo: MessageInfo;
  labels: ConversationRedesignLabels;
  locale: string;
}) {
  const sender = messageInfo.message.sender;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {labels.messageInfoSender}
      </p>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-slate-950">
              {sender.displayName || labels.someone}
            </h3>
            {sender.isMe ? (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                {labels.you}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-600">
            {localizedUserType(sender.userType, labels)}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
        <MessageMetadata
          label={labels.messageInfoSentAt}
          value={formatMessageInfoDate(messageInfo.message.createdAt, locale)}
        />
        <MessageMetadata
          label={labels.messageInfoType}
          value={formatEnum(messageInfo.message.type)}
        />
        <MessageMetadata
          label={labels.messageInfoStatus}
          value={messageStatusLabel(messageInfo.message.status, labels)}
        />
      </dl>
    </section>
  );
}

function MessageMetadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof Eye;
  label: string;
  tone: "success" | "pending" | "neutral";
  value: string;
}) {
  const styles = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    pending: "border-amber-100 bg-amber-50 text-amber-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-3 ${styles[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <strong className="text-lg leading-none">{value}</strong>
      </div>
      <p className="mt-2 text-xs font-semibold leading-4">{label}</p>
    </div>
  );
}

function ReadersList({
  labels,
  locale,
  readers,
}: {
  labels: ConversationRedesignLabels;
  locale: string;
  readers: MessageReader[];
}) {
  return (
    <section aria-labelledby="message-readers-title">
      <h3
        id="message-readers-title"
        className="text-xs font-bold uppercase tracking-wide text-slate-500"
      >
        {labels.messageInfoReaders}
      </h3>
      {readers.length === 0 ? (
        <div className="mt-2 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <Eye
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <p className="text-sm leading-5 text-slate-600">
            {labels.messageInfoNoReaders}
          </p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {readers.map((reader) => (
            <ReaderRow
              key={reader.userId}
              labels={labels}
              locale={locale}
              reader={reader}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReaderRow({
  labels,
  locale,
  reader,
}: {
  labels: ConversationRedesignLabels;
  locale: string;
  reader: MessageReader;
}) {
  return (
    <li className="flex items-center gap-3 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <CheckCheck className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {reader.displayName}
          </p>
          {reader.isMe ? (
            <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">
              {labels.you}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">
          {localizedUserType(reader.userType, labels)}
        </p>
      </div>
      <time
        dateTime={reader.readAt}
        className="shrink-0 text-[11px] font-medium text-slate-500"
      >
        {formatMessageInfoDate(reader.readAt, locale)}
      </time>
    </li>
  );
}

function messageReadSummary(
  readCount: number,
  recipientsCount: number,
  fullyRead: boolean,
  labels: ConversationRedesignLabels,
): {
  icon: typeof Eye;
  label: string;
  tone: "success" | "pending" | "neutral";
} {
  if (fullyRead) {
    return {
      icon: CheckCheck,
      label: labels.messageInfoReadByEveryone,
      tone: "success",
    };
  }
  if (readCount === 0) {
    return {
      icon: Clock3,
      label: labels.messageInfoNotRead,
      tone: "neutral",
    };
  }
  return {
    icon: Eye,
    label: labels.messageInfoReadProgress
      .replace("{read}", String(readCount))
      .replace("{total}", String(recipientsCount)),
    tone: "pending",
  };
}

function formatMessageInfoDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function localizedUserType(
  userType: string | null,
  labels: ConversationRedesignLabels,
) {
  if (!userType) return "—";
  const labelKey = `userType_${userType}` as keyof ConversationRedesignLabels;
  return labels[labelKey] ?? formatEnum(userType);
}

function messageStatusLabel(
  status: string,
  labels: ConversationRedesignLabels,
) {
  if (status === "sent") return labels.sent;
  if (status === "failed") return labels.failed;
  return formatEnum(status);
}
