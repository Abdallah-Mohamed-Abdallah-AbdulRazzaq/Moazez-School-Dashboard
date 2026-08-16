"use client";

import { ShieldAlert } from "lucide-react";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { MessageReport } from "@/features/communication/types/safety.types";

export interface ReportDetailsPanelLabels {
  title: string;
  status: string;
  reason: string;
  spam: string;
  harassment: string;
  bullying: string;
  abusiveLanguage: string;
  inappropriateContent: string;
  safety: string;
  privacy: string;
  other: string;
  description: string;
  reporter: string;
  messageId: string;
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
  open: string;
  inReview: string;
  resolved: string;
  unknown: string;
}

export interface ReportDetailsPanelProps {
  report?: MessageReport | null;
  labels: ReportDetailsPanelLabels;
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

function statusTone(status?: string) {
  if (status === "resolved") return "success" as const;
  if (status === "in_review") return "warning" as const;
  return "error" as const;
}

function statusLabel(status: string | undefined, labels: ReportDetailsPanelLabels) {
  if (status === "resolved") return labels.resolved;
  if (status === "in_review") return labels.inReview;
  return labels.open;
}

function reasonLabel(
  reason: string | null | undefined,
  labels: ReportDetailsPanelLabels,
) {
  switch (reason) {
    case "spam":
      return labels.spam;
    case "harassment":
      return labels.harassment;
    case "bullying":
      return labels.bullying;
    case "abusive_language":
      return labels.abusiveLanguage;
    case "inappropriate_content":
      return labels.inappropriateContent;
    case "safety":
      return labels.safety;
    case "privacy":
      return labels.privacy;
    case "other":
      return labels.other;
    default:
      return labels.unknown;
  }
}

function reporterName(report: MessageReport, fallback: string) {
  return (
    report.reporter?.name ||
    report.reporter?.nameEn ||
    report.reporter?.nameAr ||
    report.reporterId ||
    fallback
  );
}

export default function ReportDetailsPanel({
  labels,
  report,
}: ReportDetailsPanelProps) {
  if (!report) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
      </div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">{labels.status}</dt>
          <dd className="mt-1">
            <CommunicationStatusChip
              label={statusLabel(report.status, labels)}
              tone={statusTone(report.status)}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.reporter}</dt>
          <dd className="font-medium text-slate-800">
            {reporterName(report, labels.unknown)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.messageId}</dt>
          <dd className="break-all font-medium text-slate-800">
            {report.messageId ?? labels.unknown}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.reason}</dt>
          <dd className="font-medium text-slate-800">
            {reasonLabel(report.reasonCode ?? report.reason, labels)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-slate-500">{labels.description}</dt>
          <dd className="whitespace-pre-wrap text-slate-800">
            {report.reasonText || report.description || report.comment || report.details || labels.unknown}
          </dd>
        </div>
        {report.resolutionNote ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">{labels.resolutionNote}</dt>
            <dd className="whitespace-pre-wrap text-slate-800">
              {report.resolutionNote}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-slate-500">{labels.createdAt}</dt>
          <dd className="font-medium text-slate-800">
            {formatDate(report.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.updatedAt}</dt>
          <dd className="font-medium text-slate-800">
            {formatDate(report.updatedAt)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
