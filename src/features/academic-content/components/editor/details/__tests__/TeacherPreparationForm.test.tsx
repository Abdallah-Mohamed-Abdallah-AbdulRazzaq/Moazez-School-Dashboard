import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeacherPreparationForm from "../TeacherPreparationForm";

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
});
