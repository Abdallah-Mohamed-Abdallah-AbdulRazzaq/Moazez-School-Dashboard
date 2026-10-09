import { AlertTriangle, Award, Bell, Calendar, Gift, Megaphone, MessageSquare, ShieldAlert, type LucideIcon } from "lucide-react";
import type { NotificationPresentationKind } from "./notificationPresentation";

interface NotificationAppearance {
  icon: LucideIcon;
  readIconClass: string;
  unreadIconClass: string;
}

const domainIcons: ReadonlyArray<readonly [string, LucideIcon]> = [
  ["attendance", Calendar],
  ["grade", Award],
  ["behavior", ShieldAlert],
  ["reinforcement", Gift],
  ["system", AlertTriangle],
];

const kindAppearances: Partial<Record<NotificationPresentationKind, NotificationAppearance>> = {
  message: {
    icon: MessageSquare,
    readIconClass: "bg-primary-50 text-primary-700",
    unreadIconClass: "bg-primary text-white",
  },
  announcement: {
    icon: Megaphone,
    readIconClass: "bg-violet-50 text-violet-700",
    unreadIconClass: "bg-violet-600 text-white",
  },
};

export function notificationAppearance(kind: NotificationPresentationKind, type?: string, sourceModule?: string): NotificationAppearance {
  const appearance = kindAppearances[kind];
  if (appearance) return appearance;
  const key = `${type ?? ""} ${sourceModule ?? ""}`.toLowerCase();
  return {
    icon: domainIcons.find(([keyword]) => key.includes(keyword))?.[1] ?? Bell,
    readIconClass: "bg-slate-100 text-slate-600",
    unreadIconClass: "bg-slate-800 text-white",
  };
}
