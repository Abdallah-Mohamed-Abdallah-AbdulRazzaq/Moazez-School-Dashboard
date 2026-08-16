"use client";

import { Drawer } from "@mui/material";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ExcusesFiltersBar from "./ExcusesFiltersBar";
import type { ExcuseRequestFilters } from "../types";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface ExcusesFiltersDrawerProps {
  isOpen: boolean;
  filters: ExcuseRequestFilters;
  onClose: () => void;
  onApply: () => void;
  onFiltersChange: (patch: Partial<ExcuseRequestFilters>) => void;
  onReset: () => void;
  onOpenExport: () => void;
}

export default function ExcusesFiltersDrawer({
  isOpen,
  filters,
  onClose,
  onApply,
  onFiltersChange,
  onReset,
  onOpenExport,
}: ExcusesFiltersDrawerProps) {
  const t = useTranslations("attendance.excuses.filters");
  const tCommon = useTranslations("common");
  const invalidDateRange = isInvalidDateRange(filters.dateFrom, filters.dateTo);

  return (
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className="h-[85vh] flex flex-col" style={{ backgroundColor: "var(--card-background)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{t("filters")}</h3>
          <button onClick={onClose} className="p-1" style={{ color: "var(--text-secondary)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ExcusesFiltersBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            onReset={onReset}
            onOpenExport={onOpenExport}
          />
        </div>

        <div className="p-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: "var(--border-color)" }}>
          <Button variant="outline" onClick={onReset}>{tCommon("reset")}</Button>
          <Button variant="primary" onClick={onApply} disabled={invalidDateRange}>{t("apply")}</Button>
        </div>
      </div>
    </Drawer>
  );
}
