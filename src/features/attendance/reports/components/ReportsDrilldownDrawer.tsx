"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import DataTable from "@/components/ui/data-table/DataTable";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";

export interface ReportsDrilldownColumn {
  key: string;
  label: string;
}

export interface ReportsDrilldownState {
  title: string;
  description?: string;
  columns: ReportsDrilldownColumn[];
  rows: Array<Record<string, string | number>>;
  route?: "absences" | "lateEarly" | "excuses";
}

interface ReportsDrilldownDrawerProps {
  state: ReportsDrilldownState | null;
  open: boolean;
  onClose: () => void;
  onOpenRoute: (route: "absences" | "lateEarly" | "excuses") => void;
}

export default function ReportsDrilldownDrawer({
  state,
  open,
  onClose,
  onOpenRoute,
}: ReportsDrilldownDrawerProps) {
  const t = useTranslations("attendance.reportsPage.drilldown");
  const route = state?.route;

  const columns = (state?.columns || []).map((column) => ({
    key: column.key,
    label: column.label,
  }));

  return (
    <AttendanceBottomDrawer isOpen={open} onClose={onClose} heightClassName="h-[85vh]">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {state?.title || t("title")}
            </div>
            {state?.description ? (
              <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {state.description}
              </div>
            ) : null}
          </div>
          {route ? (
            <Button variant="outline" size="sm" onClick={() => onOpenRoute(route)}>
              {t(`openIn.${route}`)}
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1">
          {state && state.rows.length > 0 ? (
            <DataTable
              columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
              data={state.rows as unknown as { [key: string]: unknown }[]}
              itemsPerPage={15}
              showPagination
            />
          ) : (
            <div
              className="flex h-full items-center justify-center rounded-lg border text-sm"
              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            >
              {t("empty")}
            </div>
          )}
        </div>
      </div>
    </AttendanceBottomDrawer>
  );
}
