import { describe, it, expect } from "vitest";
import {
  mapCalendarEventDtoToUi,
  mapUiEventToCreateRequest,
  mapUiEventToUpdateRequest,
} from "../calendarMappers";
import type { CalendarEventDto } from "../calendarApi.types";
import type { AcademicEvent } from "../calendarService";

describe("calendarMappers", () => {
  describe("mapCalendarEventDtoToUi", () => {
    it("Backend lowercase type maps to UI uppercase type", () => {
      const dto: CalendarEventDto = {
        id: "1",
        academicYearId: "y1",
        termId: "t1",
        title: "Test",
        type: "holiday",
        scope: { type: "school", id: null },
        allDay: true,
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-02T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const ui = mapCalendarEventDtoToUi(dto);
      expect(ui.title).toBe("Test");
      expect(ui.type).toBe("HOLIDAY");
      expect(ui.scopeType).toBe("SCHOOL");
      expect(ui.startDate).toBe("2024-01-01");
      expect(ui.endDate).toBe("2024-01-02");
    });
  });

  describe("mapUiEventToCreateRequest", () => {
    it("maps UI fields, including description, to the create request", () => {
      const ui: Omit<AcademicEvent, "id" | "termId" | "createdAt"> = {
        title: "Test",
        type: "EXAM",
        allDay: true,
        startDate: "2024-01-01",
        endDate: "2024-01-01",
        scopeType: "GRADE",
        scopeId: "g1",
        description: "Revision week",
      };

      const req = mapUiEventToCreateRequest({ academicYearId: "y1", termId: "t1", event: ui });
      expect(req.type).toBe("exam");
      expect(req.scopeType).toBe("grade");
      expect(req.title).toBe("Test");
      expect(req.description).toBe("Revision week");
    });

    it("School scope sends scopeId null/undefined", () => {
      const ui: Omit<AcademicEvent, "id" | "termId" | "createdAt"> = {
        title: "Test",
        type: "OTHER",
        allDay: true,
        startDate: "2024-01-01",
        endDate: "2024-01-01",
        scopeType: "SCHOOL",
        scopeId: "ignored",
      };

      const req = mapUiEventToCreateRequest({ academicYearId: "y1", termId: "t1", event: ui });
      expect(req.scopeType).toBe("school");
      expect(req.scopeId).toBe(null);
    });

    it("Grade/stage/section scope requires scopeId", () => {
      const ui: Omit<AcademicEvent, "id" | "termId" | "createdAt"> = {
        title: "Test",
        type: "OTHER",
        allDay: true,
        startDate: "2024-01-01",
        endDate: "2024-01-01",
        scopeType: "STAGE",
        scopeId: "s1",
      };

      const req = mapUiEventToCreateRequest({ academicYearId: "y1", termId: "t1", event: ui });
      expect(req.scopeType).toBe("stage");
      expect(req.scopeId).toBe("s1");
    });
  });

  it("sends an empty notes value so the backend can clear existing notes", () => {
    expect(mapUiEventToUpdateRequest({ notes: "" })).toMatchObject({ notes: "" });
  });

  it("sends an empty description value so the backend can clear it", () => {
    expect(mapUiEventToUpdateRequest({ description: "" })).toMatchObject({
      description: "",
    });
  });
});
