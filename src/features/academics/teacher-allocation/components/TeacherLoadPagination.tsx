"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";

interface TeacherLoadPaginationProps {
  currentPage: number;
  pageSize: number;
  totalTeachers: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function TeacherLoadPagination(props: TeacherLoadPaginationProps) {
  const t = useTranslations("common");
  const { currentPage, pageSize, totalTeachers, onPageSizeChange } = props;
  const firstTeacher = (currentPage - 1) * pageSize + 1;
  const lastTeacher = Math.min(currentPage * pageSize, totalTeachers);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-28">
          <Select
            label={t("show")}
            value={String(pageSize)}
            selectSize="sm"
            onChange={(selectedSize) => onPageSizeChange(Number(selectedSize))}
            options={[10, 25, 50, 100].map((size) => ({ value: String(size), label: String(size) }))}
          />
        </div>
        <span className="text-sm text-slate-600">
          {t("showing")} {firstTeacher} {t("to")} {lastTeacher} {t("of")} {totalTeachers} {t("entries")}
        </span>
      </div>
      <PageNavigation {...props} />
    </div>
  );
}

function PageNavigation({ currentPage, pageSize, totalTeachers, onPageChange }: TeacherLoadPaginationProps) {
  const t = useTranslations("common");
  const totalPages = Math.ceil(totalTeachers / pageSize);
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={t("previous_page")}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </Button>
      <span className="text-sm font-medium text-slate-700">{currentPage} / {totalPages}</span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={t("next_page")}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
