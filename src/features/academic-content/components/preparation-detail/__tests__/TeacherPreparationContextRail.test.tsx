import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeacherPreparationReferenceDisplay } from "../../../model/teacherPreparationDetail";
import type { AcademicContentApprovalHistoryResponse } from "../../../types/contracts";
import TeacherPreparationContextRail from "../TeacherPreparationContextRail";

const references: TeacherPreparationReferenceDisplay = {
  curriculum: "British Curriculum",
  curriculumUnit: "Number and Algebra",
  curriculumLesson: "Equivalent fractions",
  lessonPlan: "Fractions plan",
  lessonPlanItem: "Visual models",
  timetable: {
    classroom: "Grade 4 A",
    subject: "Mathematics",
    teacher: "Sarah Ali",
    period: "Period 3",
    time: "10:00–10:45",
    dayOfWeek: 2,
  },
};

const history: AcademicContentApprovalHistoryResponse = {
  items: [{
    approvalId: "approval-1",
    revisionId: "revision-1",
    roundNumber: 2,
    status: "APPROVED",
    submittedByUserId: "user-1",
    submittedAt: "2026-10-01T08:00:00.000Z",
    decidedByUserId: "user-missing",
    decidedAt: "2026-10-02T09:00:00.000Z",
    decisionNote: "Ready to teach",
  }],
  page: 1,
  limit: 50,
  total: 1,
};

const teachers = [{
  userId: "user-1",
  displayName: { fullName: "Sarah Ali" },
}];

function renderRail(overrides: Partial<ComponentProps<typeof TeacherPreparationContextRail>> = {}) {
  const props: ComponentProps<typeof TeacherPreparationContextRail> = {
    readiness: { canAdvance: false, blockingReasons: [{ code: "custom", message: "Complete the preparation" }] },
    references,
    referenceError: null,
    history,
    historyError: null,
    teachers,
    onRefreshReadiness: vi.fn(async () => undefined),
    onRetryHistory: vi.fn(),
    ...overrides,
  };
  render(<TeacherPreparationContextRail {...props} />);
  return props;
}

describe("TeacherPreparationContextRail", () => {
  it("uses authoritative readiness without inventing progress", () => {
    renderRail();
    const readiness = screen.getByRole("heading", { name: "Readiness" }).closest("section");
    expect(readiness).not.toBeNull();
    expect(within(readiness!).getByText("Incomplete")).toBeVisible();
    expect(within(readiness!).getByText("Complete the preparation")).toBeVisible();
    expect(within(readiness!).queryByText(/%|sections completed/i)).not.toBeInTheDocument();
  });

  it("shows resolved references and never exposes identifiers", () => {
    renderRail();
    expect(screen.getByText("British Curriculum")).toBeVisible();
    expect(screen.getByText("Grade 4 A")).toBeVisible();
    expect(screen.queryByText(/curriculum-1|entry-1/)).not.toBeInTheDocument();
  });

  it("renders approval rounds with resolved or neutral actor names", () => {
    renderRail();
    expect(screen.getByText("Round 2")).toBeVisible();
    expect(screen.getByText("Submitted by Sarah Ali")).toBeVisible();
    expect(screen.getByText("Decided by Name unavailable")).toBeVisible();
    expect(screen.queryByText("user-missing")).not.toBeInTheDocument();
  });

  it("keeps readiness visible when history or references fail", () => {
    const onRetryHistory = vi.fn();
    renderRail({
      referenceError: "References failed",
      historyError: "History failed",
      onRetryHistory,
    });
    expect(screen.getByText("Incomplete")).toBeVisible();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("References failed");
    expect(screen.getByText("History failed")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry approval history" }));
    expect(onRetryHistory).toHaveBeenCalledOnce();
  });
});
