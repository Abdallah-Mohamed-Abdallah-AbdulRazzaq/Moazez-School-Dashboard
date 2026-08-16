"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AcademicEvent, getEventsForDate } from "@/features/academics/calendar/services/calendarService";
import { Term } from "@/features/academics/academic-structure-tree/services/structureService";
import { useEventDragDrop } from "@/features/academics/calendar/hooks/useEventDragDrop";
import DayEventsPopover from "./DayEventsPopover";

interface WeekCalendarProps {
  currentDate: Date;
  events: AcademicEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AcademicEvent) => void;
  isReadOnly: boolean;
  term: Term;
  onEventMove: (eventId: string, newStartDate: string, newEndDate: string) => Promise<void>;
  onInvalidDrop?: () => void;
  displayMode: "compact" | "comfortable" | "minimal";
}

export default function WeekCalendar({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  isReadOnly,
  term,
  onEventMove,
  onInvalidDrop,
  displayMode,
}: WeekCalendarProps) {
  const t = useTranslations("academics.calendar");
  const locale = useLocale();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // Drag and drop hook
  const {
    dragState,
    hoverDate,
    handleDragStart,
    handleDragEnd,
    getDropHandlers,
    formatDateToISO,
  } = useEventDragDrop({
    termStartDate: term.startDate,
    termEndDate: term.endDate,
    isReadOnly,
    onEventMove,
    onInvalidDrop,
  });

  // Get week range (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      day.setHours(0, 0, 0, 0);
      days.push(day);
    }

    return days;
  }, [currentDate]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const handleDayClick = (date: Date, event: React.MouseEvent<HTMLDivElement>) => {
    const dayEvents = getEventsForDate(events, date);

    if (dayEvents.length > 0 && displayMode === "minimal") {
      // In minimal mode, clicking opens popover
      setSelectedDate(date);
      setPopoverAnchor(event.currentTarget);
    } else if (dayEvents.length === 0 && !isReadOnly) {
      // Create new event
      onDateClick(date);
    }
  };

  const handleClosePopover = () => {
    setSelectedDate(null);
    setPopoverAnchor(null);
  };

  const getEventColor = (type: AcademicEvent["type"]) => {
    switch (type) {
      case "HOLIDAY":
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
      case "EXAM":
        return "bg-accent-100 text-accent-700 border-accent-200";
      case "ACTIVITY":
        return "bg-primary-100 text-primary-700 border-primary-200";
      case "OTHER":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getMaxEvents = () => {
    switch (displayMode) {
      case "compact":
        return 3;
      case "comfortable":
        return 6;
      case "minimal":
        return 0;
      default:
        return 3;
    }
  };

  const maxEvents = getMaxEvents();

  return (
    <>
      <div className="mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Week Grid */}
          <div className="grid grid-cols-7">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDate(events, day);
              const isToday = day.getTime() === today.getTime();
              const visibleEvents = displayMode === "minimal" ? [] : dayEvents.slice(0, maxEvents);
              const moreCount = dayEvents.length - visibleEvents.length;

              const dropHandlers = getDropHandlers(day);
              const dateStr = formatDateToISO(day);
              const isDropTarget = hoverDate === dateStr;

              return (
                <div
                  key={index}
                  onClick={(e) => handleDayClick(day, e)}
                  {...(!isReadOnly ? dropHandlers : {})}
                  className={`
                    ${displayMode === "compact" ? "min-h-[200px]" : displayMode === "comfortable" ? "min-h-[300px]" : "min-h-[120px]"}
                    p-3 border-r border-b border-gray-200
                    ${!isReadOnly ? "cursor-pointer hover:bg-blue-50/30" : ""}
                    ${isToday ? "bg-blue-50" : "bg-white"}
                    ${isDropTarget ? "calendar-drop-target" : ""}
                    transition-colors
                  `}
                >
                  {/* Day Header */}
                  <div className="mb-2 pb-2 border-b border-gray-200">
                    <div className="text-xs text-gray-500 uppercase">
                      {day.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                        weekday: "short",
                      })}
                    </div>
                    <div
                      className={`
                        text-lg font-semibold
                        ${isToday ? "text-primary" : "text-gray-900"}
                      `}
                    >
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Events */}
                  {displayMode === "minimal" ? (
                    // Minimal mode: show count badge
                    dayEvents.length > 0 && (
                      <div className="flex items-center justify-center h-16">
                        <div className="bg-primary text-white rounded-full px-3 py-1 text-sm font-medium">
                          {t("eventsCount", { count: dayEvents.length })}
                        </div>
                      </div>
                    )
                  ) : (
                    // Compact/Comfortable: show event chips
                    <div className="space-y-1.5">
                      {visibleEvents.map((event) => {
                        const title = event.title;
                        return (
                          <button
                            key={event.id}
                            draggable={!isReadOnly}
                            onDragStart={(e) => handleDragStart(event, e)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            className={`
                              w-full text-left px-2 py-1.5 rounded text-xs truncate border
                              ${getEventColor(event.type)}
                              ${!isReadOnly ? "calendar-event-draggable" : ""}
                              ${dragState.eventId === event.id ? "calendar-event-dragging" : ""}
                              hover:opacity-80 transition-opacity
                            `}
                            title={title}
                          >
                            {title}
                          </button>
                        );
                      })}

                      {/* More Events Indicator */}
                      {moreCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(day);
                            setPopoverAnchor(e.currentTarget);
                          }}
                          className="w-full text-left px-2 py-1 text-xs text-primary hover:text-primary-700 font-medium"
                        >
                          +{moreCount} {t("more")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* No Events Message */}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t("noEventsThisWeek")}
          </div>
        )}
      </div>

      {/* Day Events Popover */}
      {selectedDate && (
        <DayEventsPopover
          date={selectedDate}
          events={getEventsForDate(events, selectedDate)}
          anchorEl={popoverAnchor}
          onClose={handleClosePopover}
          onEventClick={onEventClick}
          onAddEvent={() => {
            handleClosePopover();
            onDateClick(selectedDate);
          }}
          isReadOnly={isReadOnly}
        />
      )}
    </>
  );
}
