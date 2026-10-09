import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PreparationTemplatePicker from "../PreparationTemplatePicker";

const api = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }));

vi.mock("../../../services/academicContentApi", () => ({
  listAcademicContentPreparationTemplates: api.list,
  getAcademicContentPreparationTemplate: api.get,
}));

function listResponse() {
  return {
    items: [
      {
        id: "template-1",
        name: "Fractions preset",
        description: "Reusable lesson",
        stageId: "stage-1",
        subjectId: "subject-1",
        objectivesCount: 1,
        learningOutcomesCount: 1,
        teachingStrategiesCount: 1,
        activitiesCount: 1,
        updatedAt: "2026-10-02T08:00:00.000Z",
      },
    ],
    page: 1,
    limit: 50,
    total: 1,
  };
}

function detail() {
  return {
    ...listResponse().items[0],
    topic: "Fractions",
    objectives: ["Compare fractions"],
    learningOutcomes: [],
    teachingStrategies: [],
    activities: [],
    resourceNotes: null,
    assessmentNotes: null,
    teacherNotes: null,
    createdByUserId: "user-1",
    updatedByUserId: null,
    createdAt: "2026-10-01T08:00:00.000Z",
  };
}

describe("PreparationTemplatePicker", () => {
  beforeEach(() => {
    api.list.mockReset().mockResolvedValue(listResponse());
    api.get.mockReset().mockResolvedValue(detail());
  });

  afterEach(() => vi.useRealTimers());

  it("hides in read-only preparation forms", () => {
    render(<PreparationTemplatePicker disabled onApply={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Apply template" })).not.toBeInTheDocument();
  });

  it("searches, shows scope metadata, and applies loaded template detail", async () => {
    vi.useFakeTimers();
    const onApply = vi.fn();
    render(<PreparationTemplatePicker onApply={onApply} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply template" }));
    await act(async () => Promise.resolve());

    expect(screen.getByText("stage-1 · subject-1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search templates"), {
      target: { value: "fractions" },
    });
    await act(async () => vi.advanceTimersByTime(300));
    expect(api.list).toHaveBeenLastCalledWith({
      page: 1,
      limit: 50,
      search: "fractions",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Use Fractions preset" }));
      await Promise.resolve();
    });
    expect(api.get).toHaveBeenCalledWith("template-1");
    expect(onApply).toHaveBeenCalledWith(detail());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fractions preset applied",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Review the populated fields, then save type details to keep these changes.",
    );
    expect(
      screen.getByRole("button", { name: "Choose another template" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Fractions preset", { selector: "h3" }),
    ).not.toBeInTheDocument();
  });

  it("closes without applying", async () => {
    const onApply = vi.fn();
    render(<PreparationTemplatePicker onApply={onApply} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply template" }));
    await screen.findByText("Fractions preset");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Fractions preset")).not.toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });
});
