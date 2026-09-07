import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GradesAssessmentsSection from "../GradesAssessmentsSection";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("GradesAssessmentsSection", () => {
  it("disables editing after an assessment is published", () => {
    render(
      <GradesAssessmentsSection
        assessments={[
          {
            id: "assessment-1",
            termId: "term-1",
            subjectId: "subject-1",
            scopeType: "classroom",
            scopeId: "classroom-1",
            title: "Assessment",
            titleAr: "تقييم",
            type: "QUIZ",
            deliveryMode: "SCORE_ONLY",
            date: "2026-09-07",
            weight: 15,
            maxScore: 20,
            expectedTimeMinutes: 10,
            isLocked: false,
            approvalStatus: "published",
          },
        ]}
        isReadOnly={false}
        canManageAssessments
        canPublishAssessments={false}
        canApproveAssessments={false}
        canLockAssessments={false}
        canManageGradeItems={false}
        canManageQuestions={false}
        canViewSubmissions={false}
        isBulkLoading={false}
        assessmentActionId={null}
        assessmentActionType={null}
        onBulkEntry={vi.fn()}
        onPublish={vi.fn()}
        onApprove={vi.fn()}
        onLock={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onManageQuestions={vi.fn()}
        onViewSubmissions={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "actions.edit" })).toBeDisabled();
  });
});
