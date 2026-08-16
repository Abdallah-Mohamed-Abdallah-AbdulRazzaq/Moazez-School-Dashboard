import { describe, expect, it, vi } from "vitest";
import { createTimetableConfigCache } from "./timetableConfigCache";

describe("createTimetableConfigCache", () => {
  it("requests each timetable scope only once", async () => {
    const fetchConfig = vi.fn().mockResolvedValue({ id: "section-config" });
    const cache = createTimetableConfigCache(fetchConfig);
    const params = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "SECTION" as const,
      sectionId: "section-1",
    };

    await cache.get("section:section-1", params);
    await cache.get("section:section-1", params);

    expect(fetchConfig).toHaveBeenCalledTimes(1);
  });
});
