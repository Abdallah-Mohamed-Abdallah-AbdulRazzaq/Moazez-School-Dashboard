"use client";

import {
  Angry,
  Frown,
  HandHeart,
  Heart,
  Laugh,
  SmilePlus,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { ComponentType } from "react";
import type {
  MessageReaction,
  ReactionType,
} from "@/features/communication/types/message.types";

export interface MessageReactionsLabels {
  like: string;
  love: string;
  laugh: string;
  wow: string;
  sad: string;
  angry: string;
  thumbsUp: string;
  thumbsDown: string;
}

export interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId?: string;
  labels: MessageReactionsLabels;
}

const reactionMeta: Record<
  string,
  {
    labelKey: keyof MessageReactionsLabels;
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }
> = {
  like: { labelKey: "like", icon: HandHeart },
  love: { labelKey: "love", icon: Heart },
  laugh: { labelKey: "laugh", icon: Laugh },
  wow: { labelKey: "wow", icon: SmilePlus },
  sad: { labelKey: "sad", icon: Frown },
  angry: { labelKey: "angry", icon: Angry },
  thumbs_up: { labelKey: "thumbsUp", icon: ThumbsUp },
  thumbs_down: { labelKey: "thumbsDown", icon: ThumbsDown },
};

function groupReactions(reactions: MessageReaction[]) {
  return reactions.reduce<Record<string, MessageReaction[]>>(
    (groups, reaction) => {
      const key = reaction.type || "like";
      return {
        ...groups,
        [key]: [...(groups[key] ?? []), reaction],
      };
    },
    {},
  );
}

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

export default function MessageReactions({
  currentUserId,
  labels,
  reactions,
}: MessageReactionsProps) {
  const grouped = groupReactions(reactions);
  const entries = Object.entries(grouped);

  if (entries.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {entries.map(([type, items]) => {
        const meta = reactionMeta[type as ReactionType] ?? reactionMeta.like;
        const isOwn = items.some(
          (reaction) => reaction.userId === currentUserId,
        );
        return (
          <span
            key={type}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
              isOwn
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            title={labels[meta.labelKey]}
          >
            <span>{reactionEmojiMap[type] ?? "👍"}</span>
            <span>{items.length}</span>
          </span>
        );
      })}
    </div>
  );
}
