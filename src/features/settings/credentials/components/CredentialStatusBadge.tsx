"use client";

import type { CredentialStatusFilter } from "@/features/settings/credentials/types";

interface CredentialStatusBadgeProps {
  status: CredentialStatusFilter;
  label: string;
}

const statusClasses: Record<CredentialStatusFilter, string> = {
  missing: "border-red-200 bg-red-50 text-red-700",
  set: "border-green-200 bg-green-50 text-green-700",
  temporary_or_must_change: "border-amber-200 bg-amber-50 text-amber-700",
  must_change: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function CredentialStatusBadge({
  status,
  label,
}: CredentialStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {label}
    </span>
  );
}
