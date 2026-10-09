import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWeeklyPlanCount, listWeeklyPlans } from "../weeklyPlansService";

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiGet }));

const weeklyPlan = {
  id: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "WEEKLY_PLAN",
  audience: "STUDENTS",
  title: "Fractions",
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
  summary: {
    type: "WEEKLY_PLAN",
    weekStartDate: "2026-10-05",
    weekEndDate: "2026-10-11",
  },
} as const;

describe("weekly plans service", () => {
  beforeEach(() => apiGet.mockReset());

  it("returns the list response without requesting each row's details", async () => {
    const listResponse = {
      items: [weeklyPlan],
      page: 1,
      limit: 10,
      total: 1,
    };
    apiGet.mockResolvedValue(listResponse);

    const response = await listWeeklyPlans({
      academicYearId: "year-1",
      termId: "term-1",
      page: 1,
      limit: 10,
    });

    expect(response).toEqual(listResponse);
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        page: 1,
        limit: 10,
        type: "WEEKLY_PLAN",
      },
    });
  });

  it.each([undefined, "DRAFT", "SCHEDULED", "PUBLISHED"] as const)(
    "loads the %s summary count without hydrating details",
    async (status) => {
      apiGet.mockResolvedValue({ items: [], page: 1, limit: 1, total: 7 });

      await expect(
        getWeeklyPlanCount(
          { academicYearId: "year-1", termId: "term-1" },
          status,
        ),
      ).resolves.toBe(7);

      expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          type: "WEEKLY_PLAN",
          ...(status ? { status } : {}),
          page: 1,
          limit: 1,
        },
      });
    },
  );
});
