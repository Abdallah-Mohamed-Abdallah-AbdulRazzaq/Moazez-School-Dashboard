import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentEditorSectionState } from "../useAcademicContentEditor";
import { useTeacherPreparationDetailDraft } from "../useTeacherPreparationDetailDraft";
import { emptyTeacherPreparationDetail } from "../../model/teacherPreparationDetail";

const cleanSection: AcademicContentEditorSectionState = {
  dirty: false,
  saving: false,
  error: null,
};

describe("useTeacherPreparationDetailDraft", () => {
  it("applies a template to the shared draft and marks it dirty once", () => {
    const onDirty = vi.fn();
    const initial = {
      ...emptyTeacherPreparationDetail(),
      curriculumId: "curriculum-1",
    };
    const { result } = renderHook(() =>
      useTeacherPreparationDetailDraft({
        initial,
        contentVersion: "content-1:v1",
        sectionState: cleanSection,
        onDirty,
        onSave: vi.fn().mockResolvedValue(true),
      }),
    );

    act(() =>
      result.current.applyTemplate({
        id: "template-1",
        name: "Fractions template",
        description: null,
        stageId: null,
        subjectId: null,
        topic: "Equivalent fractions",
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
        updatedAt: "2026-10-01T08:00:00.000Z",
      }),
    );

    expect(result.current.draft.topic).toBe("Equivalent fractions");
    expect(result.current.draft.objectives).toEqual(["Compare fractions"]);
    expect(result.current.draft.curriculumId).toBe("curriculum-1");
    expect(onDirty).toHaveBeenCalledOnce();
  });

  it("saves edits from separate panels as one complete payload", async () => {
    const onDirty = vi.fn();
    const onSave = vi.fn().mockResolvedValue(true);
    const initial = {
      ...emptyTeacherPreparationDetail(),
      learningOutcomes: ["Model fractions"],
      activities: ["Fraction wall"],
    };
    const { result } = renderHook(() =>
      useTeacherPreparationDetailDraft({
        initial,
        contentVersion: "content-1:v1",
        sectionState: { ...cleanSection, dirty: true },
        onDirty,
        onSave,
      }),
    );

    act(() => {
      result.current.update("objectives", [" Compare fractions "]);
      result.current.update("teacherNotes", " Use fraction tiles ");
    });
    await act(() => result.current.save());

    expect(onDirty).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenCalledWith({
      topic: null,
      objectives: ["Compare fractions"],
      learningOutcomes: ["Model fractions"],
      teachingStrategies: [],
      activities: ["Fraction wall"],
      resourceNotes: null,
      assessmentNotes: null,
      teacherNotes: "Use fraction tiles",
      curriculumId: null,
      curriculumUnitId: null,
      curriculumLessonId: null,
      lessonPlanId: null,
      lessonPlanItemId: null,
      timetableEntryId: null,
    });
  });

  it("blocks replacement when an ordered field contains an empty row", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useTeacherPreparationDetailDraft({
        initial: emptyTeacherPreparationDetail(),
        contentVersion: "content-1:v1",
        sectionState: cleanSection,
        onDirty: vi.fn(),
        onSave,
      }),
    );

    act(() => result.current.update("objectives", ["  "]));
    await act(() => result.current.save());

    expect(result.current.validationError).toBe("empty_items");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps unsaved values after a failed save", async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useTeacherPreparationDetailDraft({
        initial: emptyTeacherPreparationDetail(),
        contentVersion: "content-1:v1",
        sectionState: cleanSection,
        onDirty: vi.fn(),
        onSave,
      }),
    );

    act(() => result.current.update("topic", "Fractions"));
    await act(() => result.current.save());

    expect(result.current.draft.topic).toBe("Fractions");
  });

  it("resynchronizes a newer server version only when the editor is clean", () => {
    const initial = { ...emptyTeacherPreparationDetail(), topic: "Original" };
    const onSave = vi.fn().mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ topic, version, dirty }) =>
        useTeacherPreparationDetailDraft({
          initial: { ...initial, topic },
          contentVersion: version,
          sectionState: { ...cleanSection, dirty },
          onDirty: vi.fn(),
          onSave,
        }),
      { initialProps: { topic: "Original", version: "content-1:v1", dirty: false } },
    );

    rerender({ topic: "Server update", version: "content-1:v2", dirty: false });
    expect(result.current.draft.topic).toBe("Server update");

    act(() => result.current.update("topic", "Local edit"));
    rerender({ topic: "Newer server update", version: "content-1:v3", dirty: true });
    expect(result.current.draft.topic).toBe("Local edit");
  });
});
