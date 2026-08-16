"use client";

import { CheckCircle2, CircleAlert, CircleOff, Clock, Send } from "lucide-react";
import type {
  EmailConnection,
  EmailConnectionStatus,
} from "@/features/settings/email/connection/types";

interface EmailConnectionStatusCardProps {
  connection: EmailConnection | null;
  labels: {
    title: string;
    description: string;
    status: string;
    provider: string;
    lastTest: string;
    password: string;
    apiKey: string;
    configured: string;
    notConfigured: string;
    failureReason: string;
    failureReasonLabels: Record<string, string>;
    notAvailable: string;
    statusLabels: Record<EmailConnectionStatus, string>;
  };
}

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

function statusIcon(status: EmailConnectionStatus | null | undefined) {
  if (status === "ACTIVE" || status === "VERIFIED") {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
  if (status === "FAILED") {
    return <CircleAlert className="h-5 w-5 text-red-600" />;
  }
  if (status === "DISABLED") {
    return <CircleOff className="h-5 w-5 text-gray-500" />;
  }
  return <Clock className="h-5 w-5 text-amber-600" />;
}

export default function EmailConnectionStatusCard({
  connection,
  labels,
}: EmailConnectionStatusCardProps) {
  const statusClasses: Record<EmailConnectionStatus, string> = {
    DRAFT: "bg-amber-100 text-amber-700",
    VERIFIED: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-green-100 text-green-700",
    DISABLED: "bg-gray-100 text-gray-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-50 p-2">
          <Send className="h-5 w-5 text-gray-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {labels.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{labels.description}</p>
        </div>
        {statusIcon(connection?.status)}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase text-gray-500">
            {labels.status}
          </p>
          <div className="mt-2">
            {connection?.configured && connection.status ? (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[connection.status]}`}
              >
                {labels.statusLabels[connection.status]}
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                {labels.notAvailable}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase text-gray-500">
            {labels.provider}
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {connection?.providerType || labels.notAvailable}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase text-gray-500">
            {labels.lastTest}
          </p>
          <p className="mt-2 text-sm text-gray-900">
            {formatDate(connection?.lastTestedAt, labels.notAvailable)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase text-gray-500">
            {labels.password}
          </p>
          <p className="mt-2 text-sm text-gray-900">
            {connection?.hasPassword ? labels.configured : labels.notConfigured}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase text-gray-500">
            {labels.apiKey}
          </p>
          <p className="mt-2 text-sm text-gray-900">
            {connection?.hasApiKey ? labels.configured : labels.notConfigured}
          </p>
        </div>
        {connection?.failureReason ? (
          <div className="rounded-lg bg-red-50 p-3 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium uppercase text-red-700">
              {labels.failureReason}
            </p>
            <p className="mt-2 text-sm text-red-700">
              {labels.failureReasonLabels[connection.failureReason] ??
                labels.failureReasonLabels.unknown}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
