"use client";

import { useTranslations, useLocale } from "next-intl";
import { Plus, Edit2, X } from "lucide-react";
import { Popover, Drawer, useMediaQuery, useTheme } from "@mui/material";
import Button from "@/components/ui/button/Button";
import { AcademicEvent } from "@/features/academics/calendar/services/calendarService";

interface DayEventsPopoverProps {
  date: Date;
  events: AcademicEvent[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEventClick: (event: AcademicEvent) => void;
  onAddEvent: () => void;
  isReadOnly: boolean;
}

export default function DayEventsPopover({
  date,
  events,
  anchorEl,
  onClose,
  onEventClick,
  onAddEvent,
  isReadOnly,
}: DayEventsPopoverProps) {
  const t = useTranslations("academics.calendar");
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dateStr = date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

  const renderContent = () => (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{dateStr}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {events.length} {events.length === 1 ? t("event") : t("events")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
        {events.map((event) => {
          const title = event.title;
          const notes = event.notes;

          return (
            <button
              key={event.id}
              onClick={() => {
                onClose();
                onEventClick(event);
              }}
              className={`
                w-full text-left p-3 rounded-lg border
                ${getEventColor(event.type)}
                hover:opacity-80 transition-opacity
                group
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1 truncate">{title}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-white bg-opacity-50">
                      {t(`event_types.${event.type.toLowerCase()}`)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white bg-opacity-50">
                      {t(`scopes.${event.scopeType.toLowerCase()}`)}
                    </span>
                    {event.allDay && (
                      <span className="px-2 py-0.5 rounded bg-white bg-opacity-50">
                        {t("all_day")}
                      </span>
                    )}
                  </div>
                  {notes && (
                    <p className="text-xs mt-2 opacity-75 line-clamp-2">{notes}</p>
                  )}
                </div>
                <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Event Button */}
      {!isReadOnly && (
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => {
            onClose();
            onAddEvent();
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t("add_event")}
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={!!anchorEl}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80vh",
          },
        }}
      >
        {renderContent()}
      </Drawer>
    );
  }

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      }}
    >
      {renderContent()}
    </Popover>
  );
}
