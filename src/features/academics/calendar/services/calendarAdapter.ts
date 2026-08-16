import type { AcademicEvent } from "./calendarService";
import type { ListCalendarEventsParams } from "./calendarApi.types";

export interface CalendarAdapter {
  fetchEvents(params: ListCalendarEventsParams): Promise<{
    items: AcademicEvent[];
    nextCursor: string | null;
  }>;

  createEvent(params: {
    academicYearId: string;
    termId: string;
    payload: Omit<AcademicEvent, "id" | "termId" | "createdAt">;
  }): Promise<AcademicEvent>;

  updateEvent(
    eventId: string,
    payload: Partial<Omit<AcademicEvent, "id" | "termId" | "createdAt">>
  ): Promise<AcademicEvent>;

  deleteEvent(eventId: string): Promise<void>;
}
