import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import EmojiPicker, { type EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";

import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function EmojiPickerButton({
  disabled,
  labels,
  onSelect,
}: {
  disabled: boolean;
  labels: ConversationRedesignLabels;
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={labels.emoji}
        disabled={disabled}
      >
        <Smile className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute bottom-full end-0 z-50 mb-2">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.LIGHT}
            width={350}
            height={400}
            searchPlaceHolder={labels.emoji}
            lazyLoadEmojis
          />
        </div>
      ) : null}
    </div>
  );
}
