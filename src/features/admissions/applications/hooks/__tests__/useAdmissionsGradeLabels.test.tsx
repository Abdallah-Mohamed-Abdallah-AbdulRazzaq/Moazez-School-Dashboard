import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAdmissionsGradeLabels } from "../useAdmissionsGradeLabels";

const structureMocks = vi.hoisted(() => ({
  fetchStructureTree: vi.fn(),
  fetchTermsByYear: vi.fn(),
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => structureMocks,
);

describe("useAdmissionsGradeLabels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    structureMocks.fetchTermsByYear.mockResolvedValue([
      { id: "term-1", status: "open" },
    ]);
    structureMocks.fetchStructureTree.mockResolvedValue({
      stages: [],
      sections: [],
      classrooms: [],
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "الصف الأول",
          nameEn: "First Grade",
        },
      ],
    });
  });

  it("shows the grade name instead of exposing its backend UUID", async () => {
    const references = [
      {
        requestedAcademicYearId: "year-1",
        requestedGradeId: "grade-1",
      },
    ];
    const { result } = renderHook(() =>
      useAdmissionsGradeLabels(references, "en"),
    );

    await waitFor(() => expect(result.current.get("grade-1")).toBe("First Grade"));
  });
});
