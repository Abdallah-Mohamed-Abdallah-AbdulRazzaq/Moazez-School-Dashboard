"use client";

import { Ban, CircleStop, Loader2, MoreVertical, Send } from "lucide-react";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import type { HomeworkLifecycleAction } from "../utils/homeworkLifecycle";

const ACTION_ICONS = {
  publish: <Send className="h-4 w-4" />,
  close: <CircleStop className="h-4 w-4" />,
  cancel: <Ban className="h-4 w-4" />,
};

export default function HomeworkLifecycleMenu({
  actions,
  labels,
  isPending,
  onAction,
}: {
  actions: readonly HomeworkLifecycleAction[];
  labels: Record<HomeworkLifecycleAction | "menu", string>;
  isPending: boolean;
  onAction: (action: HomeworkLifecycleAction) => void;
}) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu
      disabled={isPending}
      trigger={
        <button
          type="button"
          aria-label={labels.menu}
          disabled={isPending}
          className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </button>
      }
      items={actions.map((action) => ({
        value: action,
        label: labels[action],
        icon: ACTION_ICONS[action],
        onClick: () => onAction(action),
      }))}
    />
  );
}
