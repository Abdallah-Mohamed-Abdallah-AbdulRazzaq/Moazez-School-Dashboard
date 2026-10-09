"use client";

import { BellRing, FileText, ListChecks, UsersRound } from "lucide-react";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { guardianNotePageStats } from "../../model/guardianNotes";

type GuardianNoteStats = ReturnType<typeof guardianNotePageStats>;

const CARDS = [
  { key: "total", icon: FileText, style: "bg-blue-50 text-blue-600" },
  { key: "pageItems", icon: ListChecks, style: "bg-sky-50 text-sky-600" },
  { key: "urgentOnPage", icon: BellRing, style: "bg-red-50 text-red-600" },
  {
    key: "acknowledgementOnPage",
    icon: UsersRound,
    style: "bg-amber-50 text-amber-600",
  },
] as const;

interface GuardianNoteStatsGridProps {
  stats: GuardianNoteStats;
  isLoading: boolean;
  isUnavailable: boolean;
}

export default function GuardianNoteStatsGrid({
  stats,
  isLoading,
  isUnavailable,
}: GuardianNoteStatsGridProps) {
  const t = useAcademicContentTranslations("guardian_notes");
  return (
    <section
      aria-label={t("stats.label")}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-gray-600">
                {t(`stats.${key}`)}
              </h2>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-14" />
              ) : isUnavailable ? (
                <p className="mt-1 text-2xl font-bold text-gray-400">—</p>
              ) : (
                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {stats[key]}
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
