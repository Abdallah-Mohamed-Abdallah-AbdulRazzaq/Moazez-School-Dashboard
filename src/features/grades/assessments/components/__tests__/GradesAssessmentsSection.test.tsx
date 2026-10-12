import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import type { Assessment } from "../../types";
import GradesAssessmentsSection from "../GradesAssessmentsSection";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const navigation = vi.hoisted(() => ({ assessmentId: null as string | null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.assessmentId
    ? { assessmentId: navigation.assessmentId } : {}),
}));

const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
beforeEach(() => { navigation.assessmentId = null; });
afterEach(() => {
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

const assessment: Assessment = {
  id: "assessment-1", termId: "term-1", subjectId: "subject-1",
  scopeType: "classroom", scopeId: "classroom-1", title: "Assessment",
  titleAr: "تقييم", type: "QUIZ", deliveryMode: "SCORE_ONLY",
  date: "2026-09-07", weight: 15, maxScore: 20, expectedTimeMinutes: 10,
  isLocked: false, approvalStatus: "published",
};

function section(assessments: Assessment[]) {
  return <GradesAssessmentsSection assessments={assessments} isReadOnly={false}
    canManageAssessments canPublishAssessments={false} canApproveAssessments={false}
    canLockAssessments={false} canManageGradeItems={false} canManageQuestions={false}
    canViewSubmissions={false} isBulkLoading={false} assessmentActionId={null}
    assessmentActionType={null} onBulkEntry={() => undefined} onPublish={() => undefined}
    onApprove={() => undefined} onLock={() => undefined} onEdit={() => undefined}
    onDelete={() => undefined} onManageQuestions={() => undefined}
    onViewSubmissions={() => undefined} />;
}

describe("GradesAssessmentsSection", () => {
  it("focuses the linked assessment after the list loads", async () => {
    navigation.assessmentId = assessment.id;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true, value: vi.fn(),
    });
    const { rerender } = render(section([]));
    rerender(section([{ ...assessment, id: "other-assessment", title: "Other assessment" }, assessment]));
    await waitFor(() => expect(document.activeElement).toHaveAttribute("id", "assessment-assessment-1"));
  });

  it("disables editing after an assessment is published", () => {
    render(section([assessment]));

    expect(screen.getByRole("button", { name: "actions.edit" })).toBeDisabled();
  });
});
