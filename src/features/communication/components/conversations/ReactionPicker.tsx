"use client";

import {
  Angry,
  Frown,
  Heart,
  Laugh,
  SmilePlus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import Button from "@/components/ui/button/Button";
import type { ReactionType } from "@/features/communication/types/message.types";

export interface ReactionPickerLabels {
  like: string;
  love: string;
  laugh: string;
  wow: string;
  sad: string;
  angry: string;
  thumbsUp: string;
  thumbsDown: string;
  removeReaction: string;
}

export interface ReactionPickerProps {
  labels: ReactionPickerLabels;
  disabled?: boolean;
  hasOwnReaction?: boolean;
  onReact: (type: ReactionType) => Promise<void> | void;
  onRemoveReaction: () => Promise<void> | void;
}

const reactionOptions: Array<{
  type: ReactionType;
  labelKey: keyof Omit<ReactionPickerLabels, "removeReaction">;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  { type: "like", labelKey: "like", icon: ThumbsUp },
  { type: "love", labelKey: "love", icon: Heart },
  { type: "laugh", labelKey: "laugh", icon: Laugh },
  { type: "wow", labelKey: "wow", icon: SmilePlus },
  { type: "sad", labelKey: "sad", icon: Frown },
  { type: "angry", labelKey: "angry", icon: Angry },
  { type: "thumbs_up", labelKey: "thumbsUp", icon: ThumbsUp },
  { type: "thumbs_down", labelKey: "thumbsDown", icon: ThumbsDown },
];

export default function ReactionPicker({
  disabled,
  hasOwnReaction,
  labels,
  onReact,
  onRemoveReaction,
}: ReactionPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactionOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.type}
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={labels[option.labelKey]}
            aria-label={labels[option.labelKey]}
            disabled={disabled}
            onClick={() => void onReact(option.type)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </button>
        );
      })}
      {hasOwnReaction ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          disabled={disabled}
          leftIcon={<X className="h-3 w-3" aria-hidden="true" />}
          onClick={() => void onRemoveReaction()}
        >
          {labels.removeReaction}
        </Button>
      ) : null}
    </div>
  );
}
