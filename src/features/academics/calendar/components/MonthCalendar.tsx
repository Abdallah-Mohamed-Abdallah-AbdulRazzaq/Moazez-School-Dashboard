"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  AcademicEvent,
  getEventsForDate,
} from "@/features/academics/calendar/services/calendarService";
import { Term } from "@/features/academics/academic-structure-tree/services/structureService";
import { useEventDragDrop } from "@/features/academics/calendar/hooks/useEventDragDrop";
import DayEventsPopover from "./DayEventsPopover";

interface MonthCalendarProps {
  currentDate: Date;
  events: AcademicEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AcademicEvent) => void;
  isReadOnly: boolean;
  term: Term;
  onEventMove: (
    eventId: string,
    newStartDate: string,
    newEndDate: string,
  ) => Promise<void>;
  onInvalidDrop?: () => void;
  displayMode: "compact" | "comfortable" | "minimal";
}

export default function MonthCalendar({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  isReadOnly,
  term,
  onEventMove,
  onInvalidDrop,
  displayMode,
}: MonthCalendarProps) {
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

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Days from previous month
    const prevMonthDays = firstDayOfWeek;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(
      prevMonthYear,
      prevMonth + 1,
      0,
    ).getDate();

    // Days from next month
    const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;
    const nextMonthDays = totalCells - prevMonthDays - daysInMonth;

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push({
        date: new Date(prevMonthYear, prevMonth, day),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Next month days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= nextMonthDays; day++) {
      days.push({
        date: new Date(nextMonthYear, nextMonth, day),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate]);

  // Get weekday names
  const weekdays = useMemo(() => {
    const days = [];
    const baseDate = new Date(2024, 0, 7); // Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      days.push(
        date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
          weekday: "short",
        }),
      );
    }

    return days;
  }, [locale]);

  const handleDayClick = (
    date: Date,
    isCurrentMonth: boolean,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!isCurrentMonth) return;

    const dayEvents = getEventsForDate(events, date);

    if (dayEvents.length > 0 && displayMode === "minimal") {
      // In minimal mode, clicking opens popover
      setSelectedDate(date);
      setPopoverAnchor(event.currentTarget);
    } else if (dayEvents.length > 0) {
      // Show popover with events
      setSelectedDate(date);
      setPopoverAnchor(event.currentTarget);
    } else {
      // Create new event for this date
      if (!isReadOnly) {
        onDateClick(date);
      }
    }
  };

  const handleMoreClick = (
    date: Date,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setSelectedDate(date);
    setPopoverAnchor(event.currentTarget);
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
        return 2;
      case "comfortable":
        return 4;
      case "minimal":
        return 0;
      default:
        return 2;
    }
  };

  const getCellHeight = () => {
    switch (displayMode) {
      case "compact":
        return "min-h-[110px] md:min-h-[130px]";
      case "comfortable":
        return "min-h-[150px] md:min-h-[180px]";
      case "minimal":
        return "min-h-[80px] md:min-h-[90px]";
      default:
        return "min-h-[110px] md:min-h-[130px]";
    }
  };

  const maxEvents = getMaxEvents();
  const cellHeight = getCellHeight();

  return (
    <>
      <div className="mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="p-3 text-center text-sm font-semibold text-gray-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(events, day.date);
              const visibleEvents =
                displayMode === "minimal" ? [] : dayEvents.slice(0, maxEvents);
              const moreCount = dayEvents.length - visibleEvents.length;

              const dropHandlers = getDropHandlers(day.date);
              const dateStr = formatDateToISO(day.date);
              const isDropTarget = hoverDate === dateStr;

              return (
                <div
                  key={index}
                  onClick={(e) =>
                    handleDayClick(day.date, day.isCurrentMonth, e)
                  }
                  {...(day.isCurrentMonth && !isReadOnly ? dropHandlers : {})}
                  className={`
                    ${cellHeight} p-2 border-b border-r border-gray-200
                    ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"}
                    ${day.isCurrentMonth && !isReadOnly ? "cursor-pointer hover:bg-primary-50/30" : ""}
                    ${day.isToday ? "bg-primary-50 ring-2 ring-inset ring-primary" : ""}
                    ${isDropTarget ? "calendar-drop-target" : ""}
                    transition-colors
                  `}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`
                        text-sm font-semibold
                        ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                        ${day.isToday ? "bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center text-xs" : ""}
                      `}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  {displayMode === "minimal" ? (
                    // Minimal mode: show count badge
                    dayEvents.length > 0 && (
                      <div className="flex items-center justify-center h-8">
                        <div className="bg-primary text-white rounded-full px-2 py-0.5 text-xs font-medium">
                          {dayEvents.length}
                        </div>
                      </div>
                    )
                  ) : (
                    // Compact/Comfortable: show event chips
                    <div className="space-y-1">
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
                              w-full text-left px-2 py-1 rounded text-xs truncate border
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

                      {/* More Events Button */}
                      {moreCount > 0 && (
                        <button
                          onClick={(e) => handleMoreClick(day.date, e)}
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
