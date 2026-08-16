import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  createDismissalGate,
  createDismissalStaffAssignment,
  deleteDismissalStaffAssignment,
  deliverDismissalRequest,
  escalateDismissalRequest,
  fetchDismissalRequest,
  fetchDismissalRequestHistoryItem,
  listDismissalPickupRecipients,
  listDismissalRequestHistory,
  listDismissalWaitingStudents,
  listActiveDismissalRequests,
  fetchDismissalGate,
  fetchDismissalSettings,
  fetchDismissalStaffAssignment,
  confirmDismissalStudentArrival,
  listDismissalGates,
  listDismissalStaffAssignments,
  updateDismissalGate,
  updateDismissalRequestStatus,
  updateDismissalSettings,
  updateDismissalStaffAssignment,
} from "@/features/nedaa/services/dismissalApiService";

describe("dismissalApiService", () => {
  beforeEach(() => {
    apiMocks.apiDelete.mockReset();
    apiMocks.apiGet.mockReset();
    apiMocks.apiPatch.mockReset();
    apiMocks.apiPost.mockReset();
  });

  it("uses the backend-native dismissal settings endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      enabled: true,
      timezone: "Africa/Cairo",
      schoolZone: {
        latitude: 30.0444,
        longitude: 31.2357,
        label: "Main gate",
        source: "settings",
      },
      allowedRadiusMeters: 150,
      requestWindow: { startLocal: "13:00", endLocal: "15:30" },
      thresholds: { delayMinutes: 15, urgentMinutes: 30, expiryMinutes: 180 },
      policies: {
        requirePickupCode: true,
        allowDelegatePickup: true,
        allowParentCancelBeforeCalled: true,
      },
      defaultGate: null,
      configured: true,
      updatedAt: "2026-07-07T10:00:00.000Z",
    });
    apiMocks.apiPatch.mockResolvedValueOnce({ enabled: false });

    await expect(fetchDismissalSettings()).resolves.toMatchObject({
      enabled: true,
      requestWindow: { startLocal: "13:00", endLocal: "15:30" },
    });
    await updateDismissalSettings({
      enabled: false,
      requestWindowStartLocal: "13:15",
      requestWindowEndLocal: "15:45",
      defaultGateId: null,
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/dismissal/settings");
    expect(apiMocks.apiPatch).toHaveBeenCalledWith("/dismissal/settings", {
      enabled: false,
      requestWindowStartLocal: "13:15",
      requestWindowEndLocal: "15:45",
      defaultGateId: null,
    });
  });

  it("uses backend-native dismissal gate endpoints and query params", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: [],
      summary: { totalCount: 0 },
    });
    apiMocks.apiGet.mockResolvedValueOnce({ id: "gate-1", code: "MAIN" });
    apiMocks.apiPost.mockResolvedValueOnce({ id: "gate-2", code: "NORTH" });
    apiMocks.apiPatch.mockResolvedValueOnce({ id: "gate-1", status: "busy" });

    await listDismissalGates({ active: true, q: "main", page: 1, limit: 25 });
    await fetchDismissalGate("gate-1");
    await createDismissalGate({
      code: "NORTH",
      name: "North Gate",
      campus: null,
      status: "open",
      isActive: true,
      sortOrder: 2,
      latitude: null,
      longitude: null,
      waitingZones: ["KG"],
      notes: "Morning overflow",
    });
    await updateDismissalGate("gate-1", { status: "busy", isActive: true });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(1, "/dismissal/gates", {
      params: { active: true, q: "main", page: 1, limit: 25 },
    });
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/dismissal/gates/gate-1",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith("/dismissal/gates", {
      code: "NORTH",
      name: "North Gate",
      campus: null,
      status: "open",
      isActive: true,
      sortOrder: 2,
      latitude: null,
      longitude: null,
      waitingZones: ["KG"],
      notes: "Morning overflow",
    });
    expect(apiMocks.apiPatch).toHaveBeenCalledWith("/dismissal/gates/gate-1", {
      status: "busy",
      isActive: true,
    });
  });

  it("uses backend-native dismissal staff assignment endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: [],
      summary: { totalCount: 0 },
    });
    apiMocks.apiGet.mockResolvedValueOnce({ id: "assignment-1" });
    apiMocks.apiPost.mockResolvedValueOnce({ id: "assignment-2" });
    apiMocks.apiPatch.mockResolvedValueOnce({
      id: "assignment-1",
      isLead: true,
    });
    apiMocks.apiDelete.mockResolvedValueOnce({
      id: "assignment-1",
      deleted: true,
    });

    await listDismissalStaffAssignments({
      q: "operator",
      staffUserId: "staff-1",
      gateId: "gate-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      active: true,
      lead: false,
      page: 2,
      limit: 25,
    });
    await fetchDismissalStaffAssignment("assignment-1");
    await createDismissalStaffAssignment({
      staffUserId: "staff-1",
      gateId: "gate-1",
      classroomId: null,
      isLead: false,
      isActive: true,
      startsAt: null,
      endsAt: null,
      notes: "Primary gate operator",
    });
    await updateDismissalStaffAssignment("assignment-1", { isLead: true });
    await deleteDismissalStaffAssignment("assignment-1");

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/dismissal/staff-assignments",
      {
        params: {
          q: "operator",
          staffUserId: "staff-1",
          gateId: "gate-1",
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          active: true,
          lead: false,
          page: 2,
          limit: 25,
        },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/dismissal/staff-assignments/assignment-1",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/dismissal/staff-assignments",
      {
        staffUserId: "staff-1",
        gateId: "gate-1",
        classroomId: null,
        isLead: false,
        isActive: true,
        startsAt: null,
        endsAt: null,
        notes: "Primary gate operator",
      },
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/dismissal/staff-assignments/assignment-1",
      { isLead: true },
    );
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(
      "/dismissal/staff-assignments/assignment-1",
    );
  });

  it("uses backend-native dismissal request operation endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: [],
      summary: { totalCount: 0 },
      pagination: { page: 1, limit: 25, totalPages: 0 },
    });
    apiMocks.apiGet.mockResolvedValueOnce({ request: { id: "request-1" } });
    apiMocks.apiPatch.mockResolvedValueOnce({
      request: { id: "request-1", status: "called" },
    });
    apiMocks.apiGet.mockResolvedValueOnce({
      request: { id: "request-1", status: "ready" },
      policy: { delegatePickupAllowed: true, pickupCodeRequired: true },
      recipients: [],
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      delivery: { id: "request-1", status: "handed_over" },
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      escalation: {
        requestId: "request-1",
        changed: true,
        escalated: true,
        reason: "parent_waiting",
      },
      request: { id: "request-1", status: "ready" },
    });

    await listActiveDismissalRequests({
      status: "called",
      gateId: "gate-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      q: "omar",
      page: 2,
      limit: 20,
      sort: "-requestedAt",
    });
    await fetchDismissalRequest("request-1");
    await updateDismissalRequestStatus("request-1", {
      status: "called",
      note: "Parent reached the gate",
    });
    await listDismissalPickupRecipients("request-1");
    await deliverDismissalRequest("request-1", {
      pickupRecipientToken: "recipient-token",
      pickupCode: "1234",
      note: null,
    });
    await escalateDismissalRequest("request-1", {
      reason: "parent_waiting",
      note: "Parent has waited too long",
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/dismissal/requests/active",
      {
        params: {
          status: "called",
          gateId: "gate-1",
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          q: "omar",
          page: 2,
          limit: 20,
          sort: "-requestedAt",
        },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/dismissal/requests/request-1",
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/dismissal/requests/request-1/status",
      { status: "called", note: "Parent reached the gate" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/dismissal/requests/request-1/pickup-recipients",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/dismissal/requests/request-1/deliver",
      {
        pickupRecipientToken: "recipient-token",
        pickupCode: "1234",
        note: null,
      },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/dismissal/requests/request-1/escalate",
      {
        reason: "parent_waiting",
        note: "Parent has waited too long",
      },
    );
  });

  it("uses backend-native dismissal waiting student and history endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: [],
      summary: { totalCount: 0 },
      pagination: { page: 1, limit: 25, totalPages: 0 },
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      student: { id: "request-1", status: "at_gate" },
    });
    apiMocks.apiGet.mockResolvedValueOnce({
      data: [],
      summary: { totalCount: 0 },
      pagination: { page: 1, limit: 25, totalPages: 0 },
    });
    apiMocks.apiGet.mockResolvedValueOnce({ request: { id: "request-1" } });

    await listDismissalWaitingStudents({
      status: "moving",
      gateId: "gate-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      q: "salma",
      page: 1,
      limit: 25,
      sort: "waitMinutes",
    });
    await confirmDismissalStudentArrival("request-1", {
      note: "Student arrived at the gate",
    });
    await listDismissalRequestHistory({
      statuses: "handed_over,cancelled",
      childId: "student-1",
      gateId: "gate-1",
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-07-07T23:59:59.999Z",
      terminalOnly: true,
      urgentOnly: false,
      escalatedOnly: true,
      page: 1,
      limit: 50,
      sort: "-updatedAt",
    });
    await fetchDismissalRequestHistoryItem("request-1");

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/dismissal/waiting-students",
      {
        params: {
          status: "moving",
          gateId: "gate-1",
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          q: "salma",
          page: 1,
          limit: 25,
          sort: "waitMinutes",
        },
      },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/dismissal/waiting-students/request-1/arrival",
      { note: "Student arrived at the gate" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/dismissal/requests/history",
      {
        params: {
          statuses: "handed_over,cancelled",
          childId: "student-1",
          gateId: "gate-1",
          stageId: "stage-1",
          gradeId: "grade-1",
          sectionId: "section-1",
          classroomId: "classroom-1",
          dateFrom: "2026-07-01T00:00:00.000Z",
          dateTo: "2026-07-07T23:59:59.999Z",
          terminalOnly: true,
          urgentOnly: false,
          escalatedOnly: true,
          page: 1,
          limit: 50,
          sort: "-updatedAt",
        },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/dismissal/requests/history/request-1",
    );
  });
});
