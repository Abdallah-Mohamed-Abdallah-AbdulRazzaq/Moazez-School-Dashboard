"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Clock3, CheckCircle2, XCircle, Paperclip } from "lucide-react";
import type { ExcusesKpis } from "../types";

interface ExcusesKpisBarProps {
  kpis: ExcusesKpis;
}

export default function ExcusesKpisBar({ kpis }: ExcusesKpisBarProps) {
  const t = useTranslations("attendance.excuses.kpis");

  const cards = [
    { label: t("total"), value: kpis.total, icon: ClipboardList, fg: "var(--color-neutral-700)", bg: "var(--color-neutral-100)" },
    { label: t("pending"), value: kpis.pending, icon: Clock3, fg: "var(--color-warning-700)", bg: "var(--color-warning-100)" },
    { label: t("approved"), value: kpis.approved, icon: CheckCircle2, fg: "var(--color-success-700)", bg: "var(--color-success-100)" },
    { label: t("rejected"), value: kpis.rejected, icon: XCircle, fg: "var(--color-accent-700)", bg: "var(--color-accent-100)" },
    { label: t("withAttachments"), value: kpis.withAttachments, icon: Paperclip, fg: "var(--color-primary-700)", bg: "var(--color-primary-100)" },
  ];

  return (
    <div className="rounded-2xl border shadow-sm p-4" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                <Icon className="w-5 h-5" style={{ color: card.fg }} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
