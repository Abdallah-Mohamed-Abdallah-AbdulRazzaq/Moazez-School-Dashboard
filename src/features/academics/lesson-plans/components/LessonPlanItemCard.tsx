"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  MoreVertical,
  GripVertical,
  FileText,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  CircleDot,
  Clock3,
  Edit3,
  Loader2,
  SkipForward,
  Trash2,
  XCircle,
} from "lucide-react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlanItem } from "@/features/academics/lesson-plans/services/lessonPlansService";
import DropdownMenu, {
  DropdownItem,
} from "@/components/ui/dropdown/DropdownMenu";
import { lessonPlanItemTransitions } from "./lessonPlanBoardActions";

interface LessonPlanItemCardProps {
  item: LessonPlanItem;
  lesson?: Lesson;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (
    itemId: string,
    status: "IN_PROGRESS" | "DONE" | "SKIPPED" | "CANCELLED",
  ) => void;
  onEditItem: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  isReadOnly: boolean;
  onReorder: (itemId: string, direction: "up" | "down") => void;
  disableMoveUp: boolean;
  disableMoveDown: boolean;
  isPending?: boolean;
}

export default function LessonPlanItemCard({
  item,
  lesson,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onEditItem,
  onRemove,
  isReadOnly,
  onReorder,
  disableMoveUp,
  disableMoveDown,
  isPending = false,
}: LessonPlanItemCardProps) {
  const t = useTranslations("academics.lessonPlans");
  const statusStyles = {
    PLANNED: "bg-gray-100 text-gray-700 border-gray-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
    DONE: "bg-green-100 text-green-700 border-green-200",
    SKIPPED: "bg-orange-100 text-orange-700 border-orange-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    RESCHEDULED: "bg-slate-100 text-slate-700 border-slate-200",
    UNKNOWN: "bg-gray-100 text-gray-700 border-gray-200",
  } satisfies Record<typeof item.status, string>;

  const hasNotes = Boolean(item.notesAr || item.notesEn);
  const plannedMeta = [item.plannedDate, item.periodLabel]
    .filter(Boolean)
    .join(" · ");

  const displayTitle = item.title || item.lessonTitle || lesson?.title;

  const menuItems: DropdownItem[] = useMemo(() => {
    const items: DropdownItem[] = [];
    const transitions = lessonPlanItemTransitions(item.status);

    items.push({
      label: t("actions.moveUp"),
      value: "move-up",
      icon: <ArrowUp className="h-4 w-4" />,
      disabled: disableMoveUp,
      onClick: () => onReorder(item.id, "up"),
    });
    items.push({
      label: t("actions.moveDown"),
      value: "move-down",
      icon: <ArrowDown className="h-4 w-4" />,
      disabled: disableMoveDown,
      onClick: () => onReorder(item.id, "down"),
    });

    if (transitions.includes("IN_PROGRESS")) {
      items.push({
        label: t("actions.markInProgress"),
        value: "in-progress",
        icon: <CircleDot className="h-4 w-4" />,
        onClick: () => onStatusChange(item.id, "IN_PROGRESS"),
      });
    }

    if (transitions.includes("DONE")) {
      items.push({
        label: t("actions.markDone"),
        value: "done",
        icon: <CheckCircle2 className="h-4 w-4" />,
        onClick: () => onStatusChange(item.id, "DONE"),
      });
    }

    if (transitions.includes("SKIPPED")) {
      items.push({
        label: t("actions.skip"),
        value: "skip",
        icon: <SkipForward className="h-4 w-4" />,
        onClick: () => onStatusChange(item.id, "SKIPPED"),
      });
    }

    if (transitions.includes("CANCELLED")) {
      items.push({
        label: t("actions.cancel"),
        value: "cancel",
        icon: <XCircle className="h-4 w-4" />,
        onClick: () => onStatusChange(item.id, "CANCELLED"),
      });
    }

    items.push({
      label: t("actions.editItem"),
      value: "edit-item",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: () => onEditItem(item.id),
    });

    items.push({
      label: t("actions.remove"),
      value: "remove",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => onRemove(item.id),
    });

    return items;
  }, [
    item.status,
    item.id,
    t,
    onStatusChange,
    onEditItem,
    onRemove,
    onReorder,
    disableMoveUp,
    disableMoveDown,
  ]);

  return (
    <div
      draggable={!isReadOnly && !isPending}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        p-3 rounded-lg border bg-white transition-all
        ${isPending ? "opacity-60" : ""}
        ${
          isReadOnly
            ? "border-gray-200 cursor-default"
            : "border-gray-200 hover:border-primary hover:shadow-sm cursor-grab active:cursor-grabbing"
        }
      `}
    >
      <div className="flex items-start gap-2">
        {!isReadOnly && !isPending && (
          <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayTitle}
          </p>
          {plannedMeta && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {plannedMeta}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 text-[0.65rem] font-medium border rounded ${statusStyles[item.status]}`}
            >
              {t(`status.${item.status}`)}
            </span>
            {hasNotes && (
              <FileText
                className="w-3 h-3 text-gray-400"
                aria-label={t("labels.hasNotes")}
              />
            )}
          </div>
        </div>

        {!isReadOnly && (
          <DropdownMenu
            trigger={
              <button
                type="button"
                aria-label={t("actions.lessonActions")}
                disabled={isPending}
                className="shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                ) : (
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                )}
              </button>
            }
            items={menuItems}
            width="w-48"
          />
        )}
      </div>
    </div>
  );
}
