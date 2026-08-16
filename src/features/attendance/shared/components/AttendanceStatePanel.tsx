"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface AttendanceStatePanelProps {
  title: string;
  description?: string;
  compact?: boolean;
  action?: ReactNode;
}

export default function AttendanceStatePanel({
  title,
  description,
  compact = false,
  action,
}: AttendanceStatePanelProps) {
  return (
    <div className="flex items-center justify-center h-full p-10">
      <div className={`text-center ${compact ? "space-y-2" : "space-y-3"}`}>
        <AlertCircle
          className={`${compact ? "w-10 h-10" : "w-12 h-12"} mx-auto text-warning`}
          style={{ color: "var(--text-warning)" }}
        />
        <h3
          className={`${compact ? "text-base" : "text-lg"} font-medium`}
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        {description ? (
          <p style={{ color: "var(--text-muted)" }}>{description}</p>
        ) : null}
        {action ? <div className="flex justify-center pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
