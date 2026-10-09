import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentListResponse } from "../../types/contracts";
import { listGuardianNotes } from "../guardianNotesService";

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiGet }));

describe("guardian notes service", () => {
  beforeEach(() => apiGet.mockReset());

  it("uses one guardians-only list request without hydrating each row", async () => {
    const response = {
      items: [],
      page: 1,
      limit: 10,
      total: 0,
    } satisfies AcademicContentListResponse;
    apiGet.mockResolvedValue(response);

    await expect(
      listGuardianNotes({
        academicYearId: "year-1",
        termId: "term-1",
        guardianPriority: "IMPORTANT",
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual(response);

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        guardianPriority: "IMPORTANT",
        page: 1,
        limit: 10,
        type: "GUARDIAN_WEEKLY_NOTE",
        audience: "GUARDIANS",
      },
    });
  });
});
