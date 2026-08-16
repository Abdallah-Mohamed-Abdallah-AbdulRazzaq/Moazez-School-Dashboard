import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReinforcementReviewItem } from "../../types";
import ReinforcementReviewDetailsDrawer from "../ReinforcementReviewDetailsDrawer";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const mockReview: ReinforcementReviewItem = {
  id: "review-1",
  assignmentId: "assign-1",
  taskId: "task-1",
  stageId: "stage-1",
  studentId: "student-1",
  enrollmentId: "enroll-1",
  status: "submitted",
  submittedAt: "2026-06-30T06:00:00.000Z",
  task: {
    titleEn: "Math Assignment",
    titleAr: "الرياضيات",
    source: "dashboard",
    dueDate: "2026-07-05T00:00:00.000Z",
  },
  stage: {
    titleEn: "Drafting",
    titleAr: "مسودة",
    proofType: "text",
    requiresApproval: true,
  },
  student: {
    name: "Ahmed Ali",
    nameAr: "أحمد علي",
    code: "STD123",
  },
  assignment: {},
  proof: {
    proofText: "This is my math assignment draft.",
  },
  reviewHistory: [
    {
      status: "submitted",
      reviewedAt: "2026-06-30T06:00:00.000Z",
      note: "Submitted draft for review.",
    },
  ],
};

describe("ReinforcementReviewDetailsDrawer", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ReinforcementReviewDetailsDrawer
        isOpen={false}
        review={null}
        loading={false}
        error={null}
        canManage={true}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onAction={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders loading state", () => {
    render(
      <ReinforcementReviewDetailsDrawer
        isOpen={true}
        review={null}
        loading={true}
        error={null}
        canManage={true}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onAction={vi.fn()}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog").querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders error state and triggers onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ReinforcementReviewDetailsDrawer
        isOpen={true}
        review={null}
        loading={false}
        error="Failed to fetch review data"
        canManage={true}
        onClose={vi.fn()}
        onRetry={onRetry}
        onAction={vi.fn()}
      />
    );
    expect(screen.getByText("Failed to fetch review data")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: "common.retry" });
    await user.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders review details and triggers action buttons", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onClose = vi.fn();

    render(
      <ReinforcementReviewDetailsDrawer
        isOpen={true}
        review={mockReview}
        loading={false}
        error={null}
        canManage={true}
        onClose={onClose}
        onRetry={vi.fn()}
        onAction={onAction}
      />
    );

    expect(screen.getAllByText("Ahmed Ali")).toHaveLength(2);
    expect(screen.getAllByText("Math Assignment")).toHaveLength(2);
    expect(screen.getByText("Drafting")).toBeInTheDocument();
    expect(screen.getByText("This is my math assignment draft.")).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: "reviews.actions.approve" });
    const rejectBtn = screen.getByRole("button", { name: "reviews.actions.reject" });

    await user.click(approveBtn);
    expect(onAction).toHaveBeenLastCalledWith("approve");

    await user.click(rejectBtn);
    expect(onAction).toHaveBeenLastCalledWith("reject");

    const closeBtn = screen.getByRole("button", { name: "common.close" });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("falls back to student nameEn when student name is not present", () => {
    const reviewWithFallback: ReinforcementReviewItem = {
      ...mockReview,
      student: {
        name: undefined,
        nameEn: "Fallback NameEn",
        code: "STD123",
      },
    };
    render(
      <ReinforcementReviewDetailsDrawer
        isOpen={true}
        review={reviewWithFallback}
        loading={false}
        error={null}
        canManage={true}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onAction={vi.fn()}
      />
    );
    expect(screen.getAllByText("Fallback NameEn")).toHaveLength(2);
  });

  it("handles invalid dates robustly without throwing RangeError", () => {
    const reviewWithInvalidDate: ReinforcementReviewItem = {
      ...mockReview,
      submittedAt: "invalid-date-string",
    };
    expect(() => {
      render(
        <ReinforcementReviewDetailsDrawer
          isOpen={true}
          review={reviewWithInvalidDate}
          loading={false}
          error={null}
          canManage={true}
          onClose={vi.fn()}
          onRetry={vi.fn()}
          onAction={vi.fn()}
        />
      );
    }).not.toThrow();

    expect(screen.getByText("reviews.detail.submittedAt")).toBeInTheDocument();
    expect(screen.getAllByText("—")).not.toHaveLength(0);
  });
});
