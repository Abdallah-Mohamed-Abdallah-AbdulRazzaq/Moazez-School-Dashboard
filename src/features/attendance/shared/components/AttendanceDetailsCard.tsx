import type { PropsWithChildren } from "react";
import AttendanceSurfaceCard from "./AttendanceSurfaceCard";

interface AttendanceDetailsCardProps extends PropsWithChildren {
  className?: string;
}

export default function AttendanceDetailsCard({
  children,
  className = "",
}: AttendanceDetailsCardProps) {
  return (
    <AttendanceSurfaceCard
      className={`col-span-4 min-h-0 rounded-xl border overflow-hidden ${className}`.trim()}
    >
      {children}
    </AttendanceSurfaceCard>
  );
}
