"use client";

import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { ModerationAction } from "@/features/communication/types/safety.types";

export interface ModerationHistoryTableLabels {
  title: string;
  action: string;
  moderator: string;
  reason: string;
  createdAt: string;
  hide: string;
  unhide: string;
  delete: string;
  emptyTitle: string;
  emptyDescription: string;
  unknown: string;
}

export interface ModerationHistoryTableProps {
  actions: ModerationAction[];
  labels: ModerationHistoryTableLabels;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function actionLabel(action: string | undefined, labels: ModerationHistoryTableLabels) {
  if (action === "hide") return labels.hide;
  if (action === "unhide") return labels.unhide;
  if (action === "delete") return labels.delete;
  return action || labels.unknown;
}

function actionTone(action?: string) {
  if (action === "hide" || action === "delete") return "error" as const;
  if (action === "unhide") return "success" as const;
  return "info" as const;
}

function moderatorName(action: ModerationAction, fallback: string) {
  return (
    action.moderator?.name ||
    action.moderator?.nameEn ||
    action.moderator?.nameAr ||
    action.moderatorId ||
    fallback
  );
}

export default function ModerationHistoryTable({
  actions,
  labels,
}: ModerationHistoryTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        {labels.title}
      </h2>
      {actions.length === 0 ? (
        <CommunicationEmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.action}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.moderator}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.reason}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels.createdAt}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actions.map((action) => (
                <tr key={action.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <CommunicationStatusChip
                      label={actionLabel(action.action, labels)}
                      tone={actionTone(action.action)}
                    />
                  </td>
                  <td className="max-w-52 truncate px-3 py-3 text-slate-700">
                    {moderatorName(action, labels.unknown)}
                  </td>
                  <td className="max-w-72 truncate px-3 py-3 text-slate-700">
                    {action.reason || labels.unknown}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatDate(action.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
