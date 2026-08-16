"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Bell,
  BellOff,
  Edit3,
  Lock,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import type { Conversation } from "@/features/communication/types/conversation.types";
import type { CommunicationRecord } from "@/features/communication/types/communication.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import { getAvatarUrl, getAvatarFileId } from "@/features/communication/conversations_redesign/utils/displayNames";
import {
  conversationTypeLabel,
  getTitle,
  numberValue,
} from "@/features/communication/conversations_redesign/utils/formatters";

export default function ConversationHeader({
  canManageConversation = true,
  canMute = true,
  conversation,
  isMuted,
  isLoading,
  labels,
  onArchive,
  onBack,
  onClose,
  onEdit,
  onMuteToggle,
  onRefresh,
  onReopen,
  readOnly,
}: {
  canManageConversation?: boolean;
  canMute?: boolean;
  conversation: Conversation | null;
  isMuted: boolean;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  onArchive: () => void;
  onBack: () => void;
  onClose: () => void;
  onEdit: () => void;
  onMuteToggle: () => void;
  onRefresh: () => void;
  onReopen: () => void;
  readOnly: boolean;
}) {
  const title = conversation
    ? getTitle(labels, conversation)
    : labels.untitledConversation;
  const avatar = getAvatarUrl(conversation);
  const avatarFileId = getAvatarFileId(conversation);
  const participantsCount =
    conversation?.participantsCount ??
    numberValue(
      (conversation as CommunicationRecord | null)?.participants_count,
    );
  const typeLabel = conversationTypeLabel(conversation?.type, labels);
  const status = conversation?.status;
  const canArchive = canManageConversation && status === "active";
  const canClose = canManageConversation && status === "active";
  const canReopen =
    canManageConversation && (status === "archived" || status === "closed");

  return (
    <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 md:hidden cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          aria-label={labels.backToConversations}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <Avatar avatarUrl={avatar} fileId={avatarFileId} name={title} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-950">
              {isLoading ? labels.loading : title}
            </h2>
            {readOnly ? (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                <Lock className="h-3 w-3" />
                {labels.readOnly}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs capitalize text-slate-600">
            <span>{typeLabel}</span>
            {participantsCount ? (
              <>
                <span aria-hidden="true">{"\u2022"}</span>
                <span>
                  {participantsCount} {labels.participantsCount}
                </span>
              </>
            ) : null}
            {status && status !== "active" ? (
              <>
                <span aria-hidden="true">{"\u2022"}</span>
                <span className="font-medium text-amber-600">{status}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-slate-500">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          aria-label={labels.refreshConversation}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        {canManageConversation || canMute ? (
          <HeaderActionsMenu
            canArchive={canArchive}
            canClose={canClose}
            canEdit={canManageConversation}
            canMute={canMute}
            canReopen={canReopen}
            isMuted={isMuted}
            labels={labels}
            onArchive={onArchive}
            onClose={onClose}
            onEdit={onEdit}
            onMuteToggle={onMuteToggle}
            onReopen={onReopen}
          />
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="hidden h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-700 md:inline-flex cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          aria-label={labels.backToConversations}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function HeaderActionsMenu({
  canArchive,
  canClose,
  canEdit,
  canMute,
  canReopen,
  isMuted,
  labels,
  onArchive,
  onClose,
  onEdit,
  onMuteToggle,
  onReopen,
}: {
  canArchive: boolean;
  canClose: boolean;
  canEdit: boolean;
  canMute: boolean;
  canReopen: boolean;
  isMuted: boolean;
  labels: ConversationRedesignLabels;
  onArchive: () => void;
  onClose: () => void;
  onEdit: () => void;
  onMuteToggle: () => void;
  onReopen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
        aria-label={labels.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {canEdit ? (
            <MenuButton
              icon={<Edit3 className="h-4 w-4" />}
              label={labels.editConversation}
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            />
          ) : null}
          {canMute ? (
            <MenuButton
              icon={isMuted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              label={isMuted ? labels.unmuteConversation : labels.muteConversation}
              onClick={() => {
                setOpen(false);
                onMuteToggle();
              }}
            />
          ) : null}
          {canReopen ? (
            <MenuButton
              icon={<RotateCcw className="h-4 w-4" />}
              label={labels.reopenConversation}
              onClick={() => {
                setOpen(false);
                onReopen();
              }}
            />
          ) : null}
          {canArchive ? (
            <MenuButton
              icon={<Archive className="h-4 w-4" />}
              label={labels.archiveConversation}
              onClick={() => {
                setOpen(false);
                onArchive();
              }}
              variant="warning"
            />
          ) : null}
          {canClose ? (
            <MenuButton
              icon={<XCircle className="h-4 w-4" />}
              label={labels.closeConversation}
              onClick={() => {
                setOpen(false);
                onClose();
              }}
              variant="danger"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "warning" | "danger";
}) {
  const colorClass =
    variant === "danger"
      ? "text-rose-700 hover:bg-rose-50"
      : variant === "warning"
        ? "text-amber-700 hover:bg-amber-50"
        : "text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus:outline-none ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
