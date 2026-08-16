import type { PropsWithChildren } from "react";
import AttendanceSurfaceCard from "./AttendanceSurfaceCard";

interface AttendanceFiltersPanelProps extends PropsWithChildren {
  className?: string;
}

export default function AttendanceFiltersPanel({
  children,
  className = "",
}: AttendanceFiltersPanelProps) {
  return (
    <AttendanceSurfaceCard className={`rounded-xl border p-4 ${className}`.trim()}>
      {children}
    </AttendanceSurfaceCard>
  );
}
