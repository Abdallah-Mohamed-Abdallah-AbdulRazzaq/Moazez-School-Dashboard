import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type { Curriculum, Unit } from "../../services/curriculumService";
import {
  createLesson,
  createUnit,
  deleteUnit,
} from "../../services/curriculumService";
import CurriculumEditor from "../CurriculumEditor";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("../../services/curriculumService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/curriculumService")>();
  return {
    ...actual,
    createLesson: vi.fn(),
    createUnit: vi.fn(),
    deleteLesson: vi.fn(),
    deleteUnit: vi.fn(),
    updateLesson: vi.fn(),
    updateUnit: vi.fn(),
  };
});

vi.mock("../LearningContentPanel", () => ({ default: () => null }));

vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", () => ({
  default: ({
    cancelLabel,
    confirmLabel,
    isOpen,
    onClose,
    onConfirm,
  }: {
    cancelLabel: string;
    confirmLabel: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={onClose}>{cancelLabel}</button>
        <button type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    ) : null,
}));

const curriculum = { id: "curriculum-1" } as Curriculum;
const unit = { id: "unit-1", curriculumId: curriculum.id } as Unit;

const baseProps = {
  curriculum,
  lessons: [],
  termWeeks: 12,
  onRefresh: vi.fn(async () => undefined),
  onDirtyChange: vi.fn(),
  isReadOnly: false,
};

describe("CurriculumEditor", () => {
  it("maps unit validation errors and clears the edited field error", async () => {
    const user = userEvent.setup();
    vi.mocked(createUnit).mockRejectedValueOnce(
      new ApiError("Validation failed", 422, "validation.failed", {
        title: ["Unit title already exists"],
        estimatedLessons: ["Estimated lessons must be positive"],
        sortOrder: ["Unit order is invalid"],
      }),
    );

    render(
      <CurriculumEditor
        {...baseProps}
        units={[]}
        selectedNode={{ type: "unit", id: "new" }}
      />,
    );

    await user.type(screen.getByLabelText(/title/), "Unit one");
    await user.type(screen.getByLabelText(/estimated_lessons/), "0");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("Unit title already exists")).toBeInTheDocument();
    expect(screen.getByText("Estimated lessons must be positive")).toBeInTheDocument();
    expect(screen.getByText("Unit order is invalid")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Unit one")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/title/), " revised");
    expect(screen.queryByText("Unit title already exists")).not.toBeInTheDocument();
    expect(screen.getByText("Estimated lessons must be positive")).toBeInTheDocument();
  });

  it("maps indexed lesson objective validation to the objectives field", async () => {
    const user = userEvent.setup();
    vi.mocked(createLesson).mockRejectedValueOnce(
      new ApiError("Validation failed", 422, "validation.failed", {
        "objectives.0": ["Objective is invalid"],
        estimatedMinutes: ["Duration must be positive"],
      }),
    );

    render(
      <CurriculumEditor
        {...baseProps}
        units={[unit]}
        selectedNode={{ type: "lesson", id: "new-unit-1" }}
      />,
    );

    await user.type(screen.getByLabelText(/title/), "Lesson one");
    await user.type(screen.getByLabelText(/objectives/), "Objective");
    await user.type(screen.getByLabelText(/duration_minutes/), "0");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("Objective is invalid")).toBeInTheDocument();
    expect(screen.getByText("Duration must be positive")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/objectives/), " revised");
    expect(screen.queryByText("Objective is invalid")).not.toBeInTheDocument();
    expect(screen.getByText("Duration must be positive")).toBeInTheDocument();
  });

  it("waits for modal confirmation before deleting a unit", async () => {
    const user = userEvent.setup();
    const existingUnit = {
      ...unit,
      title: "Unit one",
      description: null,
      estimatedLessons: null,
    } as Unit;

    render(
      <CurriculumEditor
        {...baseProps}
        units={[existingUnit]}
        selectedNode={{ type: "unit", id: "unit-1" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "delete" }));
    expect(deleteUnit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(deleteUnit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "delete" }));
    await user.click(screen.getAllByRole("button", { name: "delete" })[1]);

    expect(deleteUnit).toHaveBeenCalledOnce();
    expect(deleteUnit).toHaveBeenCalledWith("curriculum-1", "unit-1");
  });

  it("toggles between lesson form and learning content view for saved lessons", async () => {
    const user = userEvent.setup();
    const existingLesson = {
      id: "lesson-1",
      unitId: "unit-1",
      curriculumId: "curriculum-1",
      title: "Saved Lesson",
      description: "Desc",
      objectives: ["Objective 1"],
      estimatedMinutes: 30,
      sortOrder: 0,
    };

    render(
      <CurriculumEditor
        {...baseProps}
        units={[unit]}
        lessons={[existingLesson]}
        selectedNode={{ type: "lesson", id: "lesson-1" }}
      />,
    );

    const learningContentBtn = screen.getByRole("button", { name: "learning_content" });
    expect(learningContentBtn).toBeInTheDocument();

    await user.click(learningContentBtn);

    const backBtn = screen.getByRole("button", { name: "back_to_form" });
    expect(backBtn).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "learning_content" })).not.toBeInTheDocument();

    await user.click(backBtn);

    expect(screen.getByRole("button", { name: "learning_content" })).toBeInTheDocument();
  });
});
