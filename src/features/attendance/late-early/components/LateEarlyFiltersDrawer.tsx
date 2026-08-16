"use client";

import { useTranslations } from "next-intl";
import { Drawer } from "@mui/material";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import LateEarlyFiltersBar from "./LateEarlyFiltersBar";
import type { Classroom, Grade, Section, Stage } from "@/features/academics/academic-structure-tree/services/structureService";
import type { LateEarlyFilters } from "../types";
import { isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";

interface LateEarlyFiltersDrawerProps {
  isOpen: boolean;
  filters: LateEarlyFilters;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  onClose: () => void;
  onFiltersChange: (patch: Partial<LateEarlyFilters>) => void;
  onResetFilters: () => void;
  onApply: () => void;
  onOpenExport: () => void;
}

export default function LateEarlyFiltersDrawer({
  isOpen,
  filters,
  stages,
  grades,
  sections,
  classrooms,
  onClose,
  onFiltersChange,
  onResetFilters,
  onApply,
  onOpenExport,
}: LateEarlyFiltersDrawerProps) {
  const t = useTranslations("attendance.lateEarly.filters");
  const tCommon = useTranslations("common");
  const invalidDateRange = isInvalidDateRange(filters.dateFrom, filters.dateTo);

  return (
    <Drawer anchor="bottom" open={isOpen} onClose={onClose}>
      <div className="h-[85vh] flex flex-col" style={{ backgroundColor: "var(--card-background)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("filters")}
          </h3>
          <button onClick={onClose} className="p-1" style={{ color: "var(--text-secondary)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <LateEarlyFiltersBar
            filters={filters}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            onFiltersChange={onFiltersChange}
            onResetFilters={onResetFilters}
            onOpenExport={onOpenExport}
          />
        </div>

        <div className="p-4 border-t grid grid-cols-2 gap-3" style={{ borderColor: "var(--border-color)" }}>
          <Button variant="outline" onClick={onResetFilters}>
            {tCommon("reset")}
          </Button>
          <Button variant="primary" onClick={onApply} disabled={invalidDateRange}>
            {t("apply")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
