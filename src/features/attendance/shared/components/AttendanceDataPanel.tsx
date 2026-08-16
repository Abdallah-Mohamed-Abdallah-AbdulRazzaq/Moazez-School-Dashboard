"use client";

import type { ReactNode } from "react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface AttendanceDataPanelProps {
  loading?: boolean;
  children: ReactNode;
  className?: string;
  loaderClassName?: string;
  roundedClassName?: string;
}

export default function AttendanceDataPanel({
  loading = false,
  children,
  className = "rounded-xl border",
  loaderClassName = "h-full flex items-center justify-center py-4",
}: AttendanceDataPanelProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--card-background)",
        borderColor: "var(--border-color)",
      }}
    >
      {loading ? (
        <div className={loaderClassName}>
          <PartialLoader />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
