import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import EnrollmentDetailsDrawer from "../EnrollmentDetailsDrawer";
import {
  fetchCurrentEnrollment,
  fetchEnrollmentHistory,
} from "../../api/enrollmentApi";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      "actions.transfer": "Transfer",
      "actions.promote": "Promote",
      "actions.withdraw": "Withdraw",
      "actions.new_enrollment": "New enrollment",
      "actions.details": "Details",
      "details.withdrawn_lifecycle_help": "Re-enroll this student before a new lifecycle action.",
    };

    return messages[key] ?? key;
  },
}));

vi.mock("../../api/enrollmentApi", () => ({
  fetchCurrentEnrollment: vi.fn(() => new Promise(() => {})),
  fetchEnrollmentHistory: vi.fn(() => new Promise(() => {})),
}));

const withdrawnEnrollment = {
  id: "enrollment-1",
  studentId: "student-1",
  studentName: "Student One",
  academicYear: "2026/2027",
  academicYearId: "year-1",
  grade: "Grade 1",
  gradeId: "grade-1",
  section: "Section A",
  sectionId: "section-1",
  classroom: "Class A",
  classroomId: "classroom-1",
  enrollmentDate: "2026-09-01",
  status: "withdrawn" as const,
};

describe("EnrollmentDetailsDrawer", () => {
  it("explains why lifecycle actions are unavailable for a withdrawn student", async () => {
    await act(async () => {
      render(
        <EnrollmentDetailsDrawer
          enrollment={withdrawnEnrollment}
          canManage
          canManageLifecycle
          onClose={vi.fn()}
          onReenroll={vi.fn()}
          onLifecycle={vi.fn()}
        />,
      );
      await Promise.resolve();
    });

    expect(
      screen.getByText("Re-enroll this student before a new lifecycle action."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Transfer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Promote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New enrollment" })).toBeEnabled();
  });

  it("keeps every action visible but disables ones outside the user's permissions", async () => {
    await act(async () => {
      render(
        <EnrollmentDetailsDrawer
          enrollment={withdrawnEnrollment}
          canManage={false}
          canManageLifecycle={false}
          onClose={vi.fn()}
          onReenroll={vi.fn()}
          onLifecycle={vi.fn()}
        />,
      );
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "New enrollment" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Transfer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Promote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });

  it("does not show a load error when optional current enrollment and history requests return not found", async () => {
    vi.mocked(fetchCurrentEnrollment).mockRejectedValueOnce(
      new ApiError("No active enrollment", 404, "students.enrollment.not_found"),
    );
    vi.mocked(fetchEnrollmentHistory).mockRejectedValueOnce(
      new ApiError("No enrollment history", 404, "students.enrollment.not_found"),
    );

    render(
      <EnrollmentDetailsDrawer
        enrollment={withdrawnEnrollment}
        canManage
        canManageLifecycle
        onClose={vi.fn()}
        onReenroll={vi.fn()}
        onLifecycle={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
