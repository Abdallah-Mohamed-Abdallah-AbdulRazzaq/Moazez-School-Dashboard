"use client";

import { CheckCircle2, Users } from "lucide-react";
import type { AnnouncementReadSummary as AnnouncementReadSummaryModel } from "@/features/communication/types/announcement.types";

export interface AnnouncementReadSummaryLabels {
  title: string;
  total: string;
  read: string;
  unread: string;
  noData: string;
}

export interface AnnouncementReadSummaryProps {
  summary?: AnnouncementReadSummaryModel | null;
  labels: AnnouncementReadSummaryLabels;
}

function percent(read?: number, total?: number) {
  if (!read || !total) return 0;
  return Math.round((read / total) * 100);
}

export default function AnnouncementReadSummary({
  labels,
  summary,
}: AnnouncementReadSummaryProps) {
  const total = summary?.totalRecipients ?? 0;
  const read = summary?.readCount ?? 0;
  const unread = summary?.unreadCount ?? Math.max(total - read, 0);
  const readPercent = percent(read, total);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary-600" aria-hidden />
        <h2 className="text-base font-semibold text-slate-900">
          {labels.title}
        </h2>
      </div>
      {!summary ? (
        <p className="text-sm text-slate-500">{labels.noData}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{labels.total}</p>
              <p className="text-xl font-semibold text-slate-900">{total}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">{labels.read}</p>
              <p className="text-xl font-semibold text-emerald-800">{read}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-700">{labels.unread}</p>
              <p className="text-xl font-semibold text-amber-800">{unread}</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary-600"
              style={{ width: `${readPercent}%` }}
            />
          </div>
          {summary.readers && summary.readers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.readers.slice(0, 8).map((reader) => (
                <span
                  key={reader.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                >
                  <Users className="h-3 w-3" aria-hidden />
                  {reader.name || reader.nameEn || reader.nameAr || reader.id}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
