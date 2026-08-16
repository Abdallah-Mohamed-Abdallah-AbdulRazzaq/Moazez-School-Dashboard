"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getReactions } from "@/features/communication/api/communication.service";
import type {
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import { displayNameForUserId } from "@/features/communication/conversations_redesign/utils/displayNames";
import { formatTime } from "@/features/communication/conversations_redesign/utils/formatters";

const reactionLabel: Record<string, { en: string; ar: string }> = {
  like: { en: "Thanks / Like", ar: "شكراً / إعجاب" },
  love: { en: "Love", ar: "حب" },
  laugh: { en: "Laugh", ar: "ضحك" },
  wow: { en: "Wow", ar: "مندهش" },
  sad: { en: "Sad", ar: "حزين" },
  angry: { en: "Angry", ar: "غاضب" },
  thumbs_up: { en: "Thumbs Up", ar: "إعجاب" },
  thumbs_down: { en: "Thumbs Down", ar: "عدم إعجاب" },
};

const reactionEmojiMap: Record<string, string> = {
  thumbs_up: "👍",
  love: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
  thumbs_down: "👎",
  like: "🙏",
};

/* ------------------------------------------------------------------ */
/* Helper: unwrap API response                                         */
/* ------------------------------------------------------------------ */

function unwrapReactionsList(response: unknown): MessageReaction[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  const record = response as Record<string, unknown>;
  const sources = [record, record.data, record.result, record.payload];
  for (const source of sources) {
    if (source && typeof source === "object" && !Array.isArray(source)) {
      const items = (source as Record<string, unknown>).items;
      if (Array.isArray(items)) return items as MessageReaction[];
    }
    if (Array.isArray(source)) return source as MessageReaction[];
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface MessageReactionsListProps {
  messageId: string;
  labels: ConversationRedesignLabels;
  locale: string;
  currentUserId?: string | null;
  userDisplayNames: UserDisplayNameMap;
}

export default function MessageReactionsList({
  messageId,
  labels,
  locale,
  currentUserId,
  userDisplayNames,
}: MessageReactionsListProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ReactionType | "all">("all");

  const fetchReactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getReactions(messageId);
      setReactions(unwrapReactionsList(response));
    } catch {
      setError(
        locale === "ar" ? "تعذر تحميل التفاعلات." : "Unable to load reactions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [messageId, locale]);

  useEffect(() => {
    void Promise.resolve().then(fetchReactions);
  }, [fetchReactions]);

  /* Group reactions by type for the filter tabs */
  const grouped = reactions.reduce<Record<string, MessageReaction[]>>(
    (groups, reaction) => {
      const key = reaction.type || "like";
      return { ...groups, [key]: [...(groups[key] ?? []), reaction] };
    },
    {},
  );

  const filteredReactions =
    filterType === "all" ? reactions : (grouped[filterType] ?? []);

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ms-2 text-sm text-slate-500">{labels.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-sm text-rose-600">{error}</div>
    );
  }

  if (reactions.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        {locale === "ar" ? "لا توجد تفاعلات." : "No reactions yet."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <FilterTab
          active={filterType === "all"}
          count={reactions.length}
          label={labels.all}
          onClick={() => setFilterType("all")}
        />
        {Object.entries(grouped).map(([type, items]) => {
          const typeLabel =
            reactionLabel[type]?.[locale === "ar" ? "ar" : "en"] ?? type;
          return (
            <FilterTab
              key={type}
              active={filterType === type}
              count={items.length}
              icon={
                <span>{reactionEmojiMap[type] ?? "👍"}</span>
              }
              label={typeLabel}
              onClick={() => setFilterType(type as ReactionType)}
            />
          );
        })}
      </div>

      {/* Reactions list */}
      <ul className="divide-y divide-slate-100" role="list">
        {filteredReactions.map((reaction) => {
          const userName =
            reaction.actor?.name ??
            displayNameForUserId(
              reaction.userId,
              userDisplayNames,
              labels.someone,
            );
          const isOwn =
            currentUserId != null &&
            (reaction.userId === currentUserId ||
              reaction.actor?.userId === currentUserId ||
              reaction.actor?.id === currentUserId);
          const typeLabel =
            reactionLabel[reaction.type]?.[locale === "ar" ? "ar" : "en"] ??
            reaction.type;

          return (
            <li key={reaction.id} className="flex items-center gap-3 py-3">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-base ${
                  isOwn
                    ? "border-primary-200 bg-primary-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span>{reactionEmojiMap[reaction.type] ?? "👍"}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {userName}
                  {isOwn ? (
                    <span className="ms-1 text-xs font-normal text-slate-500">
                      ({labels.you})
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">{typeLabel}</p>
              </div>
              {reaction.createdAt ? (
                <span className="shrink-0 text-xs text-slate-400">
                  {formatTime(reaction.createdAt, locale)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter tab button                                                    */
/* ------------------------------------------------------------------ */

function FilterTab({
  active,
  count,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
          active ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
