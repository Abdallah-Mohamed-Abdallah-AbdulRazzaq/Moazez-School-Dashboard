"use client";

import type { ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type {
  TimetableDropRejection,
  TimetableDropTarget,
  TimetableLibraryItem,
} from "@/features/academics/timetable/services/timetableDragDrop";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

export interface TimetableDropDecision {
  allowed: boolean;
  tone: "VALID" | "WARNING" | "INVALID";
  reason?: TimetableDropRejection;
}

interface TimetableSlotControlProps {
  presentation: "desktop" | "mobile";
  target: TimetableDropTarget;
  entry?: TimetableEntry;
  selectedLibraryItem: TimetableLibraryItem | null;
  activeDragItem: TimetableLibraryItem | null;
  isReadOnly: boolean;
  isBlocked: boolean;
  accessibleName: string;
  className?: string;
  children: ReactNode;
  canDropOnSlot: (
    item: TimetableLibraryItem,
    target: TimetableDropTarget,
  ) => TimetableDropDecision;
  onPlaceItem: (
    item: TimetableLibraryItem,
    target: TimetableDropTarget,
  ) => void;
  onSlotClick: (dayKey: string, periodIndex: number) => void;
}

export default function TimetableSlotControl({
  presentation,
  target,
  entry,
  selectedLibraryItem,
  activeDragItem,
  isReadOnly,
  isBlocked,
  accessibleName,
  className = "",
  children,
  canDropOnSlot,
  onPlaceItem,
  onSlotClick,
}: TimetableSlotControlProps) {
  const dropId = slotInteractionId("drop", presentation, target);
  const dragId = entry
    ? slotInteractionId(`entry:${entry.id}`, presentation, target)
    : slotInteractionId("empty", presentation, target);
  const placementItem = activeDragItem ?? selectedLibraryItem;
  const decision = placementItem
    ? canDropOnSlot(placementItem, target)
    : null;
  const entryDragItem = entry?.subjectId
    ? { kind: "ENTRY" as const, id: `entry:${entry.id}`, entryId: entry.id }
    : null;
  const dragDisabled = isReadOnly || isBlocked || !entryDragItem;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { target },
    disabled: isReadOnly || isBlocked,
  });
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } =
    useDraggable({
      id: dragId,
      data: entryDragItem ? { item: entryDragItem, source: target } : undefined,
      disabled: dragDisabled,
    });
  const setInteractionRef = (element: HTMLButtonElement | null) => {
    setDropRef(element);
    setDragRef(element);
  };

  return (
    <button
      ref={setInteractionRef}
      type="button"
      disabled={isReadOnly || isBlocked}
      data-drop-state={decision?.tone}
      onClick={() => {
        if (selectedLibraryItem) {
          onPlaceItem(selectedLibraryItem, target);
          return;
        }
        onSlotClick(target.dayKey, target.periodIndex);
      }}
      className={`min-h-[80px] w-full text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${dropToneClass(
        decision?.tone,
        isOver,
      )} ${isDragging ? "opacity-40" : ""} ${className}`}
      {...(dragDisabled ? {} : attributes)}
      {...(dragDisabled ? {} : listeners)}
      aria-label={accessibleName}
      aria-disabled={
        isReadOnly || isBlocked || decision?.tone === "INVALID" || undefined
      }
    >
      {children}
    </button>
  );
}

function slotInteractionId(
  prefix: string,
  presentation: "desktop" | "mobile",
  target: TimetableDropTarget,
): string {
  return `${prefix}:${presentation}:${target.classroomId}:${target.dayKey}:${target.periodIndex}`;
}

function dropToneClass(
  tone: TimetableDropDecision["tone"] | undefined,
  isOver: boolean,
): string {
  if (tone === "INVALID") return "bg-red-50 ring-2 ring-inset ring-red-400";
  if (tone === "WARNING") return "bg-amber-50 ring-2 ring-inset ring-amber-400";
  if (tone === "VALID" && isOver)
    return "bg-green-50 ring-2 ring-inset ring-green-500";
  if (tone === "VALID") return "hover:bg-green-50/70";
  return "";
}
