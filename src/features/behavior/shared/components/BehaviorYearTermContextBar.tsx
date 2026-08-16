"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import Select from "@/components/ui/input/Select";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface BehaviorYearTermContextBarProps {
  academicYearId: string | null;
  termId: string | null;
  termStatus: "open" | "closed" | null;
  academicYears: AcademicYear[];
  terms: Term[];
  isLoading?: boolean;
  onAcademicYearChange: (yearId: string) => void;
  onTermChange: (termId: string) => void;
}

export default function BehaviorYearTermContextBar({
  academicYearId,
  termId,
  termStatus,
  academicYears,
  terms,
  isLoading = false,
  onAcademicYearChange,
  onTermChange,
}: BehaviorYearTermContextBarProps) {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const academicYearOptions = academicYears.map((year) => ({
    value: year.id,
    label: locale === "ar" ? year.nameAr || year.name : year.nameEn || year.name,
  }));

  const termOptions = terms.map((term) => ({
    value: term.id,
    label: locale === "ar" ? term.nameAr || term.name : term.nameEn || term.name,
  }));

  const selectedYear = academicYears.find((year) => year.id === academicYearId);
  const selectedTerm = terms.find((term) => term.id === termId);

  return (
    <div className="bg-white border-b border-border">
      <button
        onClick={() => setIsCollapsed((value) => !value)}
        className="flex w-full items-center justify-between border-b border-border bg-linear-to-l from-primary to-hover px-6 py-3 transition-all hover:from-hover hover:to-primary"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">{t("title")}</h3>
          {isCollapsed && selectedYear && selectedTerm && (
            <div className="flex items-center gap-2 text-sm text-white">
              <span>
                {locale === "ar"
                  ? selectedYear.nameAr || selectedYear.name
                  : selectedYear.nameEn || selectedYear.name}
              </span>
              <span className="text-gray-300">•</span>
              <span>
                {locale === "ar"
                  ? selectedTerm.nameAr || selectedTerm.name
                  : selectedTerm.nameEn || selectedTerm.name}
              </span>
              {termStatus && (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    termStatus === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {termStatus === "open" ? "Active" : "Closed"}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-white">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <Select
              label={locale === "ar" ? "السنة الأكاديمية" : "Academic Year"}
              value={academicYearId || ""}
              onChange={onAcademicYearChange}
              options={academicYearOptions}
              disabled={isLoading}
              selectSize="md"
            />
            <Select
              label={locale === "ar" ? "الفصل الدراسي" : "Term"}
              value={termId || ""}
              onChange={onTermChange}
              options={termOptions}
              disabled={isLoading || !academicYearId}
              selectSize="md"
            />
            <div className="flex items-end">
              {termStatus && (
                <span
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    termStatus === "open"
                      ? "border-green-200 bg-green-100 text-green-700"
                      : "border-gray-200 bg-gray-100 text-gray-700"
                  }`}
                >
                  {termStatus === "open" ? "Active" : "Closed"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
