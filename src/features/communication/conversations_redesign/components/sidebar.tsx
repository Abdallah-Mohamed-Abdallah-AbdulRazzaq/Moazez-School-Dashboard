"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Lock,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
  MessageCircle,
  BookOpen,
  SlidersHorizontal,
  X,
  Menu,
} from "lucide-react";
import { useLocale } from "next-intl";
import Input from "@/components/ui/input/Input";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import {
  labelsForLocale,
  type ConversationRedesignLabels,
} from "@/features/communication/conversations_redesign/labels";
import { formatTime } from "@/features/communication/conversations_redesign/utils/formatters";
import type {
  ConversationFiltersState,
  ConversationListItemModel,
} from "@/features/communication/hooks/useConversations";
import type { ConversationStatus } from "@/features/communication/types/conversation.types";

export type ConversationRedesignFilter =
  | "all"
  | "active"
  | "pinned"
  | "archived"
  | "closed";

export interface ConversationSidebarProps {
  conversations: ConversationListItemModel[];
  error?: string | null;
  selectedConversationId?: string | null;
  filter: ConversationRedesignFilter;
  typeFilter: string;
  search: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onSelect: (conversationId: string) => void;
  onFilterChange: (filter: ConversationRedesignFilter) => void;
  onTypeFilterChange: (type: string) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreateConversation: () => void;
  canCreateConversation?: boolean;
  className?: string;
  loadMore?: () => void;
  hasMore?: boolean;
}

const primaryFilters: Array<{
  value: ConversationRedesignFilter;
  labelKey: "all" | "active" | "pinned" | "archived" | "closed";
}> = [
  { value: "all", labelKey: "all" },
  { value: "active", labelKey: "active" },
  { value: "pinned", labelKey: "pinned" },
];

const secondaryFilters: typeof primaryFilters = [
  { value: "archived", labelKey: "archived" },
  { value: "closed", labelKey: "closed" },
];

const statusByRedesignFilter: Partial<
  Record<ConversationRedesignFilter, ConversationStatus | "all">
> = {
  all: "all",
  pinned: "all",
  active: "active",
  archived: "archived",
  closed: "closed",
};

export function statusForRedesignFilter(
  filter: ConversationRedesignFilter,
): ConversationFiltersState["status"] {
  return (statusByRedesignFilter[filter] ??
    "all") as ConversationFiltersState["status"];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function conversationTitle(
  conversation: ConversationListItemModel,
  labels: ConversationRedesignLabels,
) {
  return (
    conversation.titleEn ||
    conversation.title ||
    conversation.titleAr ||
    labels.untitledConversation
  );
}

function conversationAvatar(conversation: ConversationListItemModel) {
  const record = conversation as Record<string, unknown>;
  return (
    stringValue(record.avatarUrl) ||
    stringValue(record.avatar) ||
    stringValue(record.imageUrl)
  );
}

function formatConversationTime(
  value: string | null | undefined,
  locale: string,
  labels: ConversationRedesignLabels,
) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) {
    return formatTime(value, locale);
  }
  if (diffDays === 1) return labels.yesterday;
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function lastMessagePreview(
  conversation: ConversationListItemModel,
  labels: ReturnType<typeof labelsForLocale>,
) {
  if (!conversation.lastMessage) return labels.noMessagesYet;
  if (conversation.lastMessage.status === "deleted")
    return labels.messageDeleted;
  const body = conversation.lastMessage.body;
  if (!body) return labels.noMessagesYet;
  return conversation.lastMessage.senderName
    ? `${conversation.lastMessage.senderName}: ${body}`
    : body;
}

function rowMatchesFilter(
  conversation: ConversationListItemModel,
  filter: ConversationRedesignFilter,
  typeFilter?: string,
) {
  if (typeFilter && conversation.type !== typeFilter) return false;
  if (filter === "pinned") return Boolean(conversation.isPinned);
  if (filter === "archived" || filter === "closed") {
    return conversation.status === filter;
  }
  if (filter === "active") return conversation.status === "active";
  return true;
}

function ConversationTypeBadge({
  type,
  labels,
}: {
  type?: string;
  labels: ConversationRedesignLabels;
}) {
  const config: Record<
    string,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    direct: {
      icon: <MessageCircle className="h-2.5 w-2.5" />,
      label: labels.direct,
      color: "text-sky-700",
    },
    group: {
      icon: <Users className="h-2.5 w-2.5" />,
      label: labels.group,
      color: "text-violet-700",
    },
    classroom: {
      icon: <BookOpen className="h-2.5 w-2.5" />,
      label: labels.classType,
      color: "text-amber-700",
    },
  };

  const entry = config[type ?? ""] ?? {
    icon: <MessageCircle className="h-2.5 w-2.5" />,
    label: type ?? labels.direct,
    color: "text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold tracking-wide ${entry.color}`}
    >
      {entry.icon}
      {entry.label}
    </span>
  );
}

export default function ConversationSidebar({
  canCreateConversation = true,
  className = "",
  conversations,
  error = null,
  filter,
  typeFilter,
  isLoading,
  isRefreshing,
  onCreateConversation,
  onFilterChange,
  onTypeFilterChange,
  onRefresh,
  onSearchChange,
  onSelect,
  search,
  selectedConversationId,
  loadMore,
  hasMore,
}: ConversationSidebarProps) {
  const locale = useLocale();
  const labels = labelsForLocale(locale);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isFilterMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!filterMenuRef.current?.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsFilterMenuOpen(false);
      filterTriggerRef.current?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    filterMenuRef.current
      ?.querySelector<HTMLButtonElement>('[role^="menuitem"]')
      ?.focus();
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterMenuOpen]);

  const activeAdditionalFilterCount =
    (secondaryFilters.some((item) => item.value === filter) ? 1 : 0) +
    (typeFilter ? 1 : 0);

  const visibleConversations = conversations.filter((c) =>
    rowMatchesFilter(c, filter, typeFilter),
  );

  const pinnedConversations = visibleConversations.filter((c) => c.isPinned);
  const unpinnedConversations = visibleConversations.filter((c) => !c.isPinned);

  return (
    <aside
      aria-label={labels.conversations}
      className={`flex h-full min-h-0 flex-col border-e border-slate-200 bg-white ${className}`}
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
              className="lg:hidden inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-black">
                {labels.conversations}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {visibleConversations.length > 0
                  ? labels.nConversations.replace(
                      "{n}",
                      String(visibleConversations.length),
                    )
                  : labels.manageSchoolCommunication}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-busy={isRefreshing}
              aria-label={labels.refreshConversations}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "motion-safe:animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
            {canCreateConversation ? (
              <button
                type="button"
                onClick={onCreateConversation}
                aria-label={labels.createConversation}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchConversations}
            type="search"
            variant="default"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 ps-9 pe-9 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={labels.clearSearch}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {primaryFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => onFilterChange(item.value)}
                className={`h-8 shrink-0 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  filter === item.value
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {labels[item.labelKey]}
              </button>
            ))}
          </div>
          <div className="relative" ref={filterMenuRef}>
            <button
              ref={filterTriggerRef}
              type="button"
              aria-label={labels.filters}
              aria-haspopup="menu"
              aria-expanded={isFilterMenuOpen}
              onClick={() => setIsFilterMenuOpen((current) => !current)}
              className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeAdditionalFilterCount > 0
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeAdditionalFilterCount > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {activeAdditionalFilterCount}
                </span>
              ) : null}
              <ChevronDown className="h-3 w-3" />
            </button>
            {isFilterMenuOpen ? (
              <div
                role="menu"
                className="absolute end-0 top-full z-30 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
              >
                <FilterMenuLabel>{labels.type}</FilterMenuLabel>
                <FilterMenuItem
                  checked={!typeFilter}
                  label={labels.allTypes}
                  onClick={() => onTypeFilterChange("")}
                />
                <FilterMenuItem
                  checked={typeFilter === "direct"}
                  label={labels.direct}
                  onClick={() => onTypeFilterChange("direct")}
                />
                <FilterMenuItem
                  checked={typeFilter === "group"}
                  label={labels.group}
                  onClick={() => onTypeFilterChange("group")}
                />
                <FilterMenuItem
                  checked={typeFilter === "classroom"}
                  label={labels.classType}
                  onClick={() => onTypeFilterChange("classroom")}
                />
                <div className="my-1 border-t border-slate-100" />
                <FilterMenuLabel>{labels.filters}</FilterMenuLabel>
                {secondaryFilters.map((item) => (
                  <FilterMenuItem
                    key={item.value}
                    checked={filter === item.value}
                    label={labels[item.labelKey]}
                    onClick={() => onFilterChange(item.value)}
                  />
                ))}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onFilterChange("all");
                    onTypeFilterChange("");
                    setIsFilterMenuOpen(false);
                  }}
                  className="mt-1 flex w-full cursor-pointer items-center rounded-md border-t border-slate-100 px-2 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {labels.clearFilters}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="min-h-0 flex-1 overflow-y-auto" onScroll={(event) => {
        if (isLoading || isRefreshing || !hasMore || !loadMore) return;
        const target = event.currentTarget;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
          loadMore();
        }
      }}>
        {isLoading ? (
          <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            className="space-y-0"
          >
            <span className="sr-only">{labels.loadingConversations}</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="flex items-start gap-3 border-b border-slate-100 px-4 py-3"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 motion-safe:animate-pulse" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-3/4 rounded bg-slate-200 motion-safe:animate-pulse" />
                  <div className="h-2.5 w-1/2 rounded bg-slate-100 motion-safe:animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <CommunicationErrorState
              message={error}
              action={
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {labels.retry}
                </button>
              }
            />
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <MessageCircle className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {labels.noConversationsFound}
            </p>
            {filter !== "all" || typeFilter || search ? (
              <button
                type="button"
                onClick={() => {
                  onFilterChange("all");
                  onTypeFilterChange("");
                  onSearchChange("");
                }}
                className="mt-3 cursor-pointer text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {labels.clearFilters}
              </button>
            ) : canCreateConversation ? (
              <button
                type="button"
                onClick={onCreateConversation}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {labels.createConversation}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinnedConversations.length > 0 && (
              <>
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/90 px-4 py-2 backdrop-blur-sm">
                  <Pin className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">
                    {labels.pinned}
                  </span>
                </div>
                {pinnedConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    selected={selectedConversationId === c.id}
                    locale={locale}
                    labels={labels}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}

            {/* All others */}
            {unpinnedConversations.length > 0 && (
              <>
                {pinnedConversations.length > 0 && (
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/90 px-4 py-2 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      {labels.recent}
                    </span>
                  </div>
                )}
                {unpinnedConversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    selected={selectedConversationId === c.id}
                    locale={locale}
                    labels={labels}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function FilterMenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

function FilterMenuItem({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-start text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">
        {checked ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
      </span>
      {label}
    </button>
  );
}

function ConversationRow({
  conversation,
  selected,
  locale,
  labels,
  onSelect,
}: {
  conversation: ConversationListItemModel;
  selected: boolean;
  locale: string;
  labels: ReturnType<typeof labelsForLocale>;
  onSelect: (id: string) => void;
}) {
  const record = conversation as Record<string, unknown>;
  const title = conversationTitle(conversation, labels);
  const avatar = conversationAvatar(conversation);
  const lastTime =
    conversation.lastMessage?.createdAt ||
    (record.lastMessageAt as string | undefined) ||
    conversation.updatedAt ||
    conversation.createdAt;
  const preview = lastMessagePreview(conversation, labels);
  const unread = conversation.unreadCount ?? 0;
  const participantCount =
    (record.activeParticipantsCount as number | undefined) ??
    (record.participantsCount as number | undefined) ??
    (record.participantCount as number | undefined);
  const isReadOnly = Boolean(record.isReadOnly);
  const isOfficial = Boolean(record.isOfficial);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`group relative flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-start transition-all duration-150 ${
        selected
          ? "border-b-slate-100 border-s-2 border-s-primary bg-primary-50 ps-[14px]"
          : "border-b-slate-100 border-s-2 border-s-transparent hover:bg-slate-50"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar
          avatarUrl={avatar}
          fileId={stringValue(record.avatarFileId)}
          name={title}
          size="md"
        />
        {/* Online dot placeholder — kept for future presence support */}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Row 1: title + badges + time */}
        <div className="flex items-center gap-1.5">
          <span
            data-testid="conversation-title"
            className={`truncate text-sm font-semibold leading-5 ${
              selected ? "text-primary-700" : "text-slate-900"
            } ${unread > 0 ? "text-primary" : ""}`}
          >
            {title}
          </span>
          <ConversationTypeBadge type={conversation.type} labels={labels} />
          {isOfficial && (
            <span
              className="inline-flex shrink-0 text-emerald-600"
              title={labels.official}
            >
              <Shield className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{labels.official}</span>
            </span>
          )}
          {isReadOnly && (
            <span
              className="inline-flex shrink-0 text-slate-500"
              title={labels.readOnlyBadge}
            >
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{labels.readOnlyBadge}</span>
            </span>
          )}
          <span className="ms-auto shrink-0 text-[11px] text-slate-600">
            {formatConversationTime(lastTime, locale, labels)}
          </span>
        </div>

        {/* Row 2: last message preview + participant count + unread badge */}
        <div className="flex items-center gap-2">
          <p
            className={`flex-1 truncate text-[11px] leading-4 ${
              unread > 0 ? "font-medium text-slate-800" : "text-slate-500"
            }`}
          >
            {preview}
          </p>
          {participantCount !== undefined && participantCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-600">
              <Users className="h-2.5 w-2.5" />
              {participantCount}
            </span>
          )}
          {unread > 0 && (
            <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm shadow-primary/30">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
