import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AssessmentQuestionBuilderHeader from "../AssessmentQuestionBuilderHeader";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("AssessmentQuestionBuilderHeader", () => {
  it("lets an eligible assessment be published or deleted from the header", async () => {
    const user = userEvent.setup();
    const onWorkflowAction = vi.fn();
    const onDeleteAssessment = vi.fn();

    render(
      <AssessmentQuestionBuilderHeader
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
        isReadOnly={false}
        isAssessmentDirty={false}
        isQuestionDirty={false}
        isAssignmentSaving={false}
        isQuestionSaving={false}
        workflowAction="publish"
        isWorkflowActionSaving={false}
        isWorkflowActionDisabled={false}
        canDeleteAssessment
        isDeletingAssessment={false}
        onBack={vi.fn()}
        onSaveAssessment={vi.fn()}
        onWorkflowAction={onWorkflowAction}
        onDeleteAssessment={onDeleteAssessment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.publish" }));
    await user.click(screen.getByRole("button", { name: "actions.delete" }));

    expect(onWorkflowAction).toHaveBeenCalledWith("publish");
    expect(onDeleteAssessment).toHaveBeenCalledOnce();
  });
});
