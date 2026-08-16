"use client";

import type { ReactNode } from "react";

interface AttendanceSurfaceCardProps {
  children: ReactNode;
  className?: string;
}

export default function AttendanceSurfaceCard({
  children,
  className = "",
}: AttendanceSurfaceCardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--card-background)",
        borderColor: "var(--border-color)",
      }}
    >
      {children}
    </div>
  );
}
