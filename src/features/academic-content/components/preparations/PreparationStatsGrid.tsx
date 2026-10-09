"use client";

import { CheckCircle2, Clock3, FileText, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import type { TeacherPreparationCounts } from "../../hooks/useTeacherPreparations";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationCountKey } from "../../model/teacherPreparations";

const CARD_STYLES = {
  total: { icon: FileText, className: "bg-blue-50 text-blue-600" },
  draft: { icon: PencilLine, className: "bg-sky-50 text-sky-600" },
  pendingApproval: { icon: Clock3, className: "bg-amber-50 text-amber-600" },
  approved: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
} as const;

const LABEL_KEYS: Record<TeacherPreparationCountKey, string> = {
  total: "stats.total",
  draft: "stats.draft",
  pendingApproval: "stats.pending_approval",
  approved: "stats.approved",
};

interface PreparationStatsGridProps {
  counts: TeacherPreparationCounts;
  onRetry: (key: TeacherPreparationCountKey) => void;
}

export default function PreparationStatsGrid({ counts, onRetry }: PreparationStatsGridProps) {
  const t = useAcademicContentTranslations("teacher_preparations");

  return (
    <section aria-label={t("title")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(Object.keys(CARD_STYLES) as TeacherPreparationCountKey[]).map((key) => {
        const resource = counts[key];
        const { icon: Icon, className } = CARD_STYLES[key];
        return (
          <article key={key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${className}`}>
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-gray-600">{t(LABEL_KEYS[key])}</h2>
                {resource.isLoading ? (
                  <Skeleton className="mt-2 h-7 w-14" />
                ) : resource.error ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">{t("stats.unavailable")}</span>
                    <Button size="sm" variant="ghost" onClick={() => onRetry(key)}>{t("retry")}</Button>
                  </div>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-gray-950">{resource.data ?? 0}</p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
