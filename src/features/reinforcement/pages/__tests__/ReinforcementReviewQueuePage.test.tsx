import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import ReinforcementReviewQueuePage from "../ReinforcementReviewQueuePage";
import type { ReinforcementReviewItem } from "../../types";

const permissionState = vi.hoisted(() => ({
  permissions: [
    "reinforcement.reviews.view",
    "reinforcement.reviews.manage",
  ] as string[],
}));

const reviewsMocks = vi.hoisted(() => ({
  listReinforcementReviewQueue: vi.fn(),
  approveReinforcementSubmission: vi.fn(),
  rejectReinforcementSubmission: vi.fn(),
  getReinforcementReviewItem: vi.fn(),
}));

const xpMocks = vi.hoisted(() => ({
  grantXpForReinforcementReview: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

const taskMocks = vi.hoisted(() => ({
  listReinforcementTasks: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    isInitializing: false,
  }),
}));

vi.mock(
  "@/features/reinforcement/services/reinforcementReviewsService",
  () => reviewsMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementXpService",
  () => xpMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementTasksService",
  () => taskMocks,
);

function renderPage() {
  return render(
    <ToastProvider>
      <ReinforcementReviewQueuePage />
    </ToastProvider>,
  );
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  labelName: string,
  optionText: string,
) {
  const trigger = await screen.findByLabelText(labelName);
  await user.click(trigger);
  const option = await screen.findByRole("button", { name: optionText });
  await user.click(option);
}

describe("ReinforcementReviewQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    reviewsMocks.listReinforcementReviewQueue.mockResolvedValue({
      items: [
        {
          id: "submission-1",
          studentId: "student-123",
          status: "submitted",
          submittedAt: "2026-06-30T00:00:00Z",
          task: { titleEn: "Read Book" },
          stage: { titleEn: "Page 10" },
          student: { nameEn: "John Doe" },
        },
      ],
      total: 1,
    });

    reviewsMocks.getReinforcementReviewItem.mockResolvedValue({
      id: "submission-1",
      studentId: "student-123",
      status: "submitted",
      submittedAt: "2026-06-30T00:00:00Z",
      task: { titleEn: "Read Book" },
      stage: { titleEn: "Page 10" },
      student: { nameEn: "John Doe" },
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      academicYears: [{ id: "year-1", nameEn: "Year 1", nameAr: "Year 1" }],
      terms: [{ id: "term-1", nameEn: "Term 1", nameAr: "Term 1" }],
      students: [{ studentId: "student-123", nameEn: "Student 123", nameAr: "Student 123" }],
    });
    taskMocks.listReinforcementTasks.mockResolvedValue({ items: [], total: 0 });
  });

  it("calls listReinforcementReviewQueue and getReinforcementFilterOptions on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenCalled();
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled();
    });

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("refetches queue with parameters when filter changes", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-123",
        }),
      );
    });
  });

  it("clears all filters when Clear Filters is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          studentId: "student-123",
        }),
      );
    });

    const clearBtn = await screen.findByText("rewardsModule.overview.clearFilters");
    await user.click(clearBtn);

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: undefined,
        }),
      );
    });
  });

  it("displays validation error and blocks queue list API call when dates are invalid", async () => {
    renderPage();

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenCalled();
    });

    const dateFromInput = screen.getByLabelText("rewardsModule.overview.dateFrom");
    const dateToInput = screen.getByLabelText("rewardsModule.overview.dateTo");

    reviewsMocks.listReinforcementReviewQueue.mockClear();

    // Set invalid date range: from > to
    fireEvent.change(dateFromInput, { target: { value: "2026-07-02" } });
    fireEvent.change(dateToInput, { target: { value: "2026-07-01" } });

    // Should display validation error
    expect(await screen.findByText("rewardsModule.overview.errors.invalidDates")).toBeInTheDocument();

    // Verify the list API call was blocked for this invalid combination
    expect(reviewsMocks.listReinforcementReviewQueue).not.toHaveBeenLastCalledWith(
      expect.objectContaining({
        submittedFrom: "2026-07-02",
        submittedTo: "2026-07-01",
      }),
    );

    // Change to valid date range
    fireEvent.change(dateToInput, { target: { value: "2026-07-03" } });

    // The validation error should disappear
    await waitFor(() => {
      expect(screen.queryByText("rewardsModule.overview.errors.invalidDates")).not.toBeInTheDocument();
    });

    // The API call should have been made with the valid dates
    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          submittedFrom: "2026-07-02",
          submittedTo: "2026-07-03",
        }),
      );
    });
  });

  it("opens details drawer on row click and allows approval with note and XP grant", async () => {
    const user = userEvent.setup();
    renderPage();

    // Click on the row
    const row = await screen.findByText("John Doe");
    await user.click(row);

    // Verify it fetches details
    expect(reviewsMocks.getReinforcementReviewItem).toHaveBeenCalledWith("submission-1");

    // Drawer should show up and display details
    expect(await screen.findByRole("dialog", { name: "reviews.detail.title" })).toBeInTheDocument();

    // Click Approve button in drawer footer
    const drawer = screen.getByRole("dialog", { name: "reviews.detail.title" });
    const approveBtn = drawer.querySelector("footer button") as HTMLButtonElement;
    await user.click(approveBtn);

    // Modal opens. Submit modal
    const approveModal = await screen.findByRole("dialog", { name: "reviews.detail.approveTitle" });
    const submitApproveBtn = approveModal.querySelector("button.from-primary") as HTMLButtonElement;
    reviewsMocks.approveReinforcementSubmission.mockResolvedValue({
      id: "submission-1",
      status: "approved",
      task: { titleEn: "Read Book" },
      stage: { titleEn: "Page 10" },
      student: { nameEn: "John Doe" },
    });
    await user.click(submitApproveBtn);

    expect(reviewsMocks.approveReinforcementSubmission).toHaveBeenCalledWith("submission-1", {
      note: undefined,
      noteAr: undefined,
    });

    // XP modal should open
    expect(await screen.findByText("reviews.detail.grantXp")).toBeInTheDocument();

    // Fill XP amount and submit
    const xpInput = screen.getByLabelText("xp.amount");
    fireEvent.change(xpInput, { target: { value: "15" } });

    const grantBtn = screen.getByRole("button", { name: "actions.grantXp" });
    await user.click(grantBtn);

    expect(xpMocks.grantXpForReinforcementReview).toHaveBeenCalledWith("submission-1", {
      amount: 15,
    });
  });

  it("opens the details drawer when clicking a row or the View Details button", async () => {
    const user = userEvent.setup();
    renderPage();

    // 1. Click on the row to open the drawer
    const row = await screen.findByText("John Doe");
    await user.click(row);

    expect(reviewsMocks.getReinforcementReviewItem).toHaveBeenLastCalledWith("submission-1");
    expect(await screen.findByRole("dialog", { name: "reviews.detail.title" })).toBeInTheDocument();

    // Close the drawer
    const closeBtn = screen.getByRole("button", { name: "common.close" });
    await user.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "reviews.detail.title" })).not.toBeInTheDocument();
    });

    // 2. Click the View Details button to open the drawer
    const viewDetailBtn = await screen.findByRole("button", { name: "reviews.actions.viewDetail" });
    await user.click(viewDetailBtn);

    expect(reviewsMocks.getReinforcementReviewItem).toHaveBeenLastCalledWith("submission-1");
    expect(await screen.findByRole("dialog", { name: "reviews.detail.title" })).toBeInTheDocument();
  });

  it("renders task details and review history in the drawer", async () => {
    const detailedReview = {
      id: "submission-1",
      studentId: "student-123",
      status: "submitted" as const,
      submittedAt: "2026-06-30T00:00:00Z",
      task: { titleEn: "Read Book", source: "System", dueDate: "2026-07-15T00:00:00Z" },
      stage: { titleEn: "Page 10", proofType: "text", requiresApproval: true },
      student: { name: "John Doe", nameEn: "John Doe", code: "STUD-456" },
      proof: { proofText: "Completed reading challenge." },
      reviewHistory: [
        {
          status: "rejected",
          reviewedAt: "2026-06-29T12:00:00Z",
          note: "Incorrect page numbers provided",
          reviewerName: "Reviewer Alice",
        },
      ],
    };

    reviewsMocks.getReinforcementReviewItem.mockResolvedValueOnce(detailedReview);

    const user = userEvent.setup();
    renderPage();

    const row = await screen.findByText("John Doe");
    await user.click(row);

    // Verify task details are rendered in the drawer specifically
    const drawer = await screen.findByRole("dialog", { name: "reviews.detail.title" });
    const drawerQueries = within(drawer);

    expect(drawerQueries.getAllByText("Read Book").length).toBe(2);
    expect(drawerQueries.getByText("System")).toBeInTheDocument();
    expect(drawerQueries.getByText("Page 10")).toBeInTheDocument();
    expect(drawerQueries.getByText("STUD-456")).toBeInTheDocument();
    expect(drawerQueries.getByText("Completed reading challenge.")).toBeInTheDocument();

    // Verify student name is rendered inside the drawer
    expect(drawerQueries.getAllByText("John Doe").length).toBe(2); // header and details section

    // Verify history section details
    expect(drawerQueries.getByText("reviews.status.rejected")).toBeInTheDocument();
    expect(drawerQueries.getByText("Incorrect page numbers provided")).toBeInTheDocument();
    expect(drawerQueries.getByText("Reviewer Alice")).toBeInTheDocument();
  });

  it("triggers approval action modal and subsequent XP grant modal when clicking Approve", async () => {
    const user = userEvent.setup();
    renderPage();

    // Open details drawer
    const row = await screen.findByText("John Doe");
    await user.click(row);

    // Find and click Approve inside drawer footer
    const drawer = await screen.findByRole("dialog", { name: "reviews.detail.title" });
    const approveBtn = drawer.querySelector("footer button") as HTMLButtonElement;
    await user.click(approveBtn);

    // Approve Action Modal opens
    const approveModal = await screen.findByRole("dialog", { name: "reviews.detail.approveTitle" });
    const submitApproveBtn = approveModal.querySelector("button.from-primary") as HTMLButtonElement;

    reviewsMocks.approveReinforcementSubmission.mockResolvedValue({
      id: "submission-1",
      status: "approved",
      task: { titleEn: "Read Book" },
      stage: { titleEn: "Page 10" },
      student: { nameEn: "John Doe" },
    });

    await user.click(submitApproveBtn);

    expect(reviewsMocks.approveReinforcementSubmission).toHaveBeenCalledWith("submission-1", {
      note: undefined,
      noteAr: undefined,
    });

    // XP grant modal should open
    expect(await screen.findByText("reviews.detail.grantXp")).toBeInTheDocument();
  });

  it("clears stale state when drawer is closed and when a new details fetch starts", async () => {
    const user = userEvent.setup();
    
    reviewsMocks.getReinforcementReviewItem.mockResolvedValueOnce({
      id: "submission-1",
      studentId: "student-123",
      status: "submitted",
      submittedAt: "2026-06-30T00:00:00Z",
      task: { titleEn: "Read Book" },
      stage: { titleEn: "Page 10" },
      student: { nameEn: "First Student" },
    });
    
    renderPage();

    const row = await screen.findByText("John Doe");
    await user.click(row);

    const drawer = await screen.findByRole("dialog", { name: "reviews.detail.title" });
    const drawerQueries = within(drawer);
    await waitFor(() => {
      expect(drawerQueries.getAllByText("First Student").length).toBe(2);
    });

    const closeBtn = screen.getByRole("button", { name: "common.close" });
    await user.click(closeBtn);
    
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "reviews.detail.title" })).not.toBeInTheDocument();
    });

    let resolveSecondFetch!: (review: ReinforcementReviewItem) => void;
    const secondFetchPromise = new Promise<ReinforcementReviewItem>((resolve) => {
      resolveSecondFetch = resolve;
    });
    reviewsMocks.getReinforcementReviewItem.mockReturnValueOnce(secondFetchPromise);

    await user.click(row);

    const newDrawer = await screen.findByRole("dialog", { name: "reviews.detail.title" });
    const newDrawerQueries = within(newDrawer);
    
    expect(newDrawerQueries.queryByText("First Student")).not.toBeInTheDocument();

    resolveSecondFetch({
      id: "submission-1",
      studentId: "student-123",
      status: "submitted",
      submittedAt: "2026-06-30T00:00:00Z",
      task: { titleEn: "Read Book" },
      stage: { titleEn: "Page 10" },
      student: { nameEn: "Second Student" },
    });

    await waitFor(() => {
      expect(newDrawerQueries.getAllByText("Second Student").length).toBe(2);
    });
  });

  it("closes details drawer when pressing the Escape key", async () => {
    const user = userEvent.setup();
    
    reviewsMocks.getReinforcementReviewItem.mockResolvedValueOnce({
      id: "submission-1",
      studentId: "student-123",
      status: "submitted",
      submittedAt: "2026-06-30T00:00:00Z",
      task: { titleEn: "Read Book" },
      stage: { titleEn: "Page 10" },
      student: { nameEn: "First Student" },
    });
    
    renderPage();

    const row = await screen.findByText("John Doe");
    await user.click(row);

    const drawer = await screen.findByRole("dialog", { name: "reviews.detail.title" });
    expect(drawer).toBeInTheDocument();

    // Press Escape key
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "reviews.detail.title" })).not.toBeInTheDocument();
    });
  });

  it("handles missing or invalid submittedAt values in the queue table safely", async () => {
    reviewsMocks.listReinforcementReviewQueue.mockResolvedValue({
      items: [
        {
          id: "submission-invalid-date",
          studentId: "student-123",
          status: "submitted",
          submittedAt: "invalid-date-string",
          task: { titleEn: "Read Book" },
          stage: { titleEn: "Page 10" },
          student: { nameEn: "Invalid Date Student" },
        },
        {
          id: "submission-missing-date",
          studentId: "student-123",
          status: "submitted",
          submittedAt: "",
          task: { titleEn: "Read Book" },
          stage: { titleEn: "Page 10" },
          student: { nameEn: "Missing Date Student" },
        },
      ],
      total: 2,
    });

    renderPage();

    const invalidRow = await screen.findByText("Invalid Date Student");
    expect(invalidRow).toBeInTheDocument();

    const missingRow = await screen.findByText("Missing Date Student");
    expect(missingRow).toBeInTheDocument();

    // The date cells should render "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
