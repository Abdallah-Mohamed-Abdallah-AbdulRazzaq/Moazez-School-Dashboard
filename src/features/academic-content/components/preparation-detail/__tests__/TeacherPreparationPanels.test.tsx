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
  applyTemplate: vi.fn(),
  save: vi.fn(async () => true),
    resetValidation: vi.fn(),
  };
}

const dirtyState = { dirty: true, saving: false, error: null };

describe("teacher preparation detail panels", () => {
  it("edits ordered rows without exposing a local save action", () => {
    const controller = createController();
    render(
      <TeacherPreparationOrderedListPanel
        title="Objectives"
        description="Define lesson objectives."
        itemLabel="Objectives"
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

    expect(screen.queryByRole("button", { name: "Save objectives" })).not.toBeInTheDocument();
    expect(controller.save).not.toHaveBeenCalled();
  });

  it("does not expose a local save action in the notes panel", () => {
    const controller = createController();
    render(
      <TeacherPreparationNotesPanel
        title="Teacher notes"
        description="Private preparation notes."
        fieldLabel="Teacher notes"
        field="teacherNotes"
        controller={controller}
        sectionState={dirtyState}
        disabled={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Save teacher notes" })).not.toBeInTheDocument();
    expect(controller.save).not.toHaveBeenCalled();
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

    expect(screen.queryByRole("button", { name: "Save academic references" })).not.toBeInTheDocument();
    expect(controller.save).not.toHaveBeenCalled();
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
