import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeroJourneyTab from "../HeroJourneyTab";
import type { Student } from "@/features/students-guardians/students/types";
import { getStudentHeroJourneyProgress } from "@/features/hero-journey/services/heroJourneyProgressService";
import { awardHeroJourneyBadge, getStudentHeroJourneyRewards } from "@/features/hero-journey/services/heroJourneyRewardsService";
import { ApiError } from "@/lib/api-error";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      title: "Hero Journey",
      overallCompletion: "Overall mission completion",
      missionsCount: "{count} missions",
      academicContext: "Academic context: {year} · {term}",
      grantXp: "Grant XP",
      awardBadge: "Award badge",
      completeBeforeRewards: "Complete a mission before granting its rewards.",
      "statuses.not_started": "Not started",
      "statuses.in_progress": "In progress",
      "statuses.completed": "Completed",
      "statuses.cancelled": "Cancelled",
      "events.objective_completed": "Objective completed",
      requiredObjectives: "{completed}/{required} required objectives",
      missionProgress: "Mission progress",
      awaitingCompletion: "All required objectives are complete; this mission is awaiting final completion.",
      badge: "Badge",
      badgeImageUnavailable: "Badge image unavailable",
      recentActivity: "Recent activity",
      mission: "Mission",
      heroJourney: "Hero Journey",
      missions: "Missions",
      complete: "Completed",
      reference: "Reference",
      unableAward: "Unable to award a badge.",
      unableGrant: "Unable to grant XP.",
      unableLoad: "Unable to load Hero Journey data.",
      noDescription: "No description",
      retry: "Retry",
    };
    return (messages[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? `{${name}}`));
  },
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (key: string) => key === "reinforcement.hero.progress.manage",
    isPermissionsReady: true,
  }),
}));

vi.mock("@/features/hero-journey/services/heroJourneyProgressService", () => ({
  getStudentHeroJourneyProgress: vi.fn(),
}));

vi.mock("@/features/hero-journey/services/heroJourneyRewardsService", () => ({
  getStudentHeroJourneyRewards: vi.fn(),
  grantHeroJourneyXp: vi.fn(),
  awardHeroJourneyBadge: vi.fn(),
}));

const student = {
  id: "student-1",
  first_name_en: "Ali",
  last_name_en: "Dahshan",
} as Student;

describe("HeroJourneyTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStudentHeroJourneyProgress).mockResolvedValue({
      progressId: "progress-1",
      summary: {
        missionsTotal: 2,
        notStarted: 0,
        inProgress: 2,
        completed: 0,
        cancelled: 0,
        completionRate: 0,
      },
      missions: [
        {
          missionId: "mission-2",
          progressId: "mission-progress-2",
          status: "in_progress",
          progressPercent: 100,
          titleEn: "Test mission",
          lastActivityAt: "2026-07-12T18:40:25.235Z",
          badgeReward: { nameEn: "Super", assetPath: "https://example.com/badge.png" },
          objectives: { required: 2, completedRequired: 2 },
        },
      ],
      recentEvents: [
        {
          id: "event-1",
          type: "objective_completed",
          missionId: "mission-2",
          occurredAt: "2026-07-12T18:40:25.235Z",
        },
      ],
    });
    vi.mocked(getStudentHeroJourneyRewards).mockResolvedValue({
      summary: { totalHeroXp: 75, badgesCount: 1 },
      badges: [],
      xpLedger: [],
    });
  });

  it("shows a completion callout and resolves activity to the mission title", async () => {
    render(
      <HeroJourneyTab
        student={student}
        academicYearId="year-1"
        termId="term-1"
      />,
    );

    expect(await screen.findByText("All required objectives are complete; this mission is awaiting final completion.")).toBeInTheDocument();
    expect(screen.getAllByText("Test mission").length).toBeGreaterThan(0);
    expect(screen.queryByText("mission-2")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("img", { name: "Super" })).toHaveAttribute("src", "https://example.com/badge.png");
    expect(document.querySelectorAll('time[datetime="2026-07-12T18:40:25.235Z"]').length).toBeGreaterThan(0);
    expect(screen.getByText(/year-1/)).toBeInTheDocument();
  });

  it("requests audit events and enables actions from a mission progress id", async () => {
    vi.mocked(getStudentHeroJourneyProgress).mockResolvedValue({
      progressId: "",
      summary: { missionsTotal: 1, completed: 1, completionRate: 100 },
      missions: [{ missionId: "mission-2", progressId: "mission-progress-2", status: "completed", titleEn: "Test mission", objectives: {} }],
    });
    render(<HeroJourneyTab student={student} academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByRole("button", { name: "Grant XP" })).toBeEnabled();
    expect(getStudentHeroJourneyRewards).toHaveBeenCalledWith("student-1", {
      academicYearId: "year-1",
      termId: "term-1",
      includeEvents: true,
    });
  });

  it("opens a focused XP dialog instead of exposing an inline amount input", async () => {
    vi.mocked(getStudentHeroJourneyProgress).mockResolvedValue({
      summary: { missionsTotal: 1, completed: 1, completionRate: 100 },
      missions: [{ missionId: "mission-2", progressId: "mission-progress-2", status: "completed", titleEn: "Test mission", objectives: {} }],
    });
    const user = userEvent.setup();
    render(
      <HeroJourneyTab
        student={student}
        academicYearId="year-1"
        termId="term-1"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Grant XP" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("XP amount")).toBeInTheDocument();
  });

  it("blocks rewards until a mission is completed", async () => {
    render(<HeroJourneyTab student={student} academicYearId="year-1" termId="term-1" />);

    expect(await screen.findByRole("button", { name: "Award badge" })).toBeDisabled();
    expect(screen.getByText("Complete a mission before granting its rewards.")).toBeInTheDocument();
  });

  it("shows the backend validation message and trace id if completion changes before awarding", async () => {
    const user = userEvent.setup();
    vi.mocked(getStudentHeroJourneyProgress).mockResolvedValue({
      summary: { missionsTotal: 1, completed: 1, completionRate: 100 },
      missions: [{ missionId: "mission-2", progressId: "mission-progress-2", status: "completed", titleEn: "Test mission", objectives: {} }],
    });
    vi.mocked(awardHeroJourneyBadge).mockRejectedValue(new ApiError(
      "Hero mission progress must be completed before rewards can be granted",
      400,
      "validation.failed",
      undefined,
      { progressId: "mission-progress-2", status: "IN_PROGRESS" },
      "trace-123",
    ));

    render(<HeroJourneyTab student={student} academicYearId="year-1" termId="term-1" />);
    await user.click(await screen.findByRole("button", { name: "Award badge" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Hero mission progress must be completed before rewards can be granted");
    expect(screen.getByRole("alert")).toHaveTextContent("trace-123");
  });
});
