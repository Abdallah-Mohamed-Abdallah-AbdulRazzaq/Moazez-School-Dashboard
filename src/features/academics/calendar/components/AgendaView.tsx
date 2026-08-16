"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, MapPin } from "lucide-react";
import {
  AcademicEvent,
  formatCalendarDate,
  parseCalendarDate,
} from "@/features/academics/calendar/services/calendarService";

interface AgendaViewProps {
  currentDate: Date;
  events: AcademicEvent[];
  onEventClick: (event: AcademicEvent) => void;
}

export default function AgendaView({
  currentDate,
  events,
  onEventClick,
}: AgendaViewProps) {
  const t = useTranslations("academics.calendar");
  const locale = useLocale();

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Map<string, AcademicEvent[]> = new Map();

    const rangeStart = new Date(currentDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 90);

    // Sort events by start date
    const sortedEvents = [...events].sort((a, b) => 
      a.startDate.localeCompare(b.startDate)
    );

    sortedEvents.forEach((event) => {
      const startDate = parseCalendarDate(event.startDate);
      const endDate = parseCalendarDate(event.endDate);

      // For each day the event spans
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d >= rangeStart && d <= rangeEnd) {
          const dateKey = formatCalendarDate(d);
          if (!groups.has(dateKey)) {
            groups.set(dateKey, []);
          }
          // Only add if not already in the list for this date
          const dayEvents = groups.get(dateKey)!;
          if (!dayEvents.find(e => e.id === event.id)) {
            dayEvents.push(event);
          }
        }
      }
    });

    // Convert to sorted array
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, events]) => ({
        date: parseCalendarDate(dateStr),
        events,
      }));
  }, [events, currentDate]);

  const getEventTypeColor = (type: AcademicEvent["type"]) => {
    switch (type) {
      case "HOLIDAY":
        return "bg-neutral-100 text-neutral-700 border-neutral-300";
      case "EXAM":
        return "bg-accent-100 text-accent-700 border-accent-300";
      case "ACTIVITY":
        return "bg-primary-100 text-primary-700 border-primary-300";
      case "OTHER":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getScopeLabel = (event: AcademicEvent) => {
    const scopeType = t(`scopes.${event.scopeType.toLowerCase()}`);
    return scopeType;
  };

  const formatDateRange = (event: AcademicEvent) => {
    const start = parseCalendarDate(event.startDate);
    const end = parseCalendarDate(event.endDate);

    if (event.startDate === event.endDate) {
      return start.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return `${start.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    })}`;
  };

  if (groupedEvents.length === 0) {
    return (
      <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>{t("noEventsThisRange")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {groupedEvents.map(({ date, events: dayEvents }) => (
        <div key={date.toISOString()} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Date Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary text-white rounded-lg">
                <div className="text-xs font-medium">
                  {date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                    month: "short",
                  })}
                </div>
                <div className="text-lg font-bold">{date.getDate()}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                    weekday: "long",
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {t("eventsCount", { count: dayEvents.length })}
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="divide-y divide-gray-200">
            {dayEvents.map((event) => {
              const title = event.title;
              const notes = event.notes;

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Event Type Badge */}
                    <div
                      className={`
                        px-2 py-1 rounded text-xs font-medium border whitespace-nowrap
                        ${getEventTypeColor(event.type)}
                      `}
                    >
                      {t(`event_types.${event.type.toLowerCase()}`)}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-1">{title}</div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {/* Date Range */}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateRange(event)}</span>
                        </div>

                        {/* Scope */}
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{getScopeLabel(event)}</span>
                        </div>

                        {/* All Day */}
                        {event.allDay && (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {t("all_day")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes Preview */}
                      {notes && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {notes}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
