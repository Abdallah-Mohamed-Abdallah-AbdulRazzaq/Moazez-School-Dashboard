"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type {
  MessageReportFiltersState,
  MessageReportStatusFilter,
} from "@/features/communication/hooks/useMessageReports";

export interface ReportFiltersProps {
  filters: MessageReportFiltersState;
  onChange: (filters: MessageReportFiltersState) => void;
  labels: {
    status: string;
    allStatuses: string;
    open: string;
    pending: string;
    inReview: string;
    resolved: string;
    dismissed: string;
    reason: string;
    allReasons: string;
    spam: string;
    harassment: string;
    bullying: string;
    abusiveLanguage: string;
    inappropriateContent: string;
    safety: string;
    privacy: string;
    other: string;
    clear: string;
  };
}

export default function ReportFilters({
  filters,
  labels,
  onChange,
}: ReportFiltersProps) {
  const statusOptions: Array<{ value: MessageReportStatusFilter; label: string }> = [
    { value: "", label: labels.allStatuses },
    { value: "open", label: labels.open },
    { value: "pending", label: labels.pending },
    { value: "in_review", label: labels.inReview },
    { value: "resolved", label: labels.resolved },
    { value: "dismissed", label: labels.dismissed },
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto] lg:items-end">
      <Select
        label={labels.status}
        value={filters.status}
        onChange={(value) =>
          onChange({ ...filters, page: 1, status: value as MessageReportStatusFilter })
        }
        options={statusOptions}
      />
      <Select
        label={labels.reason}
        value={filters.reason}
        onChange={(value) => onChange({ ...filters, page: 1, reason: value as typeof filters.reason })}
        options={[
          { value: "", label: labels.allReasons },
          { value: "spam", label: labels.spam },
          { value: "harassment", label: labels.harassment },
          { value: "bullying", label: labels.bullying },
          { value: "abusive_language", label: labels.abusiveLanguage },
          { value: "inappropriate_content", label: labels.inappropriateContent },
          { value: "safety", label: labels.safety },
          { value: "privacy", label: labels.privacy },
          { value: "other", label: labels.other },
        ]}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange({ ...filters, status: "", reason: "", page: 1 })}
        leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.clear}
      </Button>
    </div>
  );
}
