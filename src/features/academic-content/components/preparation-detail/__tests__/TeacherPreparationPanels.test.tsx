import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeacherPreparationDetailDraftController } from "../../../hooks/useTeacherPreparationDetailDraft";
import { EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS } from "../../../services/academicContentDetailOptions";
import TeacherPreparationNotesPanel from "../TeacherPreparationNotesPanel";
import TeacherPreparationOrderedListPanel from "../TeacherPreparationOrderedListPanel";
import TeacherPreparationReferencesPanel from "../TeacherPreparationReferencesPanel";

vi.mock("../../editor/details/AcademicReferenceFields", () => ({
  OptionalReferenceSelect: ({ label, onChange }: { label: string; onChange: (value: string | null) => void }) => (
    <button type="button" onClick={() => onChange(null)}>Clear {label}</button>
  ),
}));

function createController(): TeacherPreparationDetailDraftController {
  return {
    draft: {
      topic: "Fractions",
      objectives: ["Compare fractions"],
      learningOutcomes: [],
      teachingStrategies: [],
      activities: [],
      resourceNotes: "Use fraction tiles",
      assessmentNotes: "Exit ticket",
      teacherNotes: "Pair support",
      curriculumId: "curriculum-1",
      curriculumUnitId: "unit-1",
      curriculumLessonId: "lesson-1",
      lessonPlanId: "plan-1",
      lessonPlanItemId: "item-1",
      timetableEntryId: "entry-1",
    },
    validationError: null,
    update: vi.fn(),
    save: vi.fn(async () => true),
    resetValidation: vi.fn(),
  };
}

const dirtyState = { dirty: true, saving: false, error: null };

describe("teacher preparation detail panels", () => {
  it("edits ordered rows and saves through the shared controller", () => {
    const controller = createController();
    render(
      <TeacherPreparationOrderedListPanel
        title="Objectives"
        description="Define lesson objectives."
        itemLabel="Objectives"
        saveLabel="Save objectives"
        emptyItemError="Objectives cannot be empty."
        field="objectives"
        controller={controller}
        sectionState={dirtyState}
        disabled={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Objectives 1"), {
      target: { value: "Compare equivalent fractions" },
    });
    expect(controller.update).toHaveBeenCalledWith("objectives", ["Compare equivalent fractions"]);

    fireEvent.click(screen.getByRole("button", { name: "Save objectives" }));
    expect(controller.save).toHaveBeenCalledOnce();
  });

  it("enforces the backend note length and saves the complete shared draft", () => {
    const controller = createController();
    render(
      <TeacherPreparationNotesPanel
        title="Teacher notes"
        description="Private preparation notes."
        fieldLabel="Teacher notes"
        saveLabel="Save teacher notes"
        field="teacherNotes"
        controller={controller}
        sectionState={dirtyState}
        disabled={false}
      />,
    );

    expect(screen.getByLabelText("Teacher notes")).toHaveAttribute("maxlength", "4000");
    fireEvent.change(screen.getByLabelText("Teacher notes"), { target: { value: "Use pairs" } });
    expect(controller.update).toHaveBeenCalledWith("teacherNotes", "Use pairs");
    fireEvent.click(screen.getByRole("button", { name: "Save teacher notes" }));
    expect(controller.save).toHaveBeenCalledOnce();
  });

  it("clears dependent references without constructing a partial save payload", () => {
    const controller = createController();
    render(
      <TeacherPreparationReferencesPanel
        controller={controller}
        sectionState={dirtyState}
        options={EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS}
        disabled={false}
        isLoading={false}
        loadError={null}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear Curriculum" }));
    expect(controller.update).toHaveBeenCalledTimes(5);
    expect(controller.update).toHaveBeenCalledWith("curriculumId", null);
    expect(controller.update).toHaveBeenCalledWith("curriculumUnitId", null);
    expect(controller.update).toHaveBeenCalledWith("curriculumLessonId", null);
    expect(controller.update).toHaveBeenCalledWith("lessonPlanId", null);
    expect(controller.update).toHaveBeenCalledWith("lessonPlanItemId", null);

    fireEvent.click(screen.getByRole("button", { name: "Save academic references" }));
    expect(controller.save).toHaveBeenCalledOnce();
  });

  it("isolates a reference-loading failure and offers retry", () => {
    const onRetry = vi.fn();
    render(
      <TeacherPreparationReferencesPanel
        controller={createController()}
        sectionState={dirtyState}
        options={null}
        disabled={false}
        isLoading={false}
        loadError="References failed"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("References failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry references" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
