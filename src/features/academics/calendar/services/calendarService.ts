import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./calendarApiAdapter";
import {
  mapCalendarEventDtoToUi,
  mapUiEventToCreateRequest,
  mapUiEventToUpdateRequest,
} from "./calendarMappers";
import type { ListCalendarEventsParams } from "./calendarApi.types";

export interface AcademicEvent {
  id: string;
  termId: string;
  title: string;
  type: "HOLIDAY" | "EXAM" | "ACTIVITY" | "OTHER";
  allDay: boolean;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION";
  scopeId?: string; // ID of stage/grade/section if not SCHOOL
  description?: string;
  notes?: string;
  createdAt: string;
}

export function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Fetch calendar events with pagination and filters
 */
export async function fetchCalendarEvents(params: ListCalendarEventsParams) {
  const res = await listCalendarEvents(params);
  return {
    items: res.items.map(mapCalendarEventDtoToUi),
    nextCursor: res.nextCursor,
  };
}

/**
 * Fetch all events for a term
 */
export async function fetchTermEvents(termId: string): Promise<AcademicEvent[]> {
  const all: AcademicEvent[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetchCalendarEvents({
      termId,
      limit: 100,
      cursor,
    });
    all.push(...res.items);
    cursor = res.nextCursor || undefined;
  } while (cursor);

  return all;
}

/**
 * Create a new event for a term
 */
export async function createTermEvent(
  academicYearId: string,
  termId: string,
  payload: Omit<AcademicEvent, "id" | "termId" | "createdAt">
): Promise<AcademicEvent> {
  const dto = await createCalendarEvent(
    mapUiEventToCreateRequest({ academicYearId, termId, event: payload })
  );
  return mapCalendarEventDtoToUi(dto);
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  payload: Partial<Omit<AcademicEvent, "id" | "termId" | "createdAt">>
): Promise<AcademicEvent> {
  const dto = await updateCalendarEvent(eventId, mapUiEventToUpdateRequest(payload));
  return mapCalendarEventDtoToUi(dto);
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await deleteCalendarEvent(eventId);
}

/**
 * Helper: Get events for a specific date
 */
export const getEventsForDate = (
  events: AcademicEvent[],
  date: Date
): AcademicEvent[] => {
  const dateStr = formatCalendarDate(date);

  const filtered = events.filter((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;
    return dateStr >= eventStart && dateStr <= eventEnd;
  });
  return filtered;
};

/**
 * Helper: Get events for a date range
 */
export const getEventsForDateRange = (
  events: AcademicEvent[],
  startDate: Date,
  endDate: Date
): AcademicEvent[] => {
  const startStr = formatCalendarDate(startDate);
  const endStr = formatCalendarDate(endDate);

  return events.filter((event) => {
    // Event overlaps with range if:
    // event.start <= range.end AND event.end >= range.start
    return event.startDate <= endStr && event.endDate >= startStr;
  });
};
