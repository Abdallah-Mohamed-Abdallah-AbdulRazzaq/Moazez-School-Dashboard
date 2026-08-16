import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CornerUpLeft,
  Copy,
  Smile,
  Edit3,
  Flag,
  Info,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";

import type { ReactionType } from "@/features/communication/types/message.types";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function BubbleContextMenu({
  allowReactions,
  canAttach = false,
  canEdit,
  canDelete,
  canReply = true,
  canReport = true,
  isOwn,
  labels,
  messageBody,
  onAddReaction,
  onAttach = () => undefined,
  onCopy,
  onDelete,
  onEdit,
  onInfo,
  onReply,
  onReport,
}: {
  allowReactions: boolean;
  canAttach?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReply?: boolean;
  canReport?: boolean;
  isOwn: boolean;
  labels: ConversationRedesignLabels;
  messageBody?: string;
  onAddReaction: (type: ReactionType) => Promise<unknown>;
  onAttach?: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onInfo: () => void;
  onReply: () => void;
  onReport: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    open,
    placement: isOwn ? "bottom-start" : "bottom-end",
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ["top-start", "top-end", "bottom"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const { setReference, setFloating } = refs;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`absolute top-1 z-40 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "start-1" : "end-1"}`}
    >
      <button
        ref={setReference}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${
          isOwn
            ? "bg-primary text-white/90"
            : "bg-white text-slate-400"
        }`}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div
          ref={setFloating}
          style={floatingStyles}
          dir="auto"
          className="z-50 min-w-[150px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {/* Reply */}
          {canReply ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReply();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <CornerUpLeft className="h-3.5 w-3.5" />
              {labels.reply}
            </button>
          ) : null}
          {/* Copy */}
          {messageBody ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCopy();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" />
              {labels.copy}
            </button>
          ) : null}
          {/* React */}
          {allowReactions ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void onAddReaction("thumbs_up");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Smile className="h-3.5 w-3.5" />
              {labels.like}
            </button>
          ) : null}
          {/* Edit (own messages only) */}
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {labels.editMessage}
            </button>
          ) : null}
          {canAttach ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAttach();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {labels.attachFileToMessage}
            </button>
          ) : null}
          {/* Report (other's messages only) */}
          {!isOwn && canReport ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-amber-600 hover:bg-amber-50"
            >
              <Flag className="h-3.5 w-3.5" />
              {labels.report}
            </button>
          ) : null}
          {/* Info / Read by (own messages only) */}
          {isOwn ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onInfo();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Info className="h-3.5 w-3.5" />
              {labels.messageInfo}
            </button>
          ) : null}
          {/* Delete (own messages only) */}
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {labels.deleteMessage}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
