"use client";

import { useTranslations } from "next-intl";
import { UserX, UserCheck, Clock, LogOut, Calendar } from "lucide-react";
import type { AbsencesKPIs } from "../types";

interface AbsencesKpisBarProps {
  kpis: AbsencesKPIs;
}

export default function AbsencesKpisBar({ kpis }: AbsencesKpisBarProps) {
  const t = useTranslations("attendance.absences.kpis");

  const stats = [
    {
      label: t("totalIncidents"),
      value: kpis.totalIncidents,
      icon: Calendar,
      color: "var(--color-neutral-700)",
      bgColor: "var(--color-neutral-100)",
    },
    {
      label: t("absent"),
      value: kpis.absentCount,
      icon: UserX,
      color: "var(--color-accent-700)",
      bgColor: "var(--color-accent-100)",
    },
    {
      label: t("excused"),
      value: kpis.excusedCount,
      icon: UserCheck,
      color: "var(--color-success-700)",
      bgColor: "var(--color-success-100)",
    },
    {
      label: t("late"),
      value: kpis.lateCount,
      icon: Clock,
      color: "var(--color-warning-700)",
      bgColor: "var(--color-warning-100)",
    },
    {
      label: t("earlyLeave"),
      value: kpis.earlyLeaveCount,
      icon: LogOut,
      color: "var(--color-info-700)",
      bgColor: "var(--color-info-100)",
    },
    {
      label: t("dailyAbsent"),
      value: kpis.dailyAbsentCount,
      icon: UserX,
      color: "var(--color-accent-800)",
      bgColor: "var(--color-accent-50)",
    },
  ];

  return (
    <div
      className="rounded-2xl border shadow-sm p-4"
      style={{
        backgroundColor: "var(--card-background)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: stat.bgColor }}
              >
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
