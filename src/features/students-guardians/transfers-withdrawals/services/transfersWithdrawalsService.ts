import type {
  ApplicationStatus,
  Stage,
  TransferApplication,
  TransfersFilters,
  WithdrawalApplication,
  WithdrawalsFilters,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  transferStudent,
  withdrawStudent,
} from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import type {
  BehaviorBreakdownPoint,
  ReasonBreakdownPoint,
  StageBreakdownPoint,
  TransferWithdrawalRequestRow,
  TransfersWithdrawalsOverviewMetrics,
  TransfersWithdrawalsTrendPoint,
} from "./transfersWithdrawalsAdapter";

export type {
  BehaviorBreakdownPoint,
  ReasonBreakdownPoint,
  StageBreakdownPoint,
  TransferWithdrawalRequestRow,
  TransfersWithdrawalsOverviewMetrics,
  TransfersWithdrawalsTrendPoint,
} from "./transfersWithdrawalsAdapter";

const emptyMetrics = (): TransfersWithdrawalsOverviewMetrics => ({
  transfersThisMonth: 0,
  withdrawalsThisMonth: 0,
  pendingRequests: 0,
  dropoutRate: 0,
  behaviorRelatedWithdrawals: 0,
});

export function getAllTransfers(): TransferApplication[] {
  return [];
}

export function getAllWithdrawals(): WithdrawalApplication[] {
  return [];
}

export function subscribeTransfersWithdrawals(): () => void {
  return () => undefined;
}

export function getTransfersWithdrawalsSnapshot(): number {
  return 0;
}

export function getTransferById(
  id: string,
): TransferApplication | undefined {
  void id;
  return undefined;
}

export function getWithdrawalById(
  id: string,
): WithdrawalApplication | undefined {
  void id;
  return undefined;
}

export function getTransfersByStudentId(
  studentId: string,
): TransferApplication[] {
  void studentId;
  return [];
}

export function getWithdrawalsByStudentId(
  studentId: string,
): WithdrawalApplication[] {
  void studentId;
  return [];
}

export function filterTransfers(
  filters: TransfersFilters,
): TransferApplication[] {
  void filters;
  return [];
}

export function filterWithdrawals(
  filters: WithdrawalsFilters,
): WithdrawalApplication[] {
  void filters;
  return [];
}

export async function createTransfer(
  data: Partial<TransferApplication>,
): Promise<TransferApplication> {
  if (
    !data.studentId ||
    !data.type ||
    !data.reason ||
    !data.effectiveDate ||
    !data.stage
  ) {
    throw new Error("transfer_invalid");
  }

  let movement: Awaited<ReturnType<typeof transferStudent>>;
  if (data.type === "internal") {
    if (!data.targetSectionId) {
      throw new Error("target_section_required");
    }
    movement = await transferStudent({
      studentId: data.studentId,
      targetSectionId: data.targetSectionId,
      ...(data.targetClassroomId
        ? { targetClassroomId: data.targetClassroomId }
        : {}),
      effectiveDate: data.effectiveDate,
      reason: data.reason,
      ...(data.notes ? { notes: data.notes } : {}),
    });
  } else {
    movement = await withdrawStudent({
      studentId: data.studentId,
      effectiveDate: data.effectiveDate,
      reason: data.reason,
      ...(data.externalSchool || data.notes
        ? { notes: data.externalSchool || data.notes }
        : {}),
      actionType: "transferred_external",
    });
  }

  return {
    id: movement.id,
    studentId: movement.studentId,
    studentName: data.studentName || "",
    studentNameAr: data.studentNameAr || "",
    stage: data.stage,
    grade: data.grade || movement.fromGrade || "",
    section: data.section || movement.fromSection,
    classroom: data.classroom || movement.fromClassroom,
    type: data.type,
    targetSection: movement.toSection || data.targetSection,
    targetSectionId: movement.toSectionId || data.targetSectionId,
    targetClassroom: movement.toClassroom || data.targetClassroom,
    targetClassroomId: movement.toClassroomId || data.targetClassroomId,
    targetClass: data.targetClass,
    externalSchool: data.externalSchool,
    reason: movement.reason || data.reason,
    status: "executed",
    requestDate: movement.createdAt,
    effectiveDate: movement.effectiveDate,
    notes: movement.notes || data.notes,
  };
}

export async function createWithdrawal(
  data: Partial<WithdrawalApplication>,
): Promise<WithdrawalApplication> {
  if (
    !data.studentId ||
    !data.reason ||
    !data.effectiveDate ||
    !data.stage
  ) {
    throw new Error("withdrawal_invalid");
  }

  const movement = await withdrawStudent({
    studentId: data.studentId,
    effectiveDate: data.effectiveDate,
    reason: data.reason,
    ...(data.notes ? { notes: data.notes } : {}),
    actionType: "withdrawn",
  });

  return {
    id: movement.id,
    studentId: movement.studentId,
    studentName: data.studentName || "",
    studentNameAr: data.studentNameAr || "",
    stage: data.stage,
    grade: data.grade || movement.fromGrade || "",
    section: data.section || movement.fromSection,
    classroom: data.classroom || movement.fromClassroom,
    reason: data.reason,
    status: "executed",
    requestDate: movement.createdAt,
    effectiveDate: movement.effectiveDate,
    notes: movement.notes || data.notes,
  };
}

export async function updateTransferStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string,
): Promise<TransferApplication> {
  void id;
  void status;
  void rejectionReason;
  throw new Error("transfer_request_workflow_not_supported");
}

export async function updateWithdrawalStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string,
): Promise<WithdrawalApplication> {
  void id;
  void status;
  void rejectionReason;
  throw new Error("withdrawal_request_workflow_not_supported");
}

export function getTransfersWithdrawalsOverviewMetrics(): TransfersWithdrawalsOverviewMetrics {
  return emptyMetrics();
}

export async function fetchTransfersWithdrawalsOverviewMetrics(): Promise<TransfersWithdrawalsOverviewMetrics> {
  return emptyMetrics();
}

export function getTransfersWithdrawalsTrendData(
  stage: Stage | "all" = "all",
): TransfersWithdrawalsTrendPoint[] {
  void stage;
  return [];
}

export async function fetchTransfersWithdrawalsTrendData(
  stage: Stage | "all" = "all",
): Promise<TransfersWithdrawalsTrendPoint[]> {
  void stage;
  return [];
}

export function getTransfersWithdrawalsStageBreakdown(): StageBreakdownPoint[] {
  return [];
}

export async function fetchTransfersWithdrawalsStageBreakdown(): Promise<
  StageBreakdownPoint[]
> {
  return [];
}

export function getWithdrawalReasonsBreakdown(
  stage: Stage | "all" = "all",
): ReasonBreakdownPoint[] {
  void stage;
  return [];
}

export async function fetchWithdrawalReasonsBreakdown(
  stage: Stage | "all" = "all",
): Promise<ReasonBreakdownPoint[]> {
  void stage;
  return [];
}

export function getWithdrawalsBehaviorBreakdown(): BehaviorBreakdownPoint[] {
  return [];
}

export async function fetchWithdrawalsBehaviorBreakdown(): Promise<
  BehaviorBreakdownPoint[]
> {
  return [];
}

export function getTransfersWithdrawalsRequestRows(): TransferWithdrawalRequestRow[] {
  return [];
}

export async function fetchTransfersWithdrawalsRequestRows(): Promise<
  TransferWithdrawalRequestRow[]
> {
  return [];
}
