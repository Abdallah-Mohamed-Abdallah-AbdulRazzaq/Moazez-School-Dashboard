import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AssessmentQuestionSettingsPanel from "../AssessmentQuestionSettingsPanel";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("AssessmentQuestionSettingsPanel", () => {
  it("cascades scope options through the academic hierarchy", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(
      <AssessmentQuestionSettingsPanel
        assessment={{
          id: "assessment-1",
          termId: "term-1",
          subjectId: "subject-1",
          scopeType: "classroom",
          scopeId: "classroom-1",
          title: "Assessment",
          titleAr: "تقييم",
          type: "QUIZ",
          deliveryMode: "QUESTION_BASED",
          date: "2026-09-07",
          weight: 15,
          maxScore: 20,
          expectedTimeMinutes: 10,
          isLocked: false,
          approvalStatus: "draft",
        }}
        termLabel="Term 1"
        scopeTypes={["school", "stage", "grade", "section", "classroom"]}
        scopeEntitiesByType={{
          school: [{ id: "school-1", name: "School", nameAr: "المدرسة", nameEn: "School", scopeType: "school" }],
          stage: [
            { id: "stage-1", name: "Stage 1", nameAr: "المرحلة الأولى", nameEn: "Stage 1", scopeType: "stage" },
            { id: "stage-2", name: "Stage 2", nameAr: "المرحلة الثانية", nameEn: "Stage 2", scopeType: "stage" },
          ],
          grade: [
            { id: "grade-1", name: "Grade 1", nameAr: "الصف الأول", nameEn: "Grade 1", scopeType: "grade", parentId: "stage-1" },
            { id: "grade-2", name: "Grade 2", nameAr: "الصف الثاني", nameEn: "Grade 2", scopeType: "grade", parentId: "stage-2" },
          ],
          section: [{ id: "section-1", name: "Section A", nameAr: "الشعبة أ", nameEn: "Section A", scopeType: "section", parentId: "grade-1" }],
          classroom: [{ id: "classroom-1", name: "Room 1", nameAr: "فصل 1", nameEn: "Room 1", scopeType: "classroom", parentId: "section-1" }],
        }}
        subjects={[{ id: "subject-1", name: "Arabic", nameAr: "العربية", nameEn: "Arabic" }]}
        pointsSummary={{ maxScore: 20, totalPoints: 20, difference: 0, isMatch: true }}
        validationErrors={{}}
        isReadOnly={false}
        onUpdate={onUpdate}
        onAutoDistributePoints={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("term")).toHaveValue("Term 1");
    expect(screen.getByLabelText("scopeType")).toBeInTheDocument();
    expect(screen.getByLabelText("scope")).toBeInTheDocument();
    expect(screen.getByLabelText("types.scopeTypes.stage")).toBeInTheDocument();
    expect(screen.getByLabelText("types.scopeTypes.grade")).toBeInTheDocument();
    expect(screen.getByLabelText("subject")).toBeInTheDocument();
    expect(screen.getByLabelText("testMode")).toHaveValue("testModes.electronic");
    expect(screen.getByLabelText("type")).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/)).toHaveValue(15);

    await user.click(screen.getByLabelText("types.scopeTypes.grade"));
    expect(screen.getByRole("button", { name: "Grade 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Grade 2" })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("types.scopeTypes.stage"));
    await user.click(screen.getByRole("button", { name: "Stage 2" }));

    expect(onUpdate).toHaveBeenCalledWith({ scopeType: "stage", scopeId: "stage-2" });
  });
});
