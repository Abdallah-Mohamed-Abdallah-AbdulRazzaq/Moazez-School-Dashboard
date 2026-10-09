"use client";

import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Radio,
  Video,
} from "lucide-react";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { onlineSessionPageStats } from "../../model/onlineSessions";

const CARDS = [
  { key: "total", icon: Video, style: "bg-blue-50 text-blue-600" },
  {
    key: "upcomingOnPage",
    icon: CalendarClock,
    style: "bg-sky-50 text-sky-600",
  },
  { key: "liveOnPage", icon: Radio, style: "bg-emerald-50 text-emerald-600" },
  {
    key: "endedOnPage",
    icon: CheckCircle2,
    style: "bg-violet-50 text-violet-600",
  },
  { key: "draftOnPage", icon: FileText, style: "bg-amber-50 text-amber-600" },
] as const;

export default function OnlineSessionStatsGrid({
  stats,
  isLoading,
  isUnavailable,
}: {
  stats: ReturnType<typeof onlineSessionPageStats>;
  isLoading: boolean;
  isUnavailable: boolean;
}) {
  const t = useAcademicContentTranslations("online_sessions");
  return (
    <section
      aria-label={t("stats.label")}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {CARDS.map(({ key, icon: Icon, style }) => (
        <article
          key={key}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${style}`}
            >
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="text-sm font-medium text-gray-600">
                {t(`stats.${key}`)}
              </h2>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-14" />
              ) : (
                <p
                  className={`mt-1 text-2xl font-bold ${isUnavailable ? "text-gray-400" : "text-gray-950"}`}
                >
                  {isUnavailable ? "—" : stats[key]}
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
