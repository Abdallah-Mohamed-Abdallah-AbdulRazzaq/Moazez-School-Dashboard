"use client";

import { useTranslations } from "next-intl";
import { Filter, BookOpen } from "lucide-react";

interface MobileBottomBarProps {
  onOpenFilters: () => void;
  onOpenLibrary: () => void;
  hasFilters: boolean;
  isReadOnly: boolean;
}

export default function MobileBottomBar({
  onOpenFilters,
  onOpenLibrary,
  hasFilters,
  isReadOnly,
}: MobileBottomBarProps) {
  const t = useTranslations("academics.lessonPlans.mobile");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
      <div className="flex items-center justify-around p-3">
        <button
          onClick={onOpenFilters}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors relative"
        >
          <Filter className="w-5 h-5 text-gray-700" />
          <span className="text-xs font-medium text-gray-700">
            {t("openFilters")}
          </span>
          {hasFilters && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={onOpenLibrary}
          disabled={isReadOnly}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          <BookOpen className="w-5 h-5 text-gray-700" />
          <span className="text-xs font-medium text-gray-700">
            {t("openLibrary")}
          </span>
        </button>
      </div>
    </div>
  );
}
