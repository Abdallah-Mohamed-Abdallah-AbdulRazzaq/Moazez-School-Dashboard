"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import Select from "@/components/ui/input/Select";

interface StudentsGuardiansYearTermContextBarProps {
  academicYearId: string | null;
  termId: string | null;
  termStatus: "open" | "closed" | null;
  academicYears: Array<{
    id: string;
    nameAr?: string;
    nameEn?: string;
    name: string;
  }>;
  terms: Array<{ id: string; name: string; nameAr?: string; nameEn?: string }>;
  isLoading?: boolean;
  onAcademicYearChange: (yearId: string) => void;
  onTermChange: (termId: string) => void;
  showTermSelector?: boolean;
}

export default function StudentsGuardiansYearTermContextBar({
  academicYearId,
  termId,
  termStatus,
  academicYears,
  terms,
  isLoading = false,
  onAcademicYearChange,
  onTermChange,
  showTermSelector = true,
}: StudentsGuardiansYearTermContextBarProps) {
  const t = useTranslations("students_guardians.shared.year_term_context");
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
  const statusClasses =
    termStatus === "open"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="border-b border-border bg-white">
      <button
        type="button"
        onClick={() => setIsCollapsed((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between border-b border-border bg-linear-to-l from-primary to-hover px-6 py-3 transition-all hover:from-hover hover:to-primary"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">{t("title")}</h3>
          {isCollapsed && selectedYear ? (
            <div className="flex items-center gap-2 text-sm text-white">
              <span>
                {locale === "ar"
                  ? selectedYear.nameAr || selectedYear.name
                  : selectedYear.nameEn || selectedYear.name}
              </span>
              {showTermSelector && selectedTerm ? (
                <>
                  <span className="text-gray-300">•</span>
                  <span>
                    {locale === "ar"
                      ? selectedTerm.nameAr || selectedTerm.name
                      : selectedTerm.nameEn || selectedTerm.name}
                  </span>
                  {termStatus ? (
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-medium ${statusClasses}`}
                    >
                      {termStatus === "open"
                        ? t("status_open")
                        : t("status_closed")}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="text-white">
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </button>

      {!isCollapsed ? (
        <div className="px-6 py-4">
          <div
            className={`grid grid-cols-1 gap-4 ${
              showTermSelector ? "lg:grid-cols-[1fr_1fr_auto]" : "lg:grid-cols-1"
            }`}
          >
            <Select
              label={t("academic_year")}
              value={academicYearId || ""}
              onChange={onAcademicYearChange}
              options={academicYearOptions}
              disabled={isLoading}
              selectSize="md"
            />
            {showTermSelector ? (
              <>
                <Select
                  label={t("term")}
                  value={termId || ""}
                  onChange={onTermChange}
                  options={termOptions}
                  disabled={isLoading || !academicYearId}
                  selectSize="md"
                />
                <div className="flex items-end">
                  {termStatus ? (
                    <span
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${statusClasses}`}
                    >
                      {termStatus === "open"
                        ? t("status_open")
                        : t("status_closed")}
                    </span>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
