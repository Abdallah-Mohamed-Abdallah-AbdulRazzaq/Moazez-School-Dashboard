import { vi, describe, it, expect, beforeEach } from "vitest";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../calendarApiAdapter";
import type { CreateCalendarEventRequest, UpdateCalendarEventRequest } from "../calendarApi.types";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

describe("calendarApiAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET list uses /academics/calendar/events", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ items: [], nextCursor: null });
    
    await listCalendarEvents({ academicYearId: "y1", termId: "t1" });
    
    expect(apiGet).toHaveBeenCalledWith("/academics/calendar/events", {
      params: { academicYearId: "y1", termId: "t1" }
    });
  });

  it("POST create uses /academics/calendar/events", async () => {
    const payload: CreateCalendarEventRequest = {
      academicYearId: "y1",
      termId: "t1",
      title: "Test",
      type: "holiday",
      scopeType: "school",
      scopeId: null,
      allDay: true,
      startDate: "2024-01-01",
      endDate: "2024-01-01"
    };
    
    vi.mocked(apiPost).mockResolvedValueOnce({ id: "e1" });
    
    await createCalendarEvent(payload);
    
    expect(apiPost).toHaveBeenCalledWith("/academics/calendar/events", payload);
  });

  it("PATCH update uses /academics/calendar/events/:eventId", async () => {
    const payload: UpdateCalendarEventRequest = { title: "Updated" };
    
    vi.mocked(apiPatch).mockResolvedValueOnce({ id: "e1" });
    
    await updateCalendarEvent("e1", payload);
    
    expect(apiPatch).toHaveBeenCalledWith("/academics/calendar/events/e1", payload);
  });

  it("DELETE uses /academics/calendar/events/:eventId", async () => {
    vi.mocked(apiDelete).mockResolvedValueOnce({ id: "e1", deleted: true });
    
    await deleteCalendarEvent("e1");
    
    expect(apiDelete).toHaveBeenCalledWith("/academics/calendar/events/e1");
  });
});
