"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Clock3, LogOut, ListChecks, TimerReset } from "lucide-react";
import type { LateEarlyKpis } from "../types";

interface LateEarlyKpisBarProps {
  kpis: LateEarlyKpis;
}

export default function LateEarlyKpisBar({ kpis }: LateEarlyKpisBarProps) {
  const t = useTranslations("attendance.lateEarly.kpis");

  const cards = [
    { label: t("totalIncidents"), value: kpis.totalIncidents, icon: ListChecks, fg: "var(--color-neutral-700)", bg: "var(--color-neutral-100)" },
    { label: t("totalLate"), value: kpis.totalLate, icon: Clock3, fg: "var(--color-warning-700)", bg: "var(--color-warning-100)" },
    { label: t("totalEarlyLeave"), value: kpis.totalEarlyLeave, icon: LogOut, fg: "var(--color-info-700)", bg: "var(--color-info-100)" },
    { label: t("avgLateMinutes"), value: kpis.avgLateMinutes, icon: TimerReset, fg: "var(--color-primary-700)", bg: "var(--color-primary-100)" },
    { label: t("avgEarlyLeaveMinutes"), value: kpis.avgEarlyLeaveMinutes, icon: TimerReset, fg: "var(--color-hover-700)", bg: "var(--color-hover-100)" },
    { label: t("violations"), value: kpis.violationsCount, icon: AlertTriangle, fg: "var(--color-accent-700)", bg: "var(--color-accent-100)" },
  ];

  return (
    <div
      className="rounded-2xl border shadow-sm p-4"
      style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                <Icon className="w-5 h-5" style={{ color: card.fg }} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {card.value}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  {card.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
