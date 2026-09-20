import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReassignmentPreviewDialog from "@/features/academics/teacher-allocation/components/ReassignmentPreviewDialog";
import type { PreparedTeacherAllocationReassignment } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: { count?: number }) => {
      const translations: Record<string, string> = {
        "reassignment.title": "Review teacher reassignment",
        "reassignment.description": "Review affected records before confirming.",
        "reassignment.currentTeacher": "Current teacher",
        "reassignment.targetTeacher": "Replacement teacher",
        "reassignment.status.ready": "Ready",
        "reassignment.status.blocked": "Blocked",
        "reassignment.sections.transfers": "Responsibilities transferred",
        "reassignment.sections.history": "Historical records preserved",
        "reassignment.sections.policies": "Records that remain unchanged",
        "reassignment.sections.blockers": "Blocking issues",
        "reassignment.actions.cancel": "Cancel",
        "reassignment.actions.confirm": "Confirm reassignment",
        "reassignment.actions.confirming": "Reassigning",
        "reassignment.actions.handoff.timetable": "Timetable entries transferred",
        "reassignment.history.timetable": "Timetable history preserved",
        "reassignment.blockers.targetTeacherConflict": "Target teacher conflict",
        "reassignment.policies.assessments": "Assessment access remains contextual",
        "reassignment.policies.curriculum": "Curriculum is not changed",
        "reassignment.policies.attendance": "Attendance history is preserved",
        "reassignment.policies.messages": "Message history is not rewritten",
      };
      const translated = translations[key] ?? key;
      return values?.count === undefined
        ? translated
        : `${translated}: ${values.count}`;
    },
}));

const readyReassignment: PreparedTeacherAllocationReassignment = {
  originalAllocation: {
    id: "allocation-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "subject-1",
    teacherId: "teacher-user-1",
  },
  nextAllocation: {
    id: "allocation-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    subjectId: "subject-1",
    teacherId: "teacher-user-2",
  },
  preview: {
    allocation: {
      id: "allocation-1",
      subjectId: "subject-1",
      classroomId: "classroom-1",
      termId: "term-1",
    },
    currentTeacher: { userId: "teacher-user-1", fullName: "Teacher One" },
    targetTeacher: { userId: "teacher-user-2", fullName: "Teacher Two" },
    decision: "ready",
    canReassign: true,
    impactFingerprint: "a".repeat(64),
    impact: {
      timetable: {
        draft: 1,
        active: 0,
        cancelled: 1,
        targetTeacherConflicts: 0,
      },
      lessonPlans: { draft: 0, active: 0, archived: 0 },
      homework: {
        draft: 0,
        published: 0,
        closed: 0,
        cancelled: 0,
        archived: 0,
      },
      reinforcement: {
        notCompleted: 0,
        inProgress: 0,
        underReview: 0,
        completed: 0,
        cancelled: 0,
      },
      announcements: {
        draft: 0,
        scheduled: 0,
        published: 0,
        archived: 0,
        cancelled: 0,
      },
      assessments: { policy: "contextual_access_no_rewrite" },
      curriculum: { policy: "no_mutation" },
      attendance: { policy: "historical_preserve" },
      messages: { policy: "no_history_rewrite" },
    },
    blockers: [],
    automaticActions: [
      {
        domain: "timetable",
        action: "handoff_current_responsibility",
        count: 1,
      },
    ],
    historicalRecords: [
      {
        domain: "timetable",
        action: "preserve_historical_authorship",
        count: 1,
      },
    ],
  },
};

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof ReassignmentPreviewDialog>> = {},
) {
  const props: React.ComponentProps<typeof ReassignmentPreviewDialog> = {
    open: true,
    reassignments: [readyReassignment],
    isSubmitting: false,
    error: null,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  render(<ReassignmentPreviewDialog {...props} />);
  return props;
}

describe("ReassignmentPreviewDialog", () => {
  it("shows the reviewed teachers and enables confirmation for ready previews", () => {
    const props = renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Teacher One")).toBeInTheDocument();
    expect(screen.getByText("Teacher Two")).toBeInTheDocument();
    expect(
      screen.getByText(/Timetable entries transferred: 1/),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm reassignment" }),
    );
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it("shows blocker counts and disables confirmation for blocked previews", () => {
    renderDialog({
      reassignments: [
        {
          ...readyReassignment,
          preview: {
            ...readyReassignment.preview,
            decision: "blocked",
            canReassign: false,
            blockers: [
              {
                domain: "timetable",
                code: "target_teacher_conflict",
                count: 2,
              },
            ],
          },
        },
      ],
    });

    expect(screen.getByText(/Target teacher conflict: 2/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm reassignment" }),
    ).toBeDisabled();
  });

  it("cancels without confirming", () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onCancel).toHaveBeenCalledOnce();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("prevents dismissal while a reassignment is being submitted", () => {
    renderDialog({ isSubmitting: true });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Reassigning" }),
    ).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Close modal" })).not.toBeInTheDocument();
  });
});
