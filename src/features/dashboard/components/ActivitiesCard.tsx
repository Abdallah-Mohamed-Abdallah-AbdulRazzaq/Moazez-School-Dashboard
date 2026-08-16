"use client";

import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DashboardActivityFeedViewModel } from "@/features/dashboard/mappers/dashboardViewMapper";

interface ActivitiesCardProps {
  activityFeed: DashboardActivityFeedViewModel;
  locale: string;
  recentActivitiesHref: string;
}

export default function ActivitiesCard({
  activityFeed,
  locale,
  recentActivitiesHref,
}: ActivitiesCardProps) {
  const t = useTranslations("dashboard_new");
  const hasActivities = activityFeed.items.length > 0;
  const isRtl = locale === "ar";
  const ActivityLinkIcon = isRtl ? ArrowLeft : ArrowRight;
  const actionLabel = activityFeed.pageInfo.hasMore
    ? t("activity_card.load_more")
    : t("activity_card.view_all");

  return (
    <div className="flex h-full flex-col gap-1 rounded-2xl border border-gray-200/80 bg-white/90 p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-extrabold text-gray-900">
          {t("activity_card.title")}
        </h3>
      </div>

      <div className="space-y-4">
        {!hasActivities ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <Activity className="mx-auto mb-2 h-6 w-6 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              {t("activity_card.empty_title")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t("activity_card.empty_description")}
            </p>
          </div>
        ) : null}

        {activityFeed.items.map((activityEntry) => (
          <div
            key={activityEntry.id}
            className="flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-gray-50"
          >
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {activityEntry.title}
              </p>
              <p className="text-xs text-gray-500">{activityEntry.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-500">
                <span className="rounded-full bg-gray-100 px-2 py-0.5">
                  {t(`sources.${activityEntry.source}`)}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">
                  {t(`actor_types.${activityEntry.actorType}`)}:{" "}
                  {activityEntry.actorName}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">
                  {activityEntry.subjectLabel}
                </span>
              </div>
            </div>
            <time className="shrink-0 text-xs text-gray-400">
              {formatActivityTime(activityEntry.occurredAt, locale)}
            </time>
          </div>
        ))}
      </div>

      <Link
        href={recentActivitiesHref}
        className={`mt-4 flex items-center justify-end gap-2 text-sm font-medium text-primary-600 hover:text-hover focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none rounded cursor-pointer duration-200 ${
          isRtl ? "mr-auto" : "ml-auto"
        }`}
      >
        {actionLabel}
        <ActivityLinkIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function formatActivityTime(occurredAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(occurredAt));
}
