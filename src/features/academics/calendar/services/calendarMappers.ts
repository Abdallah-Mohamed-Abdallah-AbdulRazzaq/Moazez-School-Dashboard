import type { AcademicEvent } from "./calendarService";
import type {
  CalendarEventDto,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "./calendarApi.types";

const eventTypeToUi = {
  holiday: "HOLIDAY",
  exam: "EXAM",
  activity: "ACTIVITY",
  other: "OTHER",
} as const;

const eventTypeToApi = {
  HOLIDAY: "holiday",
  EXAM: "exam",
  ACTIVITY: "activity",
  OTHER: "other",
} as const;

const scopeTypeToUi = {
  school: "SCHOOL",
  stage: "STAGE",
  grade: "GRADE",
  section: "SECTION",
} as const;

const scopeTypeToApi = {
  SCHOOL: "school",
  STAGE: "stage",
  GRADE: "grade",
  SECTION: "section",
} as const;

export function mapCalendarEventDtoToUi(dto: CalendarEventDto): AcademicEvent {
  return {
    id: dto.id,
    termId: dto.termId,
    title: dto.title,
    type: eventTypeToUi[dto.type],
    allDay: dto.allDay,
    startDate: dto.startDate.slice(0, 10),
    endDate: dto.endDate.slice(0, 10),
    scopeType: scopeTypeToUi[dto.scope.type],
    scopeId: dto.scope.id || undefined,
    description: dto.description || undefined,
    notes: dto.notes || undefined,
    createdAt: dto.createdAt,
  };
}

export function mapUiEventToCreateRequest(params: {
  academicYearId: string;
  termId: string;
  event: Omit<AcademicEvent, "id" | "termId" | "createdAt">;
}): CreateCalendarEventRequest {
  const { academicYearId, termId, event } = params;

  return {
    academicYearId,
    termId,
    title: event.title,
    description: event.description || null,
    notes: event.notes || null,
    type: eventTypeToApi[event.type],
    scopeType: scopeTypeToApi[event.scopeType],
    scopeId: event.scopeType === "SCHOOL" ? null : event.scopeId || null,
    allDay: event.allDay,
    startDate: event.startDate,
    endDate: event.endDate,
  };
}

export function mapUiEventToUpdateRequest(
  event: Partial<Omit<AcademicEvent, "id" | "termId" | "createdAt">>
): UpdateCalendarEventRequest {
  return {
    title: event.title,
    description: event.description ?? undefined,
    notes: event.notes ?? undefined,
    type: event.type ? eventTypeToApi[event.type] : undefined,
    scopeType: event.scopeType ? scopeTypeToApi[event.scopeType] : undefined,
    scopeId:
      event.scopeType === "SCHOOL"
        ? null
        : event.scopeId || undefined,
    allDay: event.allDay,
    startDate: event.startDate,
    endDate: event.endDate,
  };
}
