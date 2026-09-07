import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CreateAssessmentDialog from "../CreateAssessmentDialog";
import type { Assessment } from "../../../shared/types";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("CreateAssessmentDialog", () => {
  it("includes the optional expected duration in the submitted assessment", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CreateAssessmentDialog
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        termId="term-1"
        scopeTypes={["school"]}
        scopeEntitiesByType={{
          school: [{ id: "school-1", name: "School", nameAr: "مدرسة", nameEn: "School", scopeType: "school" }],
          stage: [],
          grade: [],
          section: [],
          classroom: [],
        }}
        subjects={[{ id: "subject-1", nameAr: "العربية", nameEn: "Arabic" }]}
        selectedScopeType="school"
        selectedScopeId="school-1"
        selectedSubjectId="subject-1"
        isSubmitting={false}
      />,
    );

    const expectedDuration = screen.getByLabelText("expectedTimeMinutes");
    expect(expectedDuration).toBeInTheDocument();

    await user.type(expectedDuration, "45");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        expectedTimeMinutes: 45,
      }));
    });
  });

  it("clears an existing expected duration when editing an assessment", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const assessment: Assessment = {
      id: "assessment-1",
      termId: "term-1",
      subjectId: "subject-1",
      scopeType: "school",
      scopeId: "school-1",
      title: "Quiz",
      titleAr: "اختبار",
      type: "QUIZ",
      deliveryMode: "SCORE_ONLY",
      date: "2026-09-07",
      weight: 15,
      maxScore: 20,
      expectedTimeMinutes: 45,
      isLocked: false,
      approvalStatus: "draft",
    };

    render(
      <CreateAssessmentDialog
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        termId="term-1"
        scopeTypes={["school"]}
        scopeEntitiesByType={{
          school: [{ id: "school-1", name: "School", nameAr: "مدرسة", nameEn: "School", scopeType: "school" }],
          stage: [],
          grade: [],
          section: [],
          classroom: [],
        }}
        subjects={[{ id: "subject-1", nameAr: "العربية", nameEn: "Arabic" }]}
        selectedScopeType="school"
        selectedScopeId="school-1"
        selectedSubjectId="subject-1"
        isSubmitting={false}
        mode="edit"
        initialAssessment={assessment}
      />,
    );

    await user.clear(screen.getByLabelText("expectedTimeMinutes"));
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        expectedTimeMinutes: null,
      }));
    });
  });
});
