import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeworkGradeSyncPanel from "../HomeworkGradeSyncPanel";
import {
  getHomeworkGradeSyncStatus,
  linkHomeworkGradeSync,
  syncHomeworkGrades,
} from "../../services/homeworkService";
import { discoverHomeworkGradeSyncCandidates } from "../../services/homeworkGradeSyncCandidates";

const permissions = vi.hoisted(() => new Set<string>());
const push = vi.hoisted(() => vi.fn());
const showError = vi.fn();
const showSuccess = vi.fn();
const translate = (key: string) => key;

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translate,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academics/homework/homework-1",
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permissions.has(permission),
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showError, showSuccess }),
}));

vi.mock("@/components/ui/input/Select", () => ({
  default: ({ label, value, options, onChange, disabled }: {
    label: string;
    value?: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("../../services/homeworkService", () => ({
  getHomeworkGradeSyncStatus: vi.fn(),
  linkHomeworkGradeSync: vi.fn(),
  syncHomeworkGrades: vi.fn(),
}));

vi.mock("../../services/homeworkGradeSyncCandidates", () => ({
  discoverHomeworkGradeSyncCandidates: vi.fn(),
}));

const homework = (status: "published" | "cancelled" | "archived" = "published") => ({
  id: "homework-1",
  academicYearId: "year-1",
  termId: "term-1",
  subjectId: "subject-1",
  classroomId: "classroom-1",
  classroomSectionId: "section-1",
  classroomGradeId: "grade-1",
  title: "Homework",
  mode: "homework",
  status,
  targetMode: "classroom",
  totalMarks: 10,
  isGraded: true,
  questionCount: 0,
  attachmentCount: 0,
});

const candidate = {
  id: "assessment-1",
  academicYearId: "year-1",
  termId: "term-1",
  subjectId: "subject-1",
  scopeType: "classroom" as const,
  scopeId: "classroom-1",
  classroomId: "classroom-1",
  title: "Assignment",
  titleAr: "واجب",
  type: "ASSIGNMENT" as const,
  deliveryMode: "SCORE_ONLY" as const,
  date: "2026-01-01",
  weight: 1,
  maxScore: 10,
  isLocked: false,
  approvalStatus: "draft" as const,
};

describe("HomeworkGradeSyncPanel endpoint permissions and lifecycle", () => {
  beforeEach(() => {
    permissions.clear();
    vi.clearAllMocks();
    vi.mocked(getHomeworkGradeSyncStatus).mockResolvedValue({
      homeworkId: "homework-1",
      linked: false,
      syncSummary: {
        total: 4,
        synced: 1,
        pending: 3,
        failed: 0,
        lastSyncedAt: "2026-08-01T09:30:00.000Z",
      },
    });
    vi.mocked(discoverHomeworkGradeSyncCandidates).mockResolvedValue([candidate]);
  });

  it("renders sync-all with only the backend manage permission pair", async () => {
    permissions.add("homework.assignments.manage");
    permissions.add("grades.items.manage");
    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    const sync = await screen.findByRole("button", { name: "actions.syncAll" });
    expect(sync).toBeEnabled();
    fireEvent.click(sync);
    await waitFor(() => expect(syncHomeworkGrades).toHaveBeenCalledWith("homework-1"));
    expect(getHomeworkGradeSyncStatus).not.toHaveBeenCalled();
    expect(discoverHomeworkGradeSyncCandidates).not.toHaveBeenCalled();
  });

  it.each(["cancelled", "archived"] as const)(
    "discovers assessments only with grades.assessments.view and blocks links for %s work",
    async (status) => {
    permissions.add("homework.assignments.manage");
    permissions.add("grades.assessments.manage");
    permissions.add("grades.assessments.view");
    render(
      <HomeworkGradeSyncPanel
        homeworkId="homework-1"
        homework={homework(status)}
        isGraded
      />,
    );

    await waitFor(() => expect(discoverHomeworkGradeSyncCandidates).toHaveBeenCalled());
    expect(screen.getByLabelText("link.assessmentId")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "actions.link" })).not.toBeInTheDocument();
    expect(linkHomeworkGradeSync).not.toHaveBeenCalled();
    },
  );

  it("shows a linked assessment read-only and labels pending submissions correctly", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    permissions.add("homework.assignments.manage");
    permissions.add("grades.assessments.manage");
    permissions.add("grades.assessments.view");
    vi.mocked(getHomeworkGradeSyncStatus).mockResolvedValue({
      homeworkId: "homework-1",
      linked: true,
      gradeAssessment: { id: "linked-1", title: "Linked assignment" },
      syncSummary: { total: 4, synced: 1, pending: 3, failed: 0 },
    });
    vi.mocked(discoverHomeworkGradeSyncCandidates).mockResolvedValue([]);

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    const select = await screen.findByLabelText("link.assessmentId");
    await waitFor(() => expect(select).toHaveValue("linked-1"));
    expect(select).toBeDisabled();
    expect(screen.getByText("summary.pending")).toBeInTheDocument();
    expect(screen.queryByText("summary.skipped")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "actions.link" })).not.toBeInTheDocument();
  });

  it("shows sync freshness and explains when a visible status has no link", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    permissions.add("homework.assignments.manage");
    permissions.add("grades.items.manage");

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    expect(await screen.findByText("summary.lastSynced")).toBeInTheDocument();
    expect(screen.getByText("sync.linkRequired")).toBeInTheDocument();
  });

  it("explains which assessments can be linked", async () => {
    permissions.add("grades.assessments.view");

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    expect(await screen.findByText("link.eligibility")).toBeInTheDocument();
  });

  it("shows placeholders instead of zeroes while sync status is loading", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    vi.mocked(getHomeworkGradeSyncStatus).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText("...")).toHaveLength(4);
  });

  it("links a selected compatible assessment and reflects the linked status", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    permissions.add("homework.assignments.manage");
    permissions.add("grades.assessments.manage");
    permissions.add("grades.assessments.view");
    vi.mocked(linkHomeworkGradeSync).mockResolvedValue({
      homeworkId: "homework-1",
      linked: true,
      gradeAssessment: { id: "assessment-1", title: "Assignment" },
      warnings: [],
    });

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    const select = await screen.findByLabelText("link.assessmentId");
    fireEvent.change(select, { target: { value: "assessment-1" } });
    fireEvent.click(screen.getByRole("button", { name: "actions.link" }));

    await waitFor(() =>
      expect(linkHomeworkGradeSync).toHaveBeenCalledWith(
        "homework-1",
        "assessment-1",
      ),
    );
    expect(await screen.findByText("link.alreadyLinked")).toBeInTheDocument();
    expect(showSuccess).toHaveBeenCalledWith("messages.linked");
  });

  it("keeps grade sync unavailable while the visible status has no link", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    permissions.add("homework.assignments.manage");
    permissions.add("grades.items.manage");

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    expect(await screen.findByRole("button", { name: "actions.syncAll" })).toBeDisabled();
  });

  it("reports a link failure without changing the displayed status", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    permissions.add("homework.assignments.manage");
    permissions.add("grades.assessments.manage");
    permissions.add("grades.assessments.view");
    vi.mocked(linkHomeworkGradeSync).mockRejectedValue(new Error("Link failed"));

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    const select = await screen.findByLabelText("link.assessmentId");
    fireEvent.change(select, { target: { value: "assessment-1" } });
    fireEvent.click(screen.getByRole("button", { name: "actions.link" }));
    await waitFor(() => expect(showError).toHaveBeenCalledWith("errors.link"));
    expect(screen.queryByText("link.alreadyLinked")).not.toBeInTheDocument();
  });

  it("reports a sync failure without changing the linked status", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    permissions.add("homework.assignments.manage");
    permissions.add("grades.items.manage");
    vi.mocked(getHomeworkGradeSyncStatus).mockResolvedValue({
      homeworkId: "homework-1",
      linked: true,
      gradeAssessment: { id: "assessment-1", title: "Assignment" },
      warnings: [],
    });
    vi.mocked(syncHomeworkGrades).mockRejectedValue(new Error("Sync failed"));

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    fireEvent.click(await screen.findByRole("button", { name: "actions.syncAll" }));
    await waitFor(() => expect(showError).toHaveBeenCalledWith("errors.sync"));
    expect(screen.getByRole("alert")).toHaveTextContent("generic");
    expect(screen.getByRole("alert")).toHaveTextContent("sync.recovery");
    fireEvent.click(screen.getByRole("button", { name: "actions.reviewSubmissions" }));
    expect(push).toHaveBeenCalledWith("/en/academics/homework/homework-1?tab=submissions");
    expect(screen.getByText("link.alreadyLinked")).toBeInTheDocument();
  });

  it("reports a grade sync status load failure", async () => {
    permissions.add("homework.assignments.view");
    permissions.add("grades.items.view");
    vi.mocked(getHomeworkGradeSyncStatus).mockRejectedValue(
      new Error("Status unavailable"),
    );

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    await waitFor(() => expect(showError).toHaveBeenCalledWith("errors.load"));
  });

  it("reports an assessment discovery failure", async () => {
    permissions.add("grades.assessments.view");
    vi.mocked(discoverHomeworkGradeSyncCandidates).mockRejectedValue(
      new Error("Candidates unavailable"),
    );

    render(<HomeworkGradeSyncPanel homeworkId="homework-1" homework={homework()} isGraded />);

    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith("errors.loadAssessments"),
    );
  });
});
