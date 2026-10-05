"use client";

import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

export default function AcademicContentOverviewSkeleton() {
  const t = useAcademicContentTranslations("overview");

  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">{t("loading")}</span>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex gap-4">
              <Skeleton className="size-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
