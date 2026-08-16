export type NedaaGateId = string;

export type DismissalGateStatus = "open" | "busy" | "closed" | "maintenance";

export interface DismissalSettingsSchoolZone {
  latitude: number | null;
  longitude: number | null;
  label: string | null;
  source: "settings" | "school_profile" | "default";
}

export interface DismissalSettingsRequestWindow {
  startLocal: string | null;
  endLocal: string | null;
}

export interface DismissalSettingsThresholds {
  delayMinutes: number;
  urgentMinutes: number;
  expiryMinutes: number;
}

export interface DismissalSettingsPolicies {
  requirePickupCode: boolean;
  allowDelegatePickup: boolean;
  allowParentCancelBeforeCalled: boolean;
}

export interface DismissalSettingsDefaultGate {
  id: string;
  code: string;
  name: string;
  status: DismissalGateStatus;
}

export interface DismissalSettingsResponse {
  enabled: boolean;
  timezone: string;
  schoolZone: DismissalSettingsSchoolZone;
  allowedRadiusMeters: number;
  requestWindow: DismissalSettingsRequestWindow;
  thresholds: DismissalSettingsThresholds;
  policies: DismissalSettingsPolicies;
  defaultGate: DismissalSettingsDefaultGate | null;
  configured: boolean;
  updatedAt: string | null;
}

export interface UpdateDismissalSettingsPayload {
  enabled?: boolean;
  timezone?: string;
  schoolLatitude?: number | null;
  schoolLongitude?: number | null;
  allowedRadiusMeters?: number;
  requestWindowStartLocal?: string | null;
  requestWindowEndLocal?: string | null;
  delayThresholdMinutes?: number;
  urgentThresholdMinutes?: number;
  expiryThresholdMinutes?: number;
  requirePickupCode?: boolean;
  allowDelegatePickup?: boolean;
  allowParentCancelBeforeCalled?: boolean;
  defaultGateId?: string | null;
}

export interface NedaaSettingsPatch extends UpdateDismissalSettingsPayload {
  schoolZoneLabel?: string | null;
}

export interface NedaaGate {
  id: NedaaGateId;
  code: string;
  name: string;
  campus: string | null;
  status: DismissalGateStatus;
  isActive: boolean;
  sortOrder: number;
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  waitingZones: string[];
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListDismissalGatesParams {
  status?: string;
  active?: string | boolean;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateDismissalGatePayload {
  code: string;
  name: string;
  campus?: string | null;
  status?: string;
  isActive: boolean;
  sortOrder?: number;
  latitude?: number | null;
  longitude?: number | null;
  waitingZones?: unknown;
  notes?: string | null;
}

export type UpdateDismissalGatePayload = Partial<CreateDismissalGatePayload>;

export interface DismissalGatesSummary {
  totalCount: number;
  openCount: number;
  busyCount: number;
  closedCount: number;
  maintenanceCount: number;
  activeCount: number;
}

export interface DismissalGatesListResponse {
  data: NedaaGate[];
  summary: DismissalGatesSummary;
}

export interface ListDismissalStaffAssignmentsParams {
  staffUserId?: string;
  gateId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  active?: string | boolean;
  lead?: string | boolean;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateDismissalStaffAssignmentPayload {
  staffUserId: string;
  gateId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;
  isLead?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  notes?: string | null;
}

export type UpdateDismissalStaffAssignmentPayload =
  Partial<CreateDismissalStaffAssignmentPayload>;

export interface DismissalStaffSummary {
  displayName: string;
  email: string | null;
  userType: "dismissal_staff";
  status: "active" | "inactive" | "suspended";
}

export interface DismissalStaffAssignmentGate {
  id: string;
  code: string;
  name: string;
  status: DismissalGateStatus;
}

export interface DismissalAcademicNode {
  id: string;
  name: string;
}

export interface DismissalAcademicScope {
  stage: DismissalAcademicNode | null;
  grade: DismissalAcademicNode | null;
  section: DismissalAcademicNode | null;
  classroom: DismissalAcademicNode | null;
}

export interface DismissalStaffAssignment {
  id: string;
  staff: DismissalStaffSummary;
  gate: DismissalStaffAssignmentGate | null;
  academicScope: DismissalAcademicScope;
  isLead: boolean;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DismissalStaffAssignmentsSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  leadCount: number;
}

export interface DismissalStaffAssignmentsListResponse {
  data: DismissalStaffAssignment[];
  summary: DismissalStaffAssignmentsSummary;
}

export interface DeleteDismissalStaffAssignmentResponse {
  id: string;
  deleted: boolean;
}

export type DismissalRequestStatus =
  | "requested"
  | "queued"
  | "called"
  | "moving"
  | "at_gate"
  | "ready";

export type DismissalRequestHistoryStatus =
  | DismissalRequestStatus
  | "handed_over"
  | "cancelled"
  | "expired";

export type DismissalWaitingStudentStatus = Extract<
  DismissalRequestStatus,
  "called" | "moving" | "at_gate" | "ready"
>;

export type DismissalArrivalState =
  | "called"
  | "in_transit"
  | "arrived"
  | "ready";

export type DismissalEscalationReason =
  | "student_not_arrived"
  | "gate_congestion"
  | "parent_waiting"
  | "safety_concern"
  | "manual_follow_up"
  | "other";

export interface DismissalPagination {
  page: number;
  limit: number;
  totalPages: number;
}

export type ActiveDismissalRequestSort =
  | "urgency_desc"
  | "requested_at_asc"
  | "requested_at_desc";

export type WaitingDismissalStudentSort =
  | "arrival_stage_asc"
  | "requested_at_asc"
  | "requested_at_desc"
  | "urgency_desc";

export type DismissalRequestHistorySort =
  | "created_at_desc"
  | "created_at_asc"
  | "updated_at_desc"
  | "wait_minutes_desc";

export interface ListActiveDismissalRequestsParams {
  status?: string;
  gateId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: ActiveDismissalRequestSort;
}

export interface ListDismissalWaitingStudentsParams
  extends Omit<ListActiveDismissalRequestsParams, "sort"> {
  sort?: WaitingDismissalStudentSort;
}

export interface ListDismissalRequestHistoryParams {
  status?: string;
  statuses?: string;
  childId?: string;
  gateId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  dateFrom?: string;
  dateTo?: string;
  activeOnly?: boolean;
  terminalOnly?: boolean;
  delayedOnly?: boolean;
  urgentOnly?: boolean;
  escalatedOnly?: boolean;
  page?: number;
  limit?: number;
  sort?: DismissalRequestHistorySort;
}

export interface DismissalRequestSignals {
  delayed: boolean;
  urgent: boolean;
  delayThresholdMinutes: number;
  urgentThresholdMinutes: number;
}

export interface DismissalRequestChild {
  id: string;
  displayName: string;
  grade: string | null;
  section: string | null;
  classroom: string | null;
}

export interface DismissalRequestGate {
  id: string;
  code: string;
  name: string;
  status: DismissalGateStatus;
}

export interface DismissalRequestTimelineEvent {
  type:
    | "request_created"
    | "request_status_changed"
    | "request_escalated";
  statusFrom: string | null;
  statusTo: string | null;
  createdAt: string;
  note: string | null;
}

export interface ActiveDismissalRequest {
  id: string;
  status: DismissalRequestStatus;
  requestedAt: string;
  waitMinutes: number;
  signals: DismissalRequestSignals;
  child: DismissalRequestChild;
  gate: DismissalRequestGate;
  requester: {
    displayName: string | null;
  };
}

export interface ActiveDismissalRequestDetail extends ActiveDismissalRequest {
  timeline: DismissalRequestTimelineEvent[];
}

export interface ActiveDismissalRequestsSummary {
  totalCount: number;
  requestedCount: number;
  queuedCount: number;
  calledCount: number;
  movingCount: number;
  atGateCount: number;
  readyCount: number;
  delayedCount: number;
  urgentCount: number;
}

export interface ActiveDismissalRequestsListResponse {
  data: ActiveDismissalRequest[];
  summary: ActiveDismissalRequestsSummary;
  pagination: DismissalPagination;
}

export interface DismissalRequestDetailResponse {
  request: ActiveDismissalRequestDetail;
}

export interface UpdateDismissalRequestStatusPayload {
  status: string;
  note?: string | null;
}

export interface DismissalRequestStatusUpdateItem
  extends Omit<ActiveDismissalRequestDetail, "status" | "requester"> {
  status: Exclude<DismissalRequestStatus, "requested">;
  previousStatus: DismissalRequestStatus | null;
  changed: boolean;
  updatedAt: string;
}

export interface DismissalRequestStatusUpdateResponse {
  request: DismissalRequestStatusUpdateItem;
}

export interface DismissalPickupRecipientsResponse {
  request: {
    id: string;
    status: "ready";
    child: DismissalRequestChild;
    gate: Pick<DismissalRequestGate, "id" | "code" | "name"> | null;
  };
  policy: {
    delegatePickupAllowed: boolean;
    pickupCodeRequired: boolean;
  };
  recipients: Array<{
    pickupRecipientToken: string;
    displayName: string;
    relation: string | null;
    isRequestingGuardian: boolean;
    canPickup: true;
    maskedPhone: string | null;
  }>;
}

export interface DeliverDismissalRequestPayload {
  pickupRecipientToken?: string;
  pickupCode?: string;
  note?: string | null;
}

export interface DeliverDismissalRequestResponse {
  delivery: {
    id: string;
    status: "handed_over";
    previousStatus: "ready";
    handedOverAt: string;
    pickupCodeVerified: boolean;
    pickupRecipientVerified: true;
    child: DismissalRequestChild;
    gate: DismissalRequestGate;
    receiver: {
      name: string | null;
      relation: string | null;
      verified: true;
      source: "guardian_link";
    };
    timeline: DismissalRequestTimelineEvent[];
  };
}

export interface EscalateDismissalRequestPayload {
  reason?: string;
  note?: string | null;
}

export interface EscalateDismissalRequestResponse {
  escalation: {
    requestId: string;
    changed: boolean;
    escalated: true;
    escalatedAt: string;
    reason: DismissalEscalationReason;
  };
  request: {
    id: string;
    status: DismissalRequestHistoryStatus;
    isActive: boolean;
    isTerminal: boolean;
    wait: {
      minutes: number;
      delayed: boolean;
      urgent: boolean;
    };
  };
}

export interface DismissalWaitingStudent {
  id: string;
  status: DismissalWaitingStudentStatus;
  arrivalState: DismissalArrivalState;
  requestedAt: string;
  updatedAt: string;
  waitMinutes: number;
  signals: DismissalRequestSignals;
  child: DismissalRequestChild;
  gate: DismissalRequestGate;
}

export interface DismissalWaitingStudentsSummary {
  totalCount: number;
  calledCount: number;
  movingCount: number;
  atGateCount: number;
  readyCount: number;
  arrivedCount: number;
  notArrivedCount: number;
  delayedCount: number;
  urgentCount: number;
}

export interface DismissalWaitingStudentsListResponse {
  data: DismissalWaitingStudent[];
  summary: DismissalWaitingStudentsSummary;
  pagination: DismissalPagination;
}

export interface ConfirmDismissalStudentArrivalPayload {
  note?: string | null;
}

export interface ConfirmDismissalStudentArrivalResponse {
  student: DismissalWaitingStudent & {
    previousStatus: DismissalWaitingStudentStatus | null;
    changed: boolean;
    timeline: DismissalRequestTimelineEvent[];
  };
}

export interface DismissalHistoryWait {
  minutes: number;
  delayed: boolean;
  urgent: boolean;
  thresholdMinutes: number | null;
  urgentThresholdMinutes: number | null;
}

export interface DismissalHistoryEscalation {
  escalated: boolean;
  escalatedAt: string | null;
  reason: string | null;
  note?: string | null;
}

export interface DismissalRequestHistoryItem {
  id: string;
  status: DismissalRequestHistoryStatus;
  isActive: boolean;
  isTerminal: boolean;
  requestedAt: string;
  updatedAt: string | null;
  calledAt: string | null;
  readyAt: string | null;
  handedOverAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  wait: DismissalHistoryWait;
  escalation: DismissalHistoryEscalation;
  child: DismissalRequestChild;
  gate: Pick<DismissalRequestGate, "id" | "code" | "name"> | null;
}

export interface DismissalRequestHistorySummary {
  totalCount: number;
  activeCount: number;
  terminalCount: number;
  delayedCount: number;
  urgentCount: number;
  escalatedCount: number;
}

export interface DismissalRequestHistoryListResponse {
  data: DismissalRequestHistoryItem[];
  summary: DismissalRequestHistorySummary;
  pagination: DismissalPagination;
}

export interface DismissalRequestHistoryDetail
  extends DismissalRequestHistoryItem {
  timeline: DismissalRequestTimelineEvent[];
}

export interface DismissalRequestHistoryDetailResponse {
  request: DismissalRequestHistoryDetail;
}

export interface NedaaSettings {
  settings: DismissalSettingsResponse;
  gates: NedaaGate[];
}
