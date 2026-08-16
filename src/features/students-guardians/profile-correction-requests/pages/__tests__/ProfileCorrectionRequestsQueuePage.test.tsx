import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileCorrectionRequestsQueuePage from "../ProfileCorrectionRequestsQueuePage";
import { fetchProfileCorrectionRequests } from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/students-guardians/profile-correction-requests",
}));

// Mock next-intl
const mockT = vi.fn((key: string, values?: { count?: number }) =>
  key === "subtitle" ? `subtitle:${values?.count}` : key,
);
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => mockT,
}));

// Mock permissions
vi.mock(
  "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities",
  () => ({
    getStudentsGuardiansCapabilities: () => ({
      canViewProfileCorrectionRequests: true,
    }),
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
    fetchProfileCorrectionRequests: vi.fn(),
  }),
);

const mockRequests = [
  {
    id: "req-1",
    studentId: "STU001",
    studentName: "John Doe",
    studentNumber: "ST-100",
    status: "PENDING" as const,
    changeCount: 3,
    requestedAt: "2026-07-02",
  },
  {
    id: "req-2",
    studentId: "STU002",
    studentName: "",
    status: "APPROVED" as const,
    changeCount: 1,
    requestedAt: "2026-07-01",
  },
];

describe("ProfileCorrectionRequestsQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchProfileCorrectionRequests).mockResolvedValue(mockRequests);
  });

  it("renders the table headers and request rows using DataTable components", async () => {
    await act(async () => {
      render(<ProfileCorrectionRequestsQueuePage />);
    });

    await waitFor(() => {
      expect(fetchProfileCorrectionRequests).toHaveBeenCalled();
    });

    // Check filters are rendered
    expect(screen.getByLabelText("status")).toBeInTheDocument();
    expect(screen.getByLabelText("student_id")).toBeInTheDocument();

    // Check table density (exclusive to DataTable primitive) is rendered
    expect(screen.getByText("table_density")).toBeInTheDocument();

    // Check data is rendered in the table
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ST-100")).toBeInTheDocument();
    expect(screen.getAllByText("STU002")).toHaveLength(2); // name is empty, fallback to ID, plus the ID display itself
    expect(screen.getAllByText("status_pending").length).toBeGreaterThan(0);
    expect(screen.getByText("status_approved")).toBeInTheDocument();
  });

  it("triggers router push when clicking Open button in table row", async () => {
    await act(async () => {
      render(<ProfileCorrectionRequestsQueuePage />);
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const openButtons = screen.getAllByRole("button", { name: "action_open" });
    fireEvent.click(openButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      "/en/students-guardians/profile-correction-requests/req-1",
    );
  });

  it("shows the total pending count from the unfiltered queue", async () => {
    const allRequests = [
      ...mockRequests,
      {
        id: "req-3",
        studentId: "STU003",
        studentName: "Jane Doe",
        status: "PENDING" as const,
        changeCount: 2,
        requestedAt: "2026-07-03",
      },
    ];
    vi.mocked(fetchProfileCorrectionRequests).mockImplementation((params) =>
      Promise.resolve(params?.status === "all" ? allRequests : [mockRequests[0]]),
    );

    await act(async () => {
      render(<ProfileCorrectionRequestsQueuePage />);
    });

    expect(await screen.findByText("subtitle:2")).toBeInTheDocument();
  });
});
