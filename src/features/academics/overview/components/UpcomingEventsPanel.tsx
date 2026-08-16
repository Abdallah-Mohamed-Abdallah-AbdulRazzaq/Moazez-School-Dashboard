"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, Tag } from "lucide-react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { AcademicsOverviewResponse } from "../services/overviewApiAdapter";

interface UpcomingEventsPanelProps {
  events: AcademicsOverviewResponse["upcomingEvents"];
  isLoading?: boolean;
}

export default function UpcomingEventsPanel({ events, isLoading }: UpcomingEventsPanelProps) {
  const locale = useLocale();
  const t = useTranslations("academics.overview.upcomingEvents");
  const tTypes = useTranslations("academics.overview.upcomingEvents.types");
  const tScopes = useTranslations("academics.overview.upcomingEvents.scopes");

  const getEventTypeTranslation = (type: string) => {
    const key = type.toLowerCase();
    switch (key) {
      case "holiday":
        return tTypes("holiday");
      case "exam":
        return tTypes("exam");
      case "activity":
        return tTypes("activity");
      default:
        return tTypes("other");
    }
  };

  const getEventScopeTranslation = (type?: string) => {
    const key = type?.toLowerCase();
    switch (key) {
      case "school":
        return tScopes("school");
      case "stage":
        return tScopes("stage");
      case "grade":
        return tScopes("grade");
      case "section":
        return tScopes("section");
      default:
        return tScopes("other");
    }
  };

  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric" }),
    [locale]
  );

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <PartialLoader />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("title")}
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium mb-1">{t("emptyTitle")}</p>
          <p className="text-gray-500 text-sm max-w-sm">{t("emptyDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("title")}
      </h2>
      <div className="space-y-4 flex-1">
        {events.map((event) => {
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          const isSameDay = startDate.toDateString() === endDate.toDateString();

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow bg-gray-50/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded bg-blue-100 flex flex-col items-center justify-center border border-blue-200">
                  <span className="text-[10px] font-semibold text-blue-600 uppercase leading-none mb-1">
                    {monthFormatter.format(startDate)}
                  </span>
                  <span className="text-sm font-bold text-blue-900 leading-none">
                    {dayFormatter.format(startDate)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {getEventScopeTranslation(event.scope?.type)}
                    </span>
                    {event.allDay && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {t("allDay")}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1 shrink-0">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span>{getEventTypeTranslation(event.type)}</span>
                  </div>
                  
                  {!event.allDay && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>
                        {startDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                        {!isSameDay && ` - ${endDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </div>
                  )}

                  {!isSameDay && (
                    <div className="flex items-center gap-1 shrink-0 text-amber-600">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {t("until", { date: endDate.toLocaleDateString(locale) })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
