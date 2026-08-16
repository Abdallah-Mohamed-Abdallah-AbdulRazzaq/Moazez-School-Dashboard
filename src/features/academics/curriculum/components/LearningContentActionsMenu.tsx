"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import type {
  LessonContentItem,
  LessonContentPublicationStatus,
} from "../services/curriculumService";

export type LearningContentAction =
  | "preview"
  | "download"
  | "moveUp"
  | "moveDown"
  | "edit"
  | "delete"
  | "publish"
  | "unpublish"
  | "archive";

type LearningContentActionsMenuProps = {
  contentItem: LessonContentItem;
  index: number;
  totalItems: number;
  isReadOnly: boolean;
  labels: Record<LearningContentAction | "menu", string>;
  onAction: (action: LearningContentAction) => void;
};

const statusActions: Record<
  LessonContentPublicationStatus,
  LearningContentAction[]
> = {
  draft: ["moveUp", "moveDown", "edit", "publish", "delete"],
  published: ["unpublish", "archive"],
  archived: [],
};

const actionIcons = {
  preview: <Eye className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  moveUp: <ArrowUp className="h-4 w-4" />,
  moveDown: <ArrowDown className="h-4 w-4" />,
  edit: <Pencil className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  publish: <Send className="h-4 w-4" />,
  unpublish: <RotateCcw className="h-4 w-4" />,
  archive: <Archive className="h-4 w-4" />,
};

export default function LearningContentActionsMenu({
  contentItem,
  index,
  totalItems,
  isReadOnly,
  labels,
  onAction,
}: LearningContentActionsMenuProps) {
  const actions = [
    ...(contentItem.file || contentItem.url ? (["preview"] as const) : []),
    ...(contentItem.file ? (["download"] as const) : []),
    ...statusActions[contentItem.publicationStatus],
  ];

  if (actions.length === 0) return null;

  return (
    <DropdownMenu
      disabled={isReadOnly && !contentItem.file && !contentItem.url}
      trigger={
        <button
          type="button"
          aria-label={labels.menu}
          className="rounded-md p-1.5 text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      }
      items={actions.map((action) => ({
        value: action,
        label: labels[action],
        icon: actionIcons[action],
        disabled:
          (isReadOnly && action !== "download" && action !== "preview") ||
          (action === "moveUp" && index === 0) ||
          (action === "moveDown" && index === totalItems - 1),
        onClick: () => onAction(action),
      }))}
    />
  );
}
