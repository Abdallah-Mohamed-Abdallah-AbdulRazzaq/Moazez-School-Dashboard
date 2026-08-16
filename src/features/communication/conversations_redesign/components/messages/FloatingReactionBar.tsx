import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";

import type { ReactionType } from "@/features/communication/types/message.types";

export function FloatingReactionBar({
  isOwn,
  isActionPending,
  onReact,
}: {
  isOwn: boolean;
  isActionPending: boolean;
  onReact: (type: ReactionType) => Promise<unknown>;
}) {
  const [showBar, setShowBar] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    open: showBar,
    placement: "top",
    middleware: [
      offset(6),
      flip({ fallbackPlacements: ["bottom", "top-start", "top-end"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const { setReference, setFloating } = refs;

  useEffect(() => {
    if (!showBar) return;
    const handleClickOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowBar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showBar]);

  const quickReactions: { emoji: string; type: ReactionType }[] = [
    { emoji: "👍", type: "thumbs_up" },
    { emoji: "👎", type: "thumbs_down" },
    { emoji: "❤️", type: "love" },
    { emoji: "😂", type: "laugh" },
    { emoji: "😮", type: "wow" },
    { emoji: "😢", type: "sad" },
    { emoji: "😡", type: "angry" },
    { emoji: "🙏", type: "like" },
  ];

  return (
    <div ref={containerRef} className={`absolute bottom-1 z-30 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "start-[-36px]" : "end-[-36px]"}`}>
      {/* Smiley trigger button */}
      <button
        ref={setReference}
        type="button"
        onClick={() => setShowBar((prev) => !prev)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-600"
      >
        <Smile className="h-4 w-4" />
      </button>

      {/* Reaction bar popover */}
      {showBar ? (
        <div
          ref={setFloating}
          style={floatingStyles}
          className="z-50"
        >
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lg">
            {quickReactions.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  void onReact(item.type);
                  setShowBar(false);
                }}
                disabled={isActionPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xl transition hover:scale-125 hover:bg-slate-100 disabled:opacity-60"
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
