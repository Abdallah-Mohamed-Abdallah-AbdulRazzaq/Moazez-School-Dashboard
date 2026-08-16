import type { ComponentType } from "react";
import { Angry, Frown, HandHeart, Heart, Laugh, SmilePlus, ThumbsDown, ThumbsUp } from "lucide-react";

import type { ReactionType } from "@/features/communication/types/message.types";

export const REACTION_OPTIONS: {
  type: ReactionType;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  color: string;
  emoji: string;
}[] = [
  { type: "thumbs_up", icon: ThumbsUp, label: "👍 Thumbs Up", color: "text-blue-600", emoji: "👍" },
  { type: "love", icon: Heart, label: "❤️ Love", color: "text-rose-500", emoji: "❤️" },
  { type: "laugh", icon: Laugh, label: "😂 Laugh", color: "text-amber-500", emoji: "😂" },
  { type: "wow", icon: SmilePlus, label: "😮 Wow", color: "text-amber-600", emoji: "😮" },
  { type: "sad", icon: Frown, label: "😢 Sad", color: "text-indigo-500", emoji: "😢" },
  { type: "angry", icon: Angry, label: "😡 Angry", color: "text-red-600", emoji: "😡" },
  { type: "thumbs_down", icon: ThumbsDown, label: "👎 Thumbs Down", color: "text-slate-600", emoji: "👎" },
  { type: "like", icon: HandHeart, label: "🙏 Like", color: "text-blue-500", emoji: "🙏" },
];
