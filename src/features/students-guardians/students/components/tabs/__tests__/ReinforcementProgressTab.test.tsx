import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReinforcementProgressTab from "../ReinforcementProgressTab";
import { getStudentReinforcementProgress } from "@/features/reinforcement/services/reinforcementOverviewService";
import type { StudentReinforcementProgress } from "@/features/reinforcement/types";

const permissionState = vi.hoisted(() => ({ canView: true }));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const translate = (key: string) => key;
    translate.has = () => false;
    return translate;
  },
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (key: string) => key === "reinforcement.overview.view" && permissionState.canView,
    isPermissionsReady: true,
  }),
}));

vi.mock("@/features/reinforcement/services/reinforcementOverviewService", () => ({
  getStudentReinforcementProgress: vi.fn(),
}));

const response = {
  student: {
    id: "student-1",
    firstName: "Ali",
    lastName: "Dahshan",
    name: "Ali Dahshan",
    nameAr: null,
    code: null,
    admissionNo: null,
  },
  enrollment: {
    enrollmentId: "enrollment-1",
    classroomId: "classroom-1",
    sectionId: "section-1",
    gradeId: "grade-1",
    stageId: "stage-1",
  },
  assignments: {
    total: 1,
    notCompleted: 0,
    inProgress: 0,
    underReview: 0,
    completed: 1,
    cancelled: 0,
    completionRate: 100,
  },
  tasks: [
    {
      taskId: "task-1",
      assignmentId: "assignment-1",
      status: "completed",
      progress: 100,
      assignedAt: "2026-07-01T08:00:00.000Z",
      startedAt: "2026-07-01T09:00:00.000Z",
      completedAt: "2026-07-02T09:00:00.000Z",
      cancelledAt: null,
      task: {
        id: "task-1",
        academicYearId: "year-1",
        termId: "term-1",
        subjectId: null,
        titleEn: "Mission One",
        titleAr: "Mission One AR",
        source: "teacher",
        status: "completed",
        dueDate: null,
        assignedById: "teacher-1",
        assignedByName: "Teacher One",
        createdAt: "2026-07-01T08:00:00.000Z",
        updatedAt: "2026-07-02T09:00:00.000Z",
      },
    },
  ],
  submissions: {
    submitted: 0,
    approved: 1,
    rejected: 0,
    pendingReview: 0,
  },
  xp: {
    totalXp: 10,
    bySourceType: [
      { sourceType: "assignment", count: 1, totalXp: 10 },
    ],
    recentLedgerEntries: [],
  },
  recentReviews: [],
} satisfies StudentReinforcementProgress;

describe("ReinforcementProgressTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.canView = true;
    vi.mocked(getStudentReinforcementProgress).mockResolvedValue(response);
  });

  it("loads the student progress for the active academic context", async () => {
    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByText("Ali Dahshan")).toBeInTheDocument();
    expect(screen.getByText("Mission One")).toBeInTheDocument();
    expect(getStudentReinforcementProgress).toHaveBeenCalledWith("student-1", {
      academicYearId: "year-1",
      termId: "term-1",
    });
  });

  it("does not request data without view permission", async () => {
    permissionState.canView = false;
    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByText("common.accessDenied")).toBeInTheDocument();
    expect(getStudentReinforcementProgress).not.toHaveBeenCalled();
  });

  it("retries a failed request", async () => {
    const user = userEvent.setup();
    vi.mocked(getStudentReinforcementProgress)
      .mockRejectedValueOnce(new Error("Backend unavailable"))
      .mockResolvedValueOnce(response);

    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Backend unavailable");
    await user.click(screen.getByRole("button", { name: "actions.retry" }));

    await waitFor(() => expect(getStudentReinforcementProgress).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Ali Dahshan")).toBeInTheDocument();
  });

  it("shows an empty state when the endpoint returns no progress record", async () => {
    vi.mocked(getStudentReinforcementProgress).mockResolvedValue(null as never);

    render(<ReinforcementProgressTab studentId="student-1" academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByText("emptyStates.studentProgress")).toBeInTheDocument();
  });
});
