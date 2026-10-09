import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import PreparationTemplateForm from "../PreparationTemplateForm";

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

const initial = {
  id: "template-1",
  name: "Existing template",
  description: " Existing description ",
  stageId: "stage-1",
  subjectId: "subject-1",
  topic: " Existing topic ",
  objectives: [" Existing objective "],
  learningOutcomes: [],
  teachingStrategies: [],
  activities: [],
  resourceNotes: " Resource note ",
  assessmentNotes: null,
  teacherNotes: null,
  createdByUserId: "user-1",
  updatedByUserId: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
} as const;

describe("PreparationTemplateForm", () => {
  beforeEach(() => {
    loadAcademicTargetOptions
      .mockReset()
      .mockReturnValue(new Promise(() => {}));
  });

  it("initializes edit values and submits the normalized backend contract", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <PreparationTemplateForm
        initial={initial}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: /Template name/ }),
    ).toHaveValue("Existing template");
    expect(
      screen.getByRole("textbox", { name: /Template name/ }),
    ).toHaveAttribute("maxLength", "180");
    expect(screen.getByLabelText("Description")).toHaveAttribute("maxLength", "1000");
    expect(screen.getByLabelText("Topic")).toHaveAttribute("maxLength", "500");
    expect(screen.getByLabelText("Resource notes")).toHaveAttribute(
      "maxLength",
      "4000",
    );
    expect(screen.getByLabelText("Objectives 1")).toHaveAttribute(
      "maxLength",
      "500",
    );
    expect(screen.getByLabelText("Stage")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable selection")).toHaveLength(2);
    expect(screen.queryByText("stage-1")).not.toBeInTheDocument();
    expect(screen.queryByText("subject-1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save template" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Existing template",
          description: "Existing description",
          stageId: "stage-1",
          subjectId: "subject-1",
          topic: "Existing topic",
          objectives: ["Existing objective"],
          resourceNotes: "Resource note",
          assessmentNotes: null,
        }),
      ),
    );
  });

  it.each([
    ["Template name", 181, "Template name cannot exceed 180 characters."],
    ["Description", 1001, "Description cannot exceed 1000 characters."],
    ["Topic", 501, "Topic cannot exceed 500 characters."],
    ["Resource notes", 4001, "Notes cannot exceed 4000 characters."],
  ])("validates the %s backend length limit", (label, length, message) => {
    render(
      <PreparationTemplateForm onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Template name/ }), {
      target: { value: label === "Template name" ? "x".repeat(length) : "Valid" },
    });
    if (label !== "Template name") {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "x".repeat(length) },
      });
    }

    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("rejects missing names and empty ordered-list items", async () => {
    const onSubmit = vi.fn();
    render(
      <PreparationTemplateForm onSubmit={onSubmit} onCancel={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Template name is required.");

    fireEvent.change(screen.getByRole("textbox", { name: /Template name/ }), {
      target: { value: "New template" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add objective" }));
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "List items cannot be empty.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("surfaces duplicate-name errors and prevents another submit while saving", async () => {
    let rejectSubmit!: (error: Error) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<boolean>((_, reject) => {
          rejectSubmit = reject;
        }),
    );
    render(
      <PreparationTemplateForm onSubmit={onSubmit} onCancel={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Template name/ }), {
      target: { value: "Duplicate" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rejectSubmit(new ApiError(
      "An active template with this name already exists",
      409,
      "academic_content.preparation_template.duplicate_name",
    ));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A template with this name already exists. Choose a different name.",
    );
  });

  it("cancels without submitting", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    render(
      <PreparationTemplateForm onSubmit={onSubmit} onCancel={onCancel} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
