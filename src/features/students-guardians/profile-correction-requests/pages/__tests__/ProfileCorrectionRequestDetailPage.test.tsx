import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileCorrectionRequestDetailPage from "../ProfileCorrectionRequestDetailPage";
import {
  fetchProfileCorrectionRequestById,
  approveProfileCorrectionRequest,
  rejectProfileCorrectionRequest,
} from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock next-intl
const mockT = vi.fn((key: string) => key);
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => mockT,
}));

let mockCapabilities = {
  canViewProfileCorrectionRequests: true,
  canReviewProfileCorrectionRequests: true,
};

// Mock permissions
vi.mock(
  "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities",
  () => ({
    getStudentsGuardiansCapabilities: () => mockCapabilities,
  }),
);

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

// Mock api service
vi.mock(
  "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService",
  () => ({
    fetchProfileCorrectionRequestById: vi.fn(),
    approveProfileCorrectionRequest: vi.fn(),
    rejectProfileCorrectionRequest: vi.fn(),
  }),
);

const mockRequest = {
  id: "req-1",
  studentId: "STU001",
  studentName: "John Doe",
  studentNumber: "ST-100",
  status: "PENDING" as const,
  changeCount: 1,
  requestedAt: "2026-07-14T10:00:00.000Z",
  reason: "My legal name is John.",
  currentSnapshot: { firstName: "Jon" },
  changes: [
    {
      field: "firstName",
      label: "First Name",
      currentValue: "Jon",
      requestedValue: "John",
    },
  ],
};

describe("ProfileCorrectionRequestDetailPage", () => {
  beforeEach(() => {
    mockCapabilities = {
      canViewProfileCorrectionRequests: true,
      canReviewProfileCorrectionRequests: true,
    };
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);
    vi.mocked(fetchProfileCorrectionRequestById).mockResolvedValue(mockRequest);
  });

  it("renders detail page elements with UI primitives", async () => {
    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(fetchProfileCorrectionRequestById).toHaveBeenCalledWith("req-1");
    });

    // Check Back button
    const backButton = screen.getByRole("button", { name: /action_back/i });
    expect(backButton).toBeInTheDocument();

    // It should render ChevronLeft icon
    const backIcon = backButton.querySelector("svg");
    expect(backIcon).toBeInTheDocument();

    // Check student name and changes table
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ST-100")).toBeInTheDocument();
    expect(screen.getByText("My legal name is John.")).toBeInTheDocument();
    expect(screen.getByText("detail_student_number")).toBeInTheDocument();
    expect(screen.getByText("detail_reason")).toBeInTheDocument();
    expect(screen.getByText("detail_submitted_at")).toBeInTheDocument();
    expect(screen.getByText("field_firstName")).toBeInTheDocument();
    expect(screen.getByText("Jon")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();

    // Check Reviewer note uses TextArea
    const textarea = screen.getByRole("textbox", {
      name: /detail_reviewer_note/i,
    });
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");

    // Check Approve and Reject buttons use Button
    const approveButton = screen.getByRole("button", {
      name: /action_approve/i,
    });
    const rejectButton = screen.getByRole("button", { name: /action_reject/i });

    expect(approveButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });

  it("handles approving the profile correction request", async () => {
    vi.mocked(approveProfileCorrectionRequest).mockResolvedValue({
      ...mockRequest,
      status: "APPROVED",
      reviewerNote: "Approved note",
    });

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", {
      name: /detail_reviewer_note/i,
    });
    fireEvent.change(textarea, { target: { value: "Approved note" } });

    const approveButton = screen.getByRole("button", {
      name: /action_approve/i,
    });
    await act(async () => {
      fireEvent.click(approveButton);
    });

    expect(window.confirm).toHaveBeenCalledWith("confirm_approve");
    expect(approveProfileCorrectionRequest).toHaveBeenCalledWith("req-1", {
      reviewerNote: "Approved note",
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("textbox", { name: /detail_reviewer_note/i }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Approved note")).toBeInTheDocument();
  });

  it("handles rejecting the profile correction request", async () => {
    vi.mocked(rejectProfileCorrectionRequest).mockResolvedValue({
      ...mockRequest,
      status: "REJECTED",
      reviewerNote: "Rejected note",
    });

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", {
      name: /detail_reviewer_note/i,
    });
    fireEvent.change(textarea, { target: { value: "Rejected note" } });

    const rejectButton = screen.getByRole("button", { name: /action_reject/i });
    await act(async () => {
      fireEvent.click(rejectButton);
    });

    expect(window.confirm).toHaveBeenCalledWith("confirm_reject");
    expect(rejectProfileCorrectionRequest).toHaveBeenCalledWith("req-1", {
      reviewerNote: "Rejected note",
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("textbox", { name: /detail_reviewer_note/i }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Rejected note")).toBeInTheDocument();
  });

  it("hides review controls when request is not pending", async () => {
    vi.mocked(fetchProfileCorrectionRequestById).mockResolvedValue({
      ...mockRequest,
      status: "APPROVED",
    });

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("textbox", { name: /detail_reviewer_note/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /action_approve/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /action_reject/i }),
    ).not.toBeInTheDocument();
  });

  it("disables reviewer note textarea and action buttons when canReviewProfileCorrectionRequests is false", async () => {
    mockCapabilities.canReviewProfileCorrectionRequests = false;

    await act(async () => {
      render(<ProfileCorrectionRequestDetailPage requestId="req-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", {
      name: /detail_reviewer_note/i,
    });
    expect(textarea).toBeDisabled();

    const approveButton = screen.getByRole("button", {
      name: /action_approve/i,
    });
    const rejectButton = screen.getByRole("button", { name: /action_reject/i });
    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
  });
});
