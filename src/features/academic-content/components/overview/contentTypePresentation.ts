import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  MessageSquareText,
  NotebookPen,
  Video,
} from "lucide-react";
import type { AcademicContentType } from "../../types/contracts";

interface ContentTypePresentation {
  icon: LucideIcon;
  iconClassName: string;
}

export const CONTENT_TYPE_PRESENTATION: Record<
  AcademicContentType,
  ContentTypePresentation
> = {
  TEACHER_PREPARATION: {
    icon: NotebookPen,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  WEEKLY_PLAN: {
    icon: CalendarDays,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  GUARDIAN_WEEKLY_NOTE: {
    icon: MessageSquareText,
    iconClassName: "bg-orange-50 text-orange-600",
  },
  SUBJECT_RESOURCE: {
    icon: FileText,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  ONLINE_SESSION: {
    icon: Video,
    iconClassName: "bg-rose-50 text-rose-600",
  },
  GENERAL_RESOURCE: {
    icon: FolderOpen,
    iconClassName: "bg-sky-50 text-sky-600",
  },
};
