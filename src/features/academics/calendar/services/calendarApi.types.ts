export type CalendarEventType = "holiday" | "exam" | "activity" | "other";
export type CalendarScopeType = "school" | "stage" | "grade" | "section";

export interface CalendarEventDto {
  id: string;
  academicYearId: string;
  termId: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  type: CalendarEventType;
  scope: {
    type: CalendarScopeType;
    id: string | null;
  };
  allDay: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCalendarEventsParams {
  academicYearId?: string;
  termId?: string;
  from?: string;
  to?: string;
  type?: CalendarEventType;
  scopeType?: CalendarScopeType;
  scopeId?: string;
  limit?: number;
  cursor?: string;
}

export interface ListCalendarEventsResponse {
  items: CalendarEventDto[];
  nextCursor: string | null;
}

export interface CreateCalendarEventRequest {
  academicYearId: string;
  termId: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  type: CalendarEventType;
  scopeType: CalendarScopeType;
  scopeId?: string | null;
  allDay?: boolean;
  startDate: string;
  endDate: string;
}

export type UpdateCalendarEventRequest = Partial<CreateCalendarEventRequest>;

export interface DeleteCalendarEventResponse {
  id: string;
  deleted: true;
}
