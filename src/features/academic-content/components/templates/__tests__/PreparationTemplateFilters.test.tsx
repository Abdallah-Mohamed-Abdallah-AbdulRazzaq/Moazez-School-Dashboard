import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PreparationTemplateFilters from "../PreparationTemplateFilters";

const loadAcademicTargetOptions = vi.hoisted(() => vi.fn());

vi.mock(
  "@/features/academics/hooks/AcademicYearTermLayoutContext",
  () => ({
    useAcademicYearTermLayoutContext: () => ({
      academicYearId: "year-1",
      termId: "term-1",
    }),
  }),
);

vi.mock("../../../services/academicContentSelectors", () => ({
  loadAcademicTargetOptions,
}));

describe("PreparationTemplateFilters", () => {
  it("uses the selected context to expose stage and subject filters", async () => {
    loadAcademicTargetOptions.mockResolvedValue({
      structure: {
        stages: [{ id: "stage-1", name: "Primary" }],
        grades: [],
        sections: [],
        classrooms: [],
      },
      subjects: [{ id: "subject-1", name: "Mathematics", isActive: true }],
      subjectAllocations: [],
      teacherAllocations: [],
    });
    const onSearchChange = vi.fn();
    const onFiltersChange = vi.fn();
    render(
      <PreparationTemplateFilters
        filters={{
          page: 1,
          limit: 50,
          stageId: "",
          subjectId: "",
          search: "",
        }}
        search=""
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search templates"), {
      target: { value: "fractions" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("fractions");
    fireEvent.click(
      screen.getByRole("button", { name: "Show template filters" }),
    );

    await waitFor(() =>
      expect(loadAcademicTargetOptions).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
      }),
    );
    expect(screen.getByLabelText("Stage")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Stage"));
    fireEvent.click(await screen.findByRole("button", { name: "Primary" }));
    expect(onFiltersChange).toHaveBeenCalledWith({ stageId: "stage-1" });
  });
});
