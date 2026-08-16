"use client";

import { Archive, Eye, Megaphone, Pencil, Send } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import CommunicationEmptyState from "@/features/communication/components/layout/CommunicationEmptyState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { Announcement } from "@/features/communication/types/announcement.types";

export interface AnnouncementListLabels {
  emptyTitle: string;
  emptyDescription: string;
  untitled: string;
  noBody: string;
  draft: string;
  published: string;
  archived: string;
  priority: string;
  view: string;
  edit: string;
  publish: string;
  archive: string;
}

export interface AnnouncementListProps {
  announcements: Announcement[];
  canManageActions: boolean;
  locale: string;
  disabled?: boolean;
  labels: AnnouncementListLabels;
  onPublish: (announcement: Announcement) => void;
  onArchive: (announcement: Announcement) => void;
}

function titleForAnnouncement(
  announcement: Announcement,
  locale: string,
  fallback: string,
) {
  const preferred =
    locale === "ar" ? announcement.titleAr : announcement.titleEn;
  const secondary =
    locale === "ar" ? announcement.titleEn : announcement.titleAr;
  return preferred || secondary || announcement.title || fallback;
}

function bodyForAnnouncement(
  announcement: Announcement,
  locale: string,
  fallback: string,
) {
  const preferred = locale === "ar" ? announcement.bodyAr : announcement.bodyEn;
  const secondary = locale === "ar" ? announcement.bodyEn : announcement.bodyAr;
  return preferred || secondary || announcement.body || fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status?: string) {
  if (status === "published") return "success" as const;
  if (status === "archived") return "warning" as const;
  return "info" as const;
}

function statusLabel(
  status: string | undefined,
  labels: AnnouncementListLabels,
) {
  if (status === "published") return labels.published;
  if (status === "archived") return labels.archived;
  return labels.draft;
}

export default function AnnouncementList({
  announcements,
  canManageActions,
  disabled,
  labels,
  locale,
  onArchive,
  onPublish,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <CommunicationEmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => {
        const status = announcement.status ?? "draft";
        const href = `/${locale}/communication/announcements/${announcement.id}`;
        return (
          <article
            key={announcement.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary-600" aria-hidden />
                  <CommunicationStatusChip
                    label={statusLabel(status, labels)}
                    tone={statusTone(status)}
                  />
                  {announcement.priority ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {labels.priority}: {announcement.priority}
                    </span>
                  ) : null}
                </div>
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {titleForAnnouncement(announcement, locale, labels.untitled)}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {bodyForAnnouncement(announcement, locale, labels.noBody)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(
                    announcement.publishedAt ?? announcement.updatedAt,
                  )}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Link href={href}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<Eye className="h-4 w-4" aria-hidden="true" />}
                  >
                    {labels.view}
                  </Button>
                </Link>
                {canManageActions && status === "draft" ? (
                  <>
                    <Link href={href}>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        leftIcon={
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        }
                      >
                        {labels.edit}
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      disabled={disabled}
                      leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => onPublish(announcement)}
                    >
                      {labels.publish}
                    </Button>
                  </>
                ) : null}
                {canManageActions && status !== "archived" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    leftIcon={
                      <Archive className="h-4 w-4" aria-hidden="true" />
                    }
                    onClick={() => onArchive(announcement)}
                  >
                    {labels.archive}
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
