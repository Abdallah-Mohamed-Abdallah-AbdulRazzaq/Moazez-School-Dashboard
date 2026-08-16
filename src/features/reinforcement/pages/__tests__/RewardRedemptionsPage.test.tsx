import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import type { RewardRedemption } from "../../types";
import RewardRedemptionsPage from "../RewardRedemptionsPage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/en/reinforcement/rewards/redemptions",
  useParams: () => ({ lang: "en" }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const authState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

const redemptionMocks = vi.hoisted(() => ({
  listRewardRedemptions: vi.fn(),
  getRewardRedemption: vi.fn(),
  createRewardRedemption: vi.fn(),
  approveRewardRedemption: vi.fn(),
  rejectRewardRedemption: vi.fn(),
  fulfillRewardRedemption: vi.fn(),
  cancelRewardRedemption: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => ({
  listRewardCatalog: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isLoading: false,
    user: {
      id: "admin-1",
      activeMembership: {
        permissions: authState.permissions,
      },
    },
  }),
}));

vi.mock(
  "@/features/reinforcement/services/rewardRedemptionsService",
  () => redemptionMocks,
);
vi.mock(
  "@/features/reinforcement/services/rewardCatalogService",
  () => catalogMocks,
);
vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

const requestedRedemption = {
  id: "redemption-requested",
  catalogItemId: "reward-1",
  studentId: "student-1",
  status: "requested" as const,
  requestSource: "dashboard" as const,
  requestedAt: "2026-06-29T10:00:00.000Z",
  student: { name: "Student One", nameAr: "الطالب الأول" },
  catalogItem: { id: "reward-1", titleEn: "Gold Badge", titleAr: "شارة ذهبية" },
};

const approvedRedemption = {
  id: "redemption-approved",
  catalogItemId: "reward-2",
  studentId: "student-2",
  status: "approved" as const,
  requestSource: "teacher" as const,
  requestedAt: "2026-06-29T11:00:00.000Z",
  student: { name: "Student Two", nameAr: "الطالب الثاني" },
  catalogItem: { id: "reward-2", titleEn: "Book Voucher", titleAr: "قسيمة كتاب" },
};

function makeCompleteRedemption(
  base: {
    id: string;
    catalogItemId: string;
    studentId: string;
    status: RewardRedemption["status"];
    requestSource: RewardRedemption["requestSource"];
    requestedAt: string;
    student: { nameAr: string };
    catalogItem: { id: string; titleEn: string; titleAr: string };
  },
  overrides: Partial<RewardRedemption> = {},
): RewardRedemption {
  return {
    ...base,
    enrollmentId: `${base.id}-enrollment`,
    academicYearId: "year-1",
    termId: "term-1",
    requestedById: "admin-1",
    reviewedById: null,
    fulfilledById: null,
    cancelledById: null,
    reviewedAt: null,
    fulfilledAt: null,
    cancelledAt: null,
    requestNoteEn: "Please prepare it today.",
    requestNoteAr: null,
    reviewNoteEn: null,
    reviewNoteAr: null,
    fulfillmentNoteEn: null,
    fulfillmentNoteAr: null,
    cancellationReasonEn: null,
    cancellationReasonAr: null,
    eligibilitySnapshot: {
      eligible: true,
      minTotalXp: 50,
      isUnlimited: false,
      totalEarnedXp: 80,
      stockAvailable: true,
      stockRemaining: 10,
      catalogItemStatus: "published",
    },
    catalogItem: {
      ...base.catalogItem,
      type: "physical",
      status: "published",
      minTotalXp: 50,
      isUnlimited: false,
      stockRemaining: 10,
      imageFileId: null,
    },
    student: {
      id: base.studentId,
      firstName: "Student",
      lastName: base.id === "redemption-approved" ? "Two" : "One",
      nameAr: base.student.nameAr,
      code: null,
      admissionNo: null,
    },
    enrollment: {
      id: `${base.id}-enrollment`,
      academicYearId: "year-1",
      termId: "term-1",
      classroomId: "classroom-1",
      sectionId: "section-1",
      gradeId: "grade-1",
      stageId: "stage-1",
    },
    academicYear: {
      id: "year-1",
      nameEn: "Academic Year 2026",
      nameAr: "العام الدراسي 2026",
      isActive: true,
    },
    term: {
      id: "term-1",
      academicYearId: "year-1",
      nameEn: "Term 1",
      nameAr: "الفصل الأول",
      isActive: true,
    },
    createdAt: base.requestedAt,
    updatedAt: base.requestedAt,
    ...overrides,
  };
}

const requestedRedemptionDetail = makeCompleteRedemption(requestedRedemption);
const approvedRedemptionDetail = makeCompleteRedemption(approvedRedemption);

function renderPage() {
  render(
    <ToastProvider>
      <RewardRedemptionsPage />
    </ToastProvider>,
  );
}

function mockSuccessfulLookups() {
  filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
    stages: [{ id: "stage-1", nameEn: "Stage 1", nameAr: "Stage 1" }],
    grades: [{ id: "grade-1", stageId: "stage-1", nameEn: "Grade 1", nameAr: "Grade 1" }],
    sections: [{ id: "section-1", gradeId: "grade-1", nameEn: "Section 1", nameAr: "Section 1" }],
    classrooms: [{ id: "classroom-1", sectionId: "section-1", nameEn: "Classroom 1", nameAr: "Classroom 1" }],
    students: [
      {
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        nameEn: "Student One",
        classroom: {
          id: "classroom-1",
          section: {
            id: "section-1",
            grade: {
              id: "grade-1",
              stageId: "stage-1",
            },
          },
        },
        nameAr: "الطالب الأول",
      },
    ],
  });
  catalogMocks.listRewardCatalog.mockResolvedValue({
    items: [
      {
        id: "reward-1",
        titleEn: "Gold Badge",
        titleAr: "شارة ذهبية",
        status: "published",
        minTotalXp: 50,
      },
    ],
  });
}

async function openCreateModal() {
  const user = userEvent.setup();
  renderPage();
  await user.click(
    await screen.findByRole("button", {
      name: "rewardsModule.redemptions.create.button",
    }),
  );
  await screen.findByText("rewardsModule.redemptions.create.title");
  return user;
}

async function selectCreateModalOptions(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() =>
    expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled(),
  );

  for (const [label, option] of [
    ["Stage", "Stage 1"],
    ["Grade", "Grade 1"],
    ["Section", "Section 1"],
    ["Classroom", "Classroom 1"],
    ["rewardsModule.redemptions.create.student", "Student One"],
  ]) {
    await user.click(await screen.findByRole("button", { name: label }));
    await user.click(await screen.findByRole("button", { name: option }));
  }

  await user.click(
    screen.getByRole("button", {
      name: "rewardsModule.redemptions.create.reward",
    }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Gold Badge · 50 XP" }),
  );
}

describe("RewardRedemptionsPage", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/en/reinforcement/rewards/redemptions");
    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.redemptions.request",
      "reinforcement.rewards.redemptions.review",
      "reinforcement.rewards.fulfill",
    ];
    redemptionMocks.listRewardRedemptions.mockReset().mockResolvedValue({
      items: [requestedRedemptionDetail, approvedRedemptionDetail],
      total: 2,
    });
    redemptionMocks.getRewardRedemption
      .mockReset()
      .mockResolvedValue(requestedRedemptionDetail);
    redemptionMocks.createRewardRedemption.mockReset().mockResolvedValue({
      ...requestedRedemptionDetail,
      id: "created-redemption",
    });
    redemptionMocks.approveRewardRedemption.mockReset();
    redemptionMocks.rejectRewardRedemption.mockReset();
    redemptionMocks.fulfillRewardRedemption.mockReset();
    redemptionMocks.cancelRewardRedemption.mockReset();
    catalogMocks.listRewardCatalog.mockReset();
    filterOptionMocks.getReinforcementFilterOptions.mockReset();
    mockSuccessfulLookups();
  });

  it("forwards academic year and term URL context to the redemption list", async () => {
    window.history.replaceState(
      null,
      "",
      "/en/reinforcement/rewards/redemptions?academicYearId=year-1&termId=term-1",
    );

    renderPage();

    await waitFor(() =>
      expect(redemptionMocks.listRewardRedemptions).toHaveBeenCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
        }),
      ),
    );
  });

  it("shows create and cancel only with request permission", async () => {
    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.redemptions.request",
    ];

    renderPage();

    expect(
      await screen.findByRole("button", {
        name: "rewardsModule.redemptions.create.button",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: "rewardsModule.actions.cancel",
      }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.approve" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.reject" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.fulfill" }),
    ).not.toBeInTheDocument();
  });

  it("shows approve and reject only with review permission", async () => {
    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.redemptions.review",
    ];

    renderPage();

    expect(
      await screen.findByRole("button", { name: "rewardsModule.actions.approve" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "rewardsModule.actions.reject" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "rewardsModule.redemptions.create.button",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.fulfill" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.cancel" }),
    ).not.toBeInTheDocument();
  });

  it("shows fulfill only with fulfill permission", async () => {
    cleanup();

    authState.permissions = [
      "reinforcement.rewards.redemptions.view",
      "reinforcement.rewards.fulfill",
    ];
    renderPage();

    expect(
      await screen.findByRole("button", { name: "rewardsModule.actions.fulfill" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "rewardsModule.actions.approve" }),
    ).not.toBeInTheDocument();
  });

  it("opens the details drawer from the view button", async () => {
    const user = userEvent.setup();
    renderPage();

    const viewButtons = await screen.findAllByRole("button", {
      name: "rewardsModule.actions.view",
    });
    await user.click(viewButtons[0]);

    await waitFor(() =>
      expect(redemptionMocks.getRewardRedemption).toHaveBeenCalledWith(
        "redemption-requested",
      ),
    );
    expect(await screen.findByText("Please prepare it today.")).toBeInTheDocument();
    expect(screen.getByText("Academic Year 2026")).toBeInTheDocument();
  });

  it("opens the details drawer from a row click", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Student One"));

    await waitFor(() =>
      expect(redemptionMocks.getRewardRedemption).toHaveBeenCalledWith(
        "redemption-requested",
      ),
    );
    expect(await screen.findByText("Please prepare it today.")).toBeInTheDocument();
  });

  it("does not open the details drawer when a workflow action is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", {
        name: "rewardsModule.actions.approve",
      }),
    );

    expect(redemptionMocks.getRewardRedemption).not.toHaveBeenCalled();
    expect(
      screen.getByText("redemptions.modal.approveTitle"),
    ).toBeInTheDocument();
  });

  it("creates a dashboard redemption request and refreshes the list", async () => {
    const user = await openCreateModal();

    await selectCreateModalOptions(user);
    const listCallsBeforeSubmit =
      redemptionMocks.listRewardRedemptions.mock.calls.length;
    await user.type(
      screen.getByLabelText("rewardsModule.redemptions.create.requestNoteEn"),
      "  Please prepare it today.  ",
    );
    await user.click(
      screen.getByRole("button", {
        name: "rewardsModule.redemptions.create.submit",
      }),
    );

    await waitFor(() =>
      expect(redemptionMocks.createRewardRedemption).toHaveBeenCalledWith({
        catalogItemId: "reward-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        requestSource: "dashboard",
        requestNoteEn: "Please prepare it today.",
      }),
    );
    await waitFor(() =>
      expect(redemptionMocks.listRewardRedemptions.mock.calls.length).toBeGreaterThan(
        listCallsBeforeSubmit,
      ),
    );
  });

  it("keeps the page and create modal usable when lookups fail", async () => {
    filterOptionMocks.getReinforcementFilterOptions.mockRejectedValue(
      new Error("Lookup unavailable"),
    );

    await openCreateModal();

    expect(await screen.findByText("Lookup unavailable")).toBeInTheDocument();
    expect(screen.getByText("Student One")).toBeInTheDocument();
    expect(
      screen.getByText("rewardsModule.redemptions.create.title"),
    ).toBeInTheDocument();
  });

  it("keeps create selections and notes when submit fails", async () => {
    redemptionMocks.createRewardRedemption.mockRejectedValue(
      new Error("Create failed"),
    );
    const user = await openCreateModal();

    await selectCreateModalOptions(user);
    await user.type(
      screen.getByLabelText("rewardsModule.redemptions.create.requestNoteEn"),
      "Keep this note",
    );
    await user.click(
      screen.getByRole("button", {
        name: "rewardsModule.redemptions.create.submit",
      }),
    );

    expect(await screen.findAllByText("Create failed")).not.toHaveLength(0);
    const modal = screen
      .getByText("rewardsModule.redemptions.create.title")
      .closest("[role='dialog']");
    expect(modal).not.toBeNull();
    expect(within(modal as HTMLElement).getByText("Student One")).toBeInTheDocument();
    expect(
      within(modal as HTMLElement).getByText("Gold Badge · 50 XP"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("rewardsModule.redemptions.create.requestNoteEn"),
    ).toHaveValue("Keep this note");
  });
});
