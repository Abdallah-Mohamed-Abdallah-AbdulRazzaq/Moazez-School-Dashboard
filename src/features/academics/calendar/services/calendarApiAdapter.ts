import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CalendarEventDto,
  CreateCalendarEventRequest,
  DeleteCalendarEventResponse,
  ListCalendarEventsParams,
  ListCalendarEventsResponse,
  UpdateCalendarEventRequest,
} from "./calendarApi.types";

const BASE = "/academics/calendar/events";

export async function listCalendarEvents(
  params: ListCalendarEventsParams
): Promise<ListCalendarEventsResponse> {
  return apiGet<ListCalendarEventsResponse>(BASE, { params });
}

export async function createCalendarEvent(
  payload: CreateCalendarEventRequest
): Promise<CalendarEventDto> {
  return apiPost<CalendarEventDto>(BASE, payload);
}

export async function getCalendarEvent(eventId: string): Promise<CalendarEventDto> {
  return apiGet<CalendarEventDto>(`${BASE}/${eventId}`);
}

export async function updateCalendarEvent(
  eventId: string,
  payload: UpdateCalendarEventRequest
): Promise<CalendarEventDto> {
  return apiPatch<CalendarEventDto>(`${BASE}/${eventId}`, payload);
}

export async function deleteCalendarEvent(
  eventId: string
): Promise<DeleteCalendarEventResponse> {
  return apiDelete<DeleteCalendarEventResponse>(`${BASE}/${eventId}`);
}
