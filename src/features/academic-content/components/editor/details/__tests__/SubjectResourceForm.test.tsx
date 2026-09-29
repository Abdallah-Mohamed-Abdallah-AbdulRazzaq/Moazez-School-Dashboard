import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SubjectResourceForm from "../SubjectResourceForm";

describe("SubjectResourceForm", () => {
  it("saves the category independently from file MIME type", () => {
    const onSave = vi.fn(async () => true);
    render(<SubjectResourceForm initial={{ resourceCategory: "WORKSHEET", curriculumId: null, curriculumUnitId: null, curriculumLessonId: null }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(onSave).toHaveBeenCalledWith({ resourceCategory: "WORKSHEET", curriculumId: null, curriculumUnitId: null, curriculumLessonId: null });
  });
});
