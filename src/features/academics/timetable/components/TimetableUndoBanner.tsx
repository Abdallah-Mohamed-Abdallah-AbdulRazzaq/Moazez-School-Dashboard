"use client";

import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui";

interface TimetableUndoBannerProps {
  message: string;
  undoLabel: string;
  dismissLabel: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function TimetableUndoBanner({
  message,
  undoLabel,
  dismissLabel,
  onUndo,
  onDismiss,
}: TimetableUndoBannerProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-gray-800 print:hidden"
    >
      <span>{message}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onUndo}
          leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
        >
          {undoLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="px-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
