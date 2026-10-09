import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeacherPreparationForm from "../TeacherPreparationForm";

const template = {
  id: "template-1",
  name: "Preset",
  description: null,
  stageId: null,
  subjectId: null,
  topic: "Template topic",
  objectives: ["Template objective"],
  learningOutcomes: [],
  teachingStrategies: [],
  activities: [],
  resourceNotes: null,
  assessmentNotes: null,
  teacherNotes: null,
  createdByUserId: "user-1",
  updatedByUserId: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-02T08:00:00.000Z",
};

vi.mock("../../../templates/PreparationTemplatePicker", () => ({
  default: ({
    disabled,
    onApply,
  }: {
    disabled?: boolean;
    onApply: (selected: typeof template) => void;
  }) =>
    disabled ? null : (
      <button type="button" onClick={() => onApply(template)}>
        Apply mocked template
      </button>
    ),
}));

describe("TeacherPreparationForm", () => {
  it("normalizes ordered text and sends only the preparation contract", () => {
    const onSave = vi.fn(async () => true);
    render(<TeacherPreparationForm initial={{ topic: " Fractions ", objectives: [" Compare   values "], learningOutcomes: [], teachingStrategies: [], activities: [], resourceNotes: null, assessmentNotes: null, teacherNotes: null, curriculumId: null, curriculumUnitId: null, curriculumLessonId: null, lessonPlanId: null, lessonPlanItemId: null, timetableEntryId: null }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      topic: "Fractions",
      objectives: ["Compare values"],
      curriculumId: null,
    }));
  });

  it("applies template fields locally once without saving or adding a template id", () => {
    const onDirty = vi.fn();
    const onSave = vi.fn(async () => true);
    render(<TeacherPreparationForm initial={{ topic: "Current", objectives: [], learningOutcomes: [], teachingStrategies: [], activities: [], resourceNotes: null, assessmentNotes: null, teacherNotes: null, curriculumId: "curriculum-1", curriculumUnitId: null, curriculumLessonId: null, lessonPlanId: null, lessonPlanItemId: null, timetableEntryId: "entry-1" }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={onDirty} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Apply mocked template" }));

    expect(screen.getByLabelText("Topic")).toHaveValue("Template topic");
    expect(screen.getByLabelText("Objectives 1")).toHaveValue("Template objective");
    expect(onDirty).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.not.objectContaining({ templateId: expect.anything() }),
    );
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "Template topic",
        curriculumId: "curriculum-1",
        timetableEntryId: "entry-1",
      }),
    );
  });

  it("hides the template picker when the form is read-only", () => {
    render(<TeacherPreparationForm initial={{ topic: null, objectives: [], learningOutcomes: [], teachingStrategies: [], activities: [], resourceNotes: null, assessmentNotes: null, teacherNotes: null, curriculumId: null, curriculumUnitId: null, curriculumLessonId: null, lessonPlanId: null, lessonPlanItemId: null, timetableEntryId: null }} disabled sectionState={{ dirty: false, saving: false, error: null }} onDirty={vi.fn()} onSave={vi.fn(async () => true)} />);

    expect(screen.queryByRole("button", { name: "Apply mocked template" })).not.toBeInTheDocument();
  });
});
