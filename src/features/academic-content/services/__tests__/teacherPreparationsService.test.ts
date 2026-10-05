import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTeacherPreparationCount,
  listTeacherPreparations,
} from "../teacherPreparationsService";

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ apiGet }));

describe("teacher preparations service", () => {
  beforeEach(() => {
    apiGet.mockReset().mockResolvedValue({
      items: [],
      page: 1,
      limit: 1,
      total: 12,
    });
  });

  it("fixes list requests to teacher preparations", async () => {
    await listTeacherPreparations({
      academicYearId: "year-1",
      termId: "term-1",
      page: 2,
      limit: 10,
      status: "DRAFT",
    });

    expect(apiGet).toHaveBeenCalledWith("/academics/academic-content", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        type: "TEACHER_PREPARATION",
        page: 2,
        limit: 10,
        status: "DRAFT",
      },
    });
  });

  it.each([undefined, "DRAFT", "SUBMITTED", "APPROVED"] as const)(
    "loads the %s count using the smallest page",
    async (status) => {
      await expect(
        getTeacherPreparationCount(
          { academicYearId: "year-1", termId: "term-1" },
          status,
        ),
      ).resolves.toBe(12);

      expect(apiGet).toHaveBeenLastCalledWith("/academics/academic-content", {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          type: "TEACHER_PREPARATION",
          page: 1,
          limit: 1,
          status,
        },
      });
    },
  );
});
