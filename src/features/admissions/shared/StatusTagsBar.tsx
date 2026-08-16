// FILE: src/components/admissions/StatusTagsBar.tsx

"use client";

import StatusBadge from "./StatusBadge";
import {
  LeadStatus,
  ApplicationStatus,
  TestStatus,
  InterviewStatus,
} from "@/features/admissions/types/admissions";

type Status = LeadStatus | ApplicationStatus | TestStatus | InterviewStatus;

interface StatusTagsBarProps<T extends { status: Status }> {
  data: T[];
  totalLabel?: string;
}

export default function StatusTagsBar<T extends { status: Status }>({
  data,
  totalLabel = "Total",
}: StatusTagsBarProps<T>) {
  // Calculate status counts
  const statusCounts = data.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<Status, number>,
  );

  // Get unique statuses in the data
  const uniqueStatuses = Object.keys(statusCounts) as Status[];

  return (
    <div className="flex items-center gap-3 flex-wrap p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Total Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">
          {totalLabel}:
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-200 text-gray-900">
          {data.length}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Status Counts */}
      {uniqueStatuses.map((status) => (
        <div key={status} className="flex items-center gap-2">
          <StatusBadge
            status={
              status as
                | LeadStatus
                | ApplicationStatus
                | TestStatus
                | InterviewStatus
            }
            size="sm"
          />
          <span className="text-sm font-semibold text-gray-700">
            {statusCounts[status]}
          </span>
        </div>
      ))}
    </div>
  );
}
