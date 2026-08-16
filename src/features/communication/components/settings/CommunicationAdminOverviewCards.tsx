"use client";

import { MessageSquare, ShieldAlert, Users } from "lucide-react";
import type { CommunicationAdminOverview } from "@/features/communication/types/communication.types";

export interface CommunicationAdminOverviewCardsLabels {
  conversations: string;
  openReports: string;
  activeRestrictions: string;
  activeBlocks: string;
}

export interface CommunicationAdminOverviewCardsProps {
  overview?: CommunicationAdminOverview | null;
  labels: CommunicationAdminOverviewCardsLabels;
}

export default function CommunicationAdminOverviewCards({
  labels,
  overview,
}: CommunicationAdminOverviewCardsProps) {
  const cards = [
    {
      label: labels.conversations,
      value: overview?.conversations.total ?? 0,
      icon: MessageSquare,
    },
    {
      label: labels.openReports,
      value: overview?.safety.openReports ?? 0,
      icon: ShieldAlert,
    },
    {
      label: labels.activeRestrictions,
      value: overview?.safety.activeRestrictions ?? 0,
      icon: ShieldAlert,
    },
    {
      label: labels.activeBlocks,
      value: overview?.safety.activeBlocks ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
