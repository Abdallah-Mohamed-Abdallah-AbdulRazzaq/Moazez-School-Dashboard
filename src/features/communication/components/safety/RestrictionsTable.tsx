"use client";

import { Ban, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { Restriction } from "@/features/communication/types/safety.types";

export interface RestrictionsTableLabels {
  emptyTitle: string;
  emptyDescription: string;
  targetUser: string;
  type: string;
  reason: string;
  status: string;
  expiresAt: string;
  active: string;
  lifted: string;
  expired: string;
  revoked: string;
  edit: string;
  revoke: string;
  unknown: string;
}

export interface RestrictionsTableProps {
  restrictions: Restriction[];
  disabled?: boolean;
  labels: RestrictionsTableLabels;
  onEdit: (restriction: Restriction) => void;
  onRevoke: (restriction: Restriction) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  if (status === "active") return "error" as const;
  if (status === "expired") return "warning" as const;
  return "success" as const;
}

function statusLabel(status: string | undefined, labels: RestrictionsTableLabels) {
  if (status === "lifted") return labels.lifted;
  if (status === "expired") return labels.expired;
  if (status === "revoked") return labels.revoked;
  return labels.active;
}

function targetName(restriction: Restriction, fallback: string) {
  return (
    restriction.targetUser?.name ||
    restriction.targetUser?.nameEn ||
    restriction.targetUser?.nameAr ||
    restriction.targetUserId ||
    fallback
  );
}

function restrictionType(restriction: Restriction, fallback: string) {
  return restriction.type || fallback;
}

export default function RestrictionsTable({
  disabled,
  labels,
  onEdit,
  onRevoke,
  restrictions,
}: RestrictionsTableProps) {
  if (restrictions.length === 0) {
    return (
      <CommunicationEmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.targetUser}
            </th>
            <th className="px-4 py-3 text-start font-semibold">{labels.type}</th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.reason}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.status}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.expiresAt}
            </th>
            <th className="px-4 py-3 text-end font-semibold">{labels.edit}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {restrictions.map((restriction) => (
            <tr key={restriction.id} className="hover:bg-slate-50">
              <td className="max-w-56 truncate px-4 py-3 text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-600" aria-hidden />
                  {targetName(restriction, labels.unknown)}
                </span>
              </td>
              <td className="max-w-56 truncate px-4 py-3 text-slate-700">
                {restrictionType(restriction, labels.unknown)}
              </td>
              <td className="max-w-72 truncate px-4 py-3 text-slate-700">
                {restriction.reason || labels.unknown}
              </td>
              <td className="px-4 py-3">
                <CommunicationStatusChip
                  label={statusLabel(restriction.status, labels)}
                  tone={statusTone(restriction.status)}
                />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(restriction.expiresAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => onEdit(restriction)}
                  >
                    {labels.edit}
                  </Button>
                  {restriction.status !== "revoked" &&
                  restriction.status !== "lifted" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={disabled}
                      leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => onRevoke(restriction)}
                    >
                      {labels.revoke}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
