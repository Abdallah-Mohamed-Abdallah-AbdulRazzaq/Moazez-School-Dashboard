"use client";

import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";

interface ReportsEmptyStateProps {
  title: string;
  description: string;
}

export default function ReportsEmptyState({ title, description }: ReportsEmptyStateProps) {
  return <AttendanceStatePanel title={title} description={description} />;
}
