"use client";

import { UserMinus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import type { UserBlock } from "@/features/communication/types/safety.types";

export interface BlocksTableLabels {
  emptyTitle: string;
  emptyDescription: string;
  targetUser: string;
  blockerUser: string;
  reason: string;
  createdAt: string;
  unblock: string;
  unknown: string;
}

export interface BlocksTableProps {
  blocks: UserBlock[];
  disabled?: boolean;
  labels: BlocksTableLabels;
  onDelete: (block: UserBlock) => void;
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

function targetName(block: UserBlock, fallback: string) {
  return (
    block.targetUser?.name ||
    block.targetUser?.nameEn ||
    block.targetUser?.nameAr ||
    block.targetUserId ||
    fallback
  );
}

export default function BlocksTable({
  blocks,
  disabled,
  labels,
  onDelete,
}: BlocksTableProps) {
  if (blocks.length === 0) {
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
            <th className="px-4 py-3 text-start font-semibold">
              {labels.blockerUser}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.reason}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.createdAt}
            </th>
            <th className="px-4 py-3 text-end font-semibold">
              {labels.unblock}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {blocks.map((block) => (
            <tr key={block.id} className="hover:bg-slate-50">
              <td className="max-w-56 truncate px-4 py-3 text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <UserMinus className="h-4 w-4 text-red-600" aria-hidden />
                  {targetName(block, labels.unknown)}
                </span>
              </td>
              <td className="max-w-56 truncate px-4 py-3 text-slate-700">
                {block.blockerUserId ?? labels.unknown}
              </td>
              <td className="max-w-72 truncate px-4 py-3 text-slate-700">
                {block.reason || labels.unknown}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(block.createdAt)}
              </td>
              <td className="px-4 py-3 text-end">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={disabled}
                  leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => onDelete(block)}
                >
                  {labels.unblock}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
