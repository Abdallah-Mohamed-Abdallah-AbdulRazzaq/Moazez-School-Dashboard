"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface HeroJourneyMobilePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function HeroJourneyMobilePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: HeroJourneyMobilePaginationProps) {
  const t = useTranslations("heroJourney.pagination");
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {t("showing")} {startItem} {t("to")} {endItem} {t("of")} {totalItems}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-gray-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={t("previous_page")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[72px] text-center text-sm font-medium text-gray-700">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-gray-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={t("next_page")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
