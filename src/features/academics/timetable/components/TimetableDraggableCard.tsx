"use client";

import type { ReactNode } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import type { TimetableLibraryItem } from "@/features/academics/timetable/services/timetableDragDrop";

interface TimetableDraggableCardProps {
  item: TimetableLibraryItem;
  selected: boolean;
  disabled: boolean;
  accessibleName: string;
  children: ReactNode;
  onSelect: (item: TimetableLibraryItem | null) => void;
}

export default function TimetableDraggableCard({
  item,
  selected,
  disabled,
  accessibleName,
  children,
  onSelect,
}: TimetableDraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: { item },
      disabled,
    });

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      onClick={() => onSelect(selected ? null : item)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`min-h-11 w-full cursor-grab rounded-lg border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-primary bg-primary-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50"
      } ${isDragging ? "z-30 opacity-50" : ""}`}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      aria-label={accessibleName}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

