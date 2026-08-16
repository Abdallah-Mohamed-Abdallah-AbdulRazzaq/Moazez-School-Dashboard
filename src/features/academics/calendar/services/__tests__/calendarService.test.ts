import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  fetchCalendarEvents,
  formatCalendarDate,
  getEventsForDateRange,
  parseCalendarDate,
} from "../calendarService";
import { listCalendarEvents } from "../calendarApiAdapter";
import type { ListCalendarEventsResponse } from "../calendarApi.types";

vi.mock("../calendarApiAdapter", () => ({
  listCalendarEvents: vi.fn(),
  createCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
}));

describe("calendarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchCalendarEvents", () => {
    it("List handles nextCursor pagination", async () => {
      const mockResponse: ListCalendarEventsResponse = {
        items: [
          {
            id: "1",
            academicYearId: "y1",
            termId: "t1",
            title: "Test",
            type: "holiday",
            scope: { type: "school", id: null },
            allDay: true,
            startDate: "2024-01-01",
            endDate: "2024-01-01",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          }
        ],
        nextCursor: "cursor-123",
      };

      vi.mocked(listCalendarEvents).mockResolvedValueOnce(mockResponse);

      const result = await fetchCalendarEvents({
        academicYearId: "y1",
        termId: "t1",
        limit: 10,
        cursor: "cursor-0"
      });

      expect(listCalendarEvents).toHaveBeenCalledWith({
        academicYearId: "y1",
        termId: "t1",
        limit: 10,
        cursor: "cursor-0"
      });

      expect(result.nextCursor).toBe("cursor-123");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("HOLIDAY");
    });
  });

  it("preserves calendar-only dates without UTC conversion", () => {
    const localDate = new Date(2024, 0, 1);

    expect(formatCalendarDate(localDate)).toBe("2024-01-01");
    expect(formatCalendarDate(parseCalendarDate("2024-01-01"))).toBe(
      "2024-01-01"
    );
  });

  it("includes events that overlap the requested local date range", () => {
    const event = {
      id: "e1",
      termId: "t1",
      title: "Event",
      type: "OTHER" as const,
      allDay: true,
      startDate: "2024-01-01",
      endDate: "2024-01-03",
      scopeType: "SCHOOL" as const,
      createdAt: "2024-01-01T00:00:00Z",
    };

    expect(
      getEventsForDateRange(
        [event],
        new Date(2024, 0, 3),
        new Date(2024, 0, 5)
      )
    ).toEqual([event]);
  });
});
