import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import NedaaOperationsPage from "../NedaaOperationsPage";

const serviceMocks = vi.hoisted(() => ({
  confirmDismissalStudentArrival: vi.fn(),
  deliverDismissalRequest: vi.fn(),
  escalateDismissalRequest: vi.fn(),
  fetchDismissalRequest: vi.fn(),
  fetchDismissalRequestHistoryItem: vi.fn(),
  listActiveDismissalRequests: vi.fn(),
  listDismissalGates: vi.fn(),
  listDismissalPickupRecipients: vi.fn(),
  listDismissalRequestHistory: vi.fn(),
  listDismissalWaitingStudents: vi.fn(),
  updateDismissalRequestStatus: vi.fn(),
  fetchAllStudents: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => toastMocks,
}));

vi.mock("@/components/ui/kpi-card/KPICardV2", () => ({
  default: ({ title, value }: { title: string; value: number | string }) => (
    <div data-testid="kpi-card-v2">
      {title}: {value}
    </div>
  ),
}));

vi.mock("@/features/nedaa/hooks/useNedaaAcademicStructure", () => ({
  useNedaaAcademicStructure: () => ({
    tree: {
      stages: [
        {
          id: "stage-1",
          name: "Primary",
          nameEn: "Primary",
          nameAr: "Primary AR",
          order: 1,
        },
      ],
      grades: [
        {
          id: "grade-1",
          stageId: "stage-1",
          name: "Grade 2",
          nameEn: "Grade 2",
          nameAr: "Grade 2 AR",
          order: 1,
        },
      ],
      sections: [
        {
          id: "section-1",
          gradeId: "grade-1",
          name: "Section A",
          nameEn: "Section A",
          nameAr: "Section A AR",
          order: 1,
        },
      ],
      classrooms: [
        {
          id: "classroom-1",
          sectionId: "section-1",
          name: "Classroom 2A",
          nameEn: "Classroom 2A",
          nameAr: "Classroom 2A AR",
          order: 1,
        },
      ],
    },
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock("@/features/nedaa/services/dismissalApiService", () => ({
  confirmDismissalStudentArrival:
    serviceMocks.confirmDismissalStudentArrival,
  deliverDismissalRequest: serviceMocks.deliverDismissalRequest,
  escalateDismissalRequest: serviceMocks.escalateDismissalRequest,
  fetchDismissalRequest: serviceMocks.fetchDismissalRequest,
  fetchDismissalRequestHistoryItem:
    serviceMocks.fetchDismissalRequestHistoryItem,
  listActiveDismissalRequests: serviceMocks.listActiveDismissalRequests,
  listDismissalGates: serviceMocks.listDismissalGates,
  listDismissalPickupRecipients: serviceMocks.listDismissalPickupRecipients,
  listDismissalRequestHistory: serviceMocks.listDismissalRequestHistory,
  listDismissalWaitingStudents: serviceMocks.listDismissalWaitingStudents,
  updateDismissalRequestStatus: serviceMocks.updateDismissalRequestStatus,
}));

vi.mock(
  "@/features/students-guardians/students/services/studentsService",
  () => ({ fetchAllStudents: serviceMocks.fetchAllStudents }),
);

const activeRequest = {
  id: "request-1",
  status: "ready",
  requestedAt: "2026-07-07T12:00:00.000Z",
  waitMinutes: 14,
  signals: {
    delayed: false,
    urgent: true,
    delayThresholdMinutes: 10,
    urgentThresholdMinutes: 20,
  },
  child: {
    id: "student-1",
    displayName: "Omar Ali",
    grade: "Grade 2",
    section: "A",
    classroom: "2A",
  },
  gate: {
    id: "gate-1",
    code: "MAIN",
    name: "Main Gate",
    status: "open",
  },
  requester: { displayName: "Mona Ali" },
};

const waitingStudent = {
  id: "request-2",
  status: "moving",
  arrivalState: "in_transit",
  requestedAt: activeRequest.requestedAt,
  updatedAt: "2026-07-07T12:05:00.000Z",
  waitMinutes: activeRequest.waitMinutes,
  signals: activeRequest.signals,
  child: { ...activeRequest.child, displayName: "Salma Hassan" },
  gate: activeRequest.gate,
};

const historyItem = {
  id: "request-3",
  status: "handed_over",
  isActive: false,
  isTerminal: true,
  requestedAt: "2026-07-07T11:00:00.000Z",
  updatedAt: "2026-07-07T11:20:00.000Z",
  calledAt: "2026-07-07T11:05:00.000Z",
  readyAt: "2026-07-07T11:15:00.000Z",
  handedOverAt: "2026-07-07T11:20:00.000Z",
  cancelledAt: null,
  expiredAt: null,
  wait: {
    minutes: 20,
    delayed: true,
    urgent: false,
    thresholdMinutes: 10,
    urgentThresholdMinutes: 30,
  },
  escalation: {
    escalated: true,
    escalatedAt: "2026-07-07T11:10:00.000Z",
    reason: "parent_waiting",
    note: "Parent waiting",
  },
  child: { ...activeRequest.child, displayName: "Laila Mostafa" },
  gate: {
    id: "gate-1",
    code: "MAIN",
    name: "Main Gate",
  },
};

function setupServiceMocks() {
  serviceMocks.fetchAllStudents.mockResolvedValue([
    {
      id: "student-1",
      full_name_en: "Omar Ali",
      full_name_ar: "Omar Ali AR",
      student_id: "STU-001",
      contact: { student_email: "omar.ali@example.com" },
    },
  ]);
  serviceMocks.listDismissalGates.mockResolvedValue({
    data: [activeRequest.gate],
    summary: { totalCount: 1 },
  });
  serviceMocks.listActiveDismissalRequests.mockResolvedValue({
    data: [activeRequest],
    summary: {
      totalCount: 1,
      requestedCount: 0,
      queuedCount: 0,
      calledCount: 0,
      movingCount: 0,
      atGateCount: 0,
      readyCount: 1,
      delayedCount: 0,
      urgentCount: 1,
    },
    pagination: { page: 1, limit: 10, totalPages: 1 },
  });
  serviceMocks.listDismissalWaitingStudents.mockResolvedValue({
    data: [waitingStudent],
    summary: {
      totalCount: 1,
      calledCount: 0,
      movingCount: 1,
      atGateCount: 0,
      readyCount: 0,
      arrivedCount: 0,
      notArrivedCount: 1,
      delayedCount: 0,
      urgentCount: 0,
    },
    pagination: { page: 1, limit: 10, totalPages: 1 },
  });
  serviceMocks.listDismissalRequestHistory.mockResolvedValue({
    data: [historyItem],
    summary: {
      totalCount: 1,
      activeCount: 0,
      terminalCount: 1,
      delayedCount: 1,
      urgentCount: 0,
      escalatedCount: 1,
    },
    pagination: { page: 1, limit: 10, totalPages: 1 },
  });
  serviceMocks.listDismissalPickupRecipients.mockResolvedValue({
    request: {
      id: activeRequest.id,
      status: "ready",
      child: activeRequest.child,
      gate: activeRequest.gate,
    },
    policy: { delegatePickupAllowed: true, pickupCodeRequired: true },
    recipients: [
      {
        pickupRecipientToken: "recipient-token-1",
        displayName: "Mona Ali",
        relation: "Mother",
        isRequestingGuardian: true,
        canPickup: true,
        maskedPhone: null,
      },
    ],
  });
  serviceMocks.updateDismissalRequestStatus.mockResolvedValue({
    request: { ...activeRequest, status: "called" },
  });
  serviceMocks.confirmDismissalStudentArrival.mockResolvedValue({
    student: {
      ...waitingStudent,
      status: "at_gate",
      arrivalState: "arrived",
      previousStatus: "moving",
      changed: true,
      timeline: [],
    },
  });
}

describe("NedaaOperationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupServiceMocks();
  });

  it("loads active dismissal requests and updates request status", async () => {
    const user = userEvent.setup();
    serviceMocks.listActiveDismissalRequests.mockResolvedValue({
      data: [{ ...activeRequest, status: "requested" }],
      summary: {
        totalCount: 1,
        requestedCount: 1,
        queuedCount: 0,
        calledCount: 0,
        movingCount: 0,
        atGateCount: 0,
        readyCount: 0,
        delayedCount: 0,
        urgentCount: 1,
      },
      pagination: { page: 1, limit: 10, totalPages: 1 },
    });
    render(<NedaaOperationsPage />);

    expect(await screen.findByText("Omar Ali")).toBeInTheDocument();
    expect(serviceMocks.listActiveDismissalRequests).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );

    const row = screen.getByText("Omar Ali").closest("tr");
    expect(row).not.toBeNull();
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.advance_status",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "operations_status.queued",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "operations_actions.save_status" }),
    );

    await waitFor(() =>
      expect(serviceMocks.updateDismissalRequestStatus).toHaveBeenCalledWith(
        "request-1",
        { status: "queued", note: null },
      ),
    );
  });

  it("delivers and escalates active requests from row actions", async () => {
    const user = userEvent.setup();
    serviceMocks.deliverDismissalRequest.mockResolvedValue({
      delivery: { id: "request-1", status: "handed_over" },
    });
    serviceMocks.escalateDismissalRequest.mockResolvedValue({
      escalation: {
        requestId: "request-1",
        changed: true,
        escalated: true,
        reason: "parent_waiting",
      },
      request: { id: "request-1", status: "ready" },
    });
    render(<NedaaOperationsPage />);

    const row = (await screen.findByText("Omar Ali")).closest("tr");
    expect(row).not.toBeNull();

    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.deliver",
      }),
    );
    await user.type(
      screen.getByLabelText("operations_fields.pickup_code"),
      "1234",
    );
    await user.click(
      screen.getByRole("button", { name: "operations_actions.save_delivery" }),
    );
    expect(serviceMocks.deliverDismissalRequest).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", {
        name: "operations_actions.confirm_delivery",
      }),
    );

    await waitFor(() =>
      expect(serviceMocks.deliverDismissalRequest).toHaveBeenCalledWith(
        "request-1",
        {
          pickupCode: "1234",
          pickupRecipientToken: "recipient-token-1",
          note: null,
        },
      ),
    );

    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.escalate",
      }),
    );
    expect(
      screen.getByText("operations_guidance.escalation_continues"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "operations_reasons.parent_waiting" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "operations_actions.save_escalation",
      }),
    );

    await waitFor(() =>
      expect(serviceMocks.escalateDismissalRequest).toHaveBeenCalledWith(
        "request-1",
        { reason: "parent_waiting", note: null },
      ),
    );
    expect(toastMocks.showSuccess).toHaveBeenCalledWith(
      "messages.escalation_saved",
    );
  });

  it("shows an error when an escalation is already recorded", async () => {
    const user = userEvent.setup();
    serviceMocks.escalateDismissalRequest.mockResolvedValue({
      escalation: {
        requestId: "request-1",
        changed: false,
        escalated: true,
        reason: "parent_waiting",
      },
      request: { id: "request-1", status: "ready" },
    });
    render(<NedaaOperationsPage />);

    const row = (await screen.findByText("Omar Ali")).closest("tr");
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.escalate",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "operations_actions.save_escalation" }),
    );

    await waitFor(() =>
      expect(toastMocks.showError).toHaveBeenCalledWith(
        "messages.escalation_already_recorded",
      ),
    );
    expect(toastMocks.showSuccess).not.toHaveBeenCalledWith(
      "messages.escalation_saved",
    );
  });

  it("recovers from a stale delivery confirmation with actionable guidance", async () => {
    const user = userEvent.setup();
    serviceMocks.deliverDismissalRequest.mockRejectedValue(
      new ApiError(
        "Dismissal request is not ready for delivery.",
        409,
        "dismissal.delivery.not_ready",
      ),
    );
    render(<NedaaOperationsPage />);

    const row = (await screen.findByText("Omar Ali")).closest("tr");
    expect(row).not.toBeNull();
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.deliver",
      }),
    );
    await user.type(
      screen.getByLabelText("operations_fields.pickup_code"),
      "1234",
    );
    await user.click(
      screen.getByRole("button", { name: "operations_actions.save_delivery" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "operations_actions.confirm_delivery",
      }),
    );

    await waitFor(() =>
      expect(toastMocks.showError).toHaveBeenCalledWith(
        "messages.delivery_not_ready",
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("renders fetched request details in the detail modal", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchDismissalRequest.mockResolvedValue({
      request: {
        ...activeRequest,
        timeline: [
          {
            type: "request_status_changed",
            statusFrom: "called",
            statusTo: "ready",
            createdAt: "2026-07-07T12:10:00.000Z",
            note: "Ready at gate",
          },
        ],
      },
    });
    render(<NedaaOperationsPage />);

    const row = (await screen.findByText("Omar Ali")).closest("tr");
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.view",
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ready at gate")).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_history.wait_duration"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_history.requester"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_timeline.status_changed"),
    ).toBeInTheDocument();
  });

  it("renders fetched pickup recipients in the recipients modal", async () => {
    const user = userEvent.setup();
    serviceMocks.listDismissalPickupRecipients.mockResolvedValue({
      request: {
        id: activeRequest.id,
        status: "ready",
        child: activeRequest.child,
        gate: activeRequest.gate,
      },
      policy: { delegatePickupAllowed: true, pickupCodeRequired: true },
      recipients: [
        {
          pickupRecipientToken: "recipient-token",
          displayName: "Hassan Ali",
          relation: "Father",
          isRequestingGuardian: true,
          canPickup: true,
          maskedPhone: "+966 *** 1234",
        },
      ],
    });
    render(<NedaaOperationsPage />);

    const row = (await screen.findByText("Omar Ali")).closest("tr");
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.recipients",
      }),
    );
    expect(await screen.findByText(/Hassan Ali/)).toBeInTheDocument();
  });

  it("explains that pickup recipients are available only when ready", async () => {
    const user = userEvent.setup();
    serviceMocks.listActiveDismissalRequests.mockResolvedValue({
      data: [{ ...activeRequest, status: "at_gate" }],
      summary: {
        totalCount: 1,
        requestedCount: 0,
        queuedCount: 0,
        calledCount: 0,
        movingCount: 0,
        atGateCount: 1,
        readyCount: 0,
        delayedCount: 0,
        urgentCount: 1,
      },
      pagination: { page: 1, limit: 10, totalPages: 1 },
    });
    render(<NedaaOperationsPage />);

    const row = (await screen.findByText("Omar Ali")).closest("tr");
    expect(row).not.toBeNull();
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.recipients",
      }),
    );

    expect(toastMocks.showError).toHaveBeenCalledWith(
      "messages.recipients_available_when_ready",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders fetched history details in the history modal", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchDismissalRequestHistoryItem.mockResolvedValue({
      request: {
        ...historyItem,
        wait: { ...historyItem.wait, urgent: true },
        timeline: [
          {
            type: "request_created",
            statusFrom: null,
            statusTo: "requested",
            createdAt: "2026-07-07T11:00:00.000Z",
            note: null,
          },
          {
            type: "request_status_changed",
            statusFrom: "ready",
            statusTo: "handed_over",
            createdAt: "2026-07-07T11:20:00.000Z",
            note: "History loaded",
          },
        ],
      },
    });
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.history" }),
    );
    const row = (await screen.findByText("Laila Mostafa")).closest("tr");
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.view_history",
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("operations_timeline.status_changed_from_to"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("operations_history.wait_duration")).toBeInTheDocument();
    expect(within(dialog).getByText("operations_history.lifecycle")).toBeInTheDocument();
    expect(within(dialog).getByText("operations_history.called_at")).toBeInTheDocument();
    expect(within(dialog).getByText("operations_history.ready_at")).toBeInTheDocument();
    expect(within(dialog).getByText("operations_history.handed_over_at")).toBeInTheDocument();
    expect(
      within(dialog).getAllByText("operations_signals.urgent"),
    ).toHaveLength(2);
    expect(within(dialog).getByText("operations_timeline.request_created")).toBeInTheDocument();
    expect(within(dialog).getByText("operations_timeline.status_changed")).toBeInTheDocument();
    expect(within(dialog).getByText("History loaded")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "close" })).toBeInTheDocument();
  });

  it("shows an empty timeline state when history has no events", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchDismissalRequestHistoryItem.mockResolvedValue({
      request: { ...historyItem, timeline: [] },
    });
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.history" }),
    );
    const row = (await screen.findByText("Laila Mostafa")).closest("tr");
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.view_history",
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("operations_timeline.no_events"),
    ).toBeInTheDocument();
  });

  it("presents escalation details without treating them as a status transition", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchDismissalRequestHistoryItem.mockResolvedValue({
      request: {
        ...historyItem,
        status: "requested",
        isActive: true,
        isTerminal: false,
        escalation: {
          escalated: true,
          escalatedAt: "2026-07-07T11:10:00.000Z",
          reason: "manual_follow_up",
          note: "Follow up with gate staff",
        },
        timeline: [
          {
            type: "request_created",
            statusFrom: null,
            statusTo: "requested",
            createdAt: "2026-07-07T11:00:00.000Z",
            note: null,
          },
          {
            type: "request_escalated",
            statusFrom: "requested",
            statusTo: "requested",
            createdAt: "2026-07-07T11:10:00.000Z",
            note: "Follow up with gate staff",
          },
        ],
      },
    });
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.history" }),
    );
    const row = (await screen.findByText("Laila Mostafa")).closest("tr");
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.view_history",
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("operations_history.escalation_reason"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_reasons.manual_follow_up"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_timeline.request_escalated"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_timeline.escalation_recorded"),
    ).toBeInTheDocument();
    expect(within(dialog).getAllByText("Follow up with gate staff")).toHaveLength(2);
    expect(
      within(dialog).queryByText("operations_timeline.status_changed_from_to"),
    ).not.toBeInTheDocument();
  });

  it("loads waiting students and confirms arrival", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "operations_tabs.waiting",
      }),
    );

    expect(await screen.findByText("Salma Hassan")).toBeInTheDocument();
    expect(serviceMocks.listDismissalWaitingStudents).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );

    const row = screen.getByText("Salma Hassan").closest("tr");
    expect(row).not.toBeNull();
    await user.click(
      within(row as HTMLTableRowElement).getByRole("button", {
        name: "operations_actions.confirm_arrival",
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("operations_history.wait_duration"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_history.arrival_state"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("operations_history.updated_at"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "operations_actions.save_arrival",
      }),
    );

    await waitFor(() =>
      expect(serviceMocks.confirmDismissalStudentArrival).toHaveBeenCalledWith(
        "request-2",
        { note: null },
      ),
    );
  });

  it("loads request history in a read-only history tab", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "operations_tabs.history",
      }),
    );

    expect(await screen.findByText("Laila Mostafa")).toBeInTheDocument();
    expect(serviceMocks.listDismissalRequestHistory).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
    expect(
      screen.queryByRole("button", {
        name: "operations_actions.advance_status",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps filters independent for each operations tab", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    const activeSearch = await screen.findByPlaceholderText(
      "operations_filters.search_placeholder",
    );
    await user.type(activeSearch, "Omar");

    await waitFor(() =>
      expect(serviceMocks.listActiveDismissalRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "Omar" }),
      ),
    );

    await user.click(
      screen.getByRole("button", { name: "operations_tabs.waiting" }),
    );

    await waitFor(() =>
      expect(serviceMocks.listDismissalWaitingStudents).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ q: expect.anything() }),
      ),
    );
    expect(
      screen.getByPlaceholderText("operations_filters.search_placeholder"),
    ).toHaveValue("");

    await user.click(
      screen.getByRole("button", { name: "operations_tabs.active" }),
    );

    expect(
      screen.getByPlaceholderText("operations_filters.search_placeholder"),
    ).toHaveValue("Omar");
    expect(screen.getAllByTestId("kpi-card-v2").length).toBeGreaterThan(0);
  });

  it("sends documented active filters and only one academic id", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    await screen.findByText("Omar Ali");
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );

    await user.click(screen.getByRole("button", { name: "table.gate" }));
    await user.click(screen.getByRole("button", { name: "Main Gate (MAIN)" }));
    await user.click(screen.getByRole("button", { name: "table.status" }));
    await user.click(
      screen.getByRole("button", { name: "operations_status.ready" }),
    );
    await user.click(
      screen.getByRole("button", { name: "operations_filters.stage" }),
    );
    await user.click(screen.getByRole("button", { name: "Primary" }));
    await user.click(
      screen.getByRole("button", { name: "operations_filters.grade" }),
    );
    await user.click(screen.getByRole("button", { name: "Grade 2" }));
    await user.click(
      screen.getByRole("button", { name: "operations_filters.sort" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "operations_filters.requested_at_desc",
      }),
    );

    await waitFor(() =>
      expect(serviceMocks.listActiveDismissalRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gateId: "gate-1",
          status: "ready",
          gradeId: "grade-1",
          sort: "requested_at_desc",
          page: 1,
          limit: 10,
        }),
      ),
    );
    expect(
      serviceMocks.listActiveDismissalRequests.mock.lastCall?.[0],
    ).not.toHaveProperty("stageId");
  });

  it("uses table page and page size for active requests", async () => {
    const user = userEvent.setup();
    serviceMocks.listActiveDismissalRequests.mockResolvedValue({
      data: [activeRequest],
      summary: {
        totalCount: 25,
        requestedCount: 0,
        queuedCount: 0,
        calledCount: 0,
        movingCount: 0,
        atGateCount: 0,
        readyCount: 1,
        delayedCount: 0,
        urgentCount: 1,
      },
      pagination: { page: 1, limit: 10, totalPages: 3 },
    });
    render(<NedaaOperationsPage />);

    await screen.findByText("Omar Ali");
    await user.click(screen.getByTitle("next_page"));
    await waitFor(() =>
      expect(serviceMocks.listActiveDismissalRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      ),
    );

    await user.selectOptions(screen.getByRole("combobox"), "25");
    await waitFor(() =>
      expect(serviceMocks.listActiveDismissalRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 25 }),
      ),
    );
  });

  it("sends waiting filters with one academic id and waiting sort", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.waiting" }),
    );
    await screen.findByText("Salma Hassan");
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );

    await user.click(screen.getByRole("button", { name: "table.gate" }));
    await user.click(screen.getByRole("button", { name: "Main Gate (MAIN)" }));
    await user.click(screen.getByRole("button", { name: "table.status" }));
    await user.click(
      screen.getByRole("button", { name: "operations_status.moving" }),
    );
    await user.click(
      screen.getByRole("button", { name: "operations_filters.stage" }),
    );
    await user.click(screen.getByRole("button", { name: "Primary" }));
    await user.click(
      screen.getByRole("button", { name: "operations_filters.grade" }),
    );
    await user.click(screen.getByRole("button", { name: "Grade 2" }));
    await user.click(
      screen.getByRole("button", { name: "operations_filters.sort" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "operations_filters.arrival_stage_asc",
      }),
    );

    await waitFor(() =>
      expect(serviceMocks.listDismissalWaitingStudents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gateId: "gate-1",
          status: "moving",
          gradeId: "grade-1",
          sort: "arrival_stage_asc",
          page: 1,
          limit: 10,
        }),
      ),
    );
    expect(
      serviceMocks.listDismissalWaitingStudents.mock.lastCall?.[0],
    ).not.toHaveProperty("stageId");
  });

  it("uses table page and page size for waiting students", async () => {
    const user = userEvent.setup();
    serviceMocks.listDismissalWaitingStudents.mockResolvedValue({
      data: [waitingStudent],
      summary: {
        totalCount: 25,
        calledCount: 0,
        movingCount: 1,
        atGateCount: 0,
        readyCount: 0,
        arrivedCount: 0,
        notArrivedCount: 1,
        delayedCount: 0,
        urgentCount: 0,
      },
      pagination: { page: 1, limit: 10, totalPages: 3 },
    });
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.waiting" }),
    );
    await screen.findByText("Salma Hassan");
    await user.click(screen.getByTitle("next_page"));
    await waitFor(() =>
      expect(serviceMocks.listDismissalWaitingStudents).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      ),
    );

    await user.selectOptions(screen.getByRole("combobox"), "25");
    await waitFor(() =>
      expect(serviceMocks.listDismissalWaitingStudents).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 25 }),
      ),
    );
  });

  it("sends the complete history filter contract", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.history" }),
    );
    await screen.findByText("Laila Mostafa");
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );

    await user.click(
      screen.getByRole("button", { name: "operations_filters.child" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Omar Ali (omar.ali@example.com)" }),
    );
    await user.click(screen.getByRole("button", { name: "table.gate" }));
    await user.click(screen.getByRole("button", { name: "Main Gate (MAIN)" }));
    await user.click(screen.getByRole("button", { name: "table.status" }));
    await user.click(
      screen.getByRole("button", { name: "operations_status.handed_over" }),
    );
    await user.click(
      screen.getByLabelText("operations_status.cancelled"),
    );
    await user.click(screen.getByLabelText("operations_status.expired"));

    await user.click(
      screen.getByRole("button", { name: "operations_filters.stage" }),
    );
    await user.click(screen.getByRole("button", { name: "Primary" }));
    await user.click(
      screen.getByRole("button", { name: "operations_filters.grade" }),
    );
    await user.click(screen.getByRole("button", { name: "Grade 2" }));

    fireEvent.change(screen.getByLabelText("operations_filters.date_from"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getByLabelText("operations_filters.date_to"), {
      target: { value: "2026-07-07" },
    });
    await user.click(
      screen.getByLabelText("operations_filters.active_only"),
    );
    await user.click(
      screen.getByLabelText("operations_filters.terminal_only"),
    );
    await user.click(
      screen.getByLabelText("operations_filters.delayed_only"),
    );
    await user.click(
      screen.getByLabelText("operations_filters.urgent_only"),
    );
    await user.click(
      screen.getByLabelText("operations_filters.escalated_only"),
    );
    await user.click(
      screen.getByRole("button", { name: "operations_filters.sort" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "operations_filters.wait_minutes_desc",
      }),
    );

    await waitFor(() =>
      expect(serviceMocks.listDismissalRequestHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: "handed_over",
          statuses: "cancelled,expired",
          childId: "student-1",
          gateId: "gate-1",
          stageId: "stage-1",
          gradeId: "grade-1",
          dateFrom: "2026-07-01T00:00:00.000Z",
          dateTo: "2026-07-07T23:59:59.999Z",
          terminalOnly: true,
          delayedOnly: true,
          urgentOnly: true,
          escalatedOnly: true,
          sort: "wait_minutes_desc",
          page: 1,
          limit: 10,
        }),
      ),
    );
    expect(
      serviceMocks.listDismissalRequestHistory.mock.lastCall?.[0],
    ).not.toHaveProperty("activeOnly");
  });

  it("uses table page and page size for history", async () => {
    const user = userEvent.setup();
    serviceMocks.listDismissalRequestHistory.mockResolvedValue({
      data: [historyItem],
      summary: {
        totalCount: 25,
        activeCount: 0,
        terminalCount: 1,
        delayedCount: 1,
        urgentCount: 0,
        escalatedCount: 1,
      },
      pagination: { page: 1, limit: 10, totalPages: 3 },
    });
    render(<NedaaOperationsPage />);

    await user.click(
      await screen.findByRole("button", { name: "operations_tabs.history" }),
    );
    await screen.findByText("Laila Mostafa");
    await user.click(screen.getByTitle("next_page"));
    await waitFor(() =>
      expect(serviceMocks.listDismissalRequestHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      ),
    );

    await user.selectOptions(screen.getByRole("combobox"), "25");
    await waitFor(() =>
      expect(serviceMocks.listDismissalRequestHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 25 }),
      ),
    );
  });

  it("groups filters by operational purpose for each tab", async () => {
    const user = userEvent.setup();
    render(<NedaaOperationsPage />);

    await screen.findByText("Omar Ali");
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );

    const activePrimaryGroup = screen.getByRole("region", {
      name: "operations_filters.primary_group",
    });
    expect(within(activePrimaryGroup).getByLabelText("table.gate")).toBeVisible();
    expect(
      within(activePrimaryGroup).getByLabelText("table.status"),
    ).toBeVisible();
    expect(
      within(activePrimaryGroup).getByLabelText("operations_filters.sort"),
    ).toBeVisible();

    const activeAcademicGroup = screen.getByRole("region", {
      name: "operations_filters.academic_group",
    });
    for (const label of [
      "operations_filters.stage",
      "operations_filters.grade",
      "operations_filters.section",
      "operations_filters.classroom",
    ]) {
      expect(within(activeAcademicGroup).getByLabelText(label)).toBeVisible();
    }

    expect(
      screen.queryByRole("region", {
        name: "operations_filters.period_group",
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "operations_tabs.history" }),
    );
    await screen.findByText("Laila Mostafa");
    await user.click(
      screen.getByRole("button", { name: "filters.show_filters" }),
    );

    const historyPrimaryGroup = screen.getByRole("region", {
      name: "operations_filters.primary_group",
    });
    expect(within(historyPrimaryGroup).getByLabelText("table.gate")).toBeVisible();
    expect(
      within(historyPrimaryGroup).getByLabelText("table.status"),
    ).toBeVisible();
    expect(
      within(historyPrimaryGroup).getByLabelText("operations_filters.sort"),
    ).toBeVisible();

    const historyAcademicGroup = screen.getByRole("region", {
      name: "operations_filters.academic_group",
    });
    for (const label of [
      "operations_filters.stage",
      "operations_filters.grade",
      "operations_filters.section",
      "operations_filters.classroom",
    ]) {
      expect(within(historyAcademicGroup).getByLabelText(label)).toBeVisible();
    }

    const historyPeriodGroup = screen.getByRole("region", {
      name: "operations_filters.period_group",
    });
    expect(
      within(historyPeriodGroup).getByLabelText("operations_filters.date_from"),
    ).toBeVisible();
    expect(
      within(historyPeriodGroup).getByLabelText("operations_filters.date_to"),
    ).toBeVisible();

    const historyStatusGroup = screen.getByRole("region", {
      name: "operations_filters.status_group",
    });
    expect(
      within(historyStatusGroup).getByLabelText("operations_status.requested"),
    ).toBeVisible();

    const historyFlagsGroup = screen.getByRole("region", {
      name: "operations_filters.flags_group",
    });
    expect(
      within(historyFlagsGroup).getByLabelText("operations_filters.active_only"),
    ).toBeVisible();
  });
});
