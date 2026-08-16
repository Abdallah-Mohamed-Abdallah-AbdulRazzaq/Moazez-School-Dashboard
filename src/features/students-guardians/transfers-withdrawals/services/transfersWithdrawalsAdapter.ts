import type {
  ApplicationStatus,
  Stage,
  TransferApplication,
  TransfersFilters,
  WithdrawalApplication,
  WithdrawalsFilters,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";

export interface TransfersWithdrawalsOverviewMetrics {
  transfersThisMonth: number;
  withdrawalsThisMonth: number;
  pendingRequests: number;
  dropoutRate: number;
  behaviorRelatedWithdrawals: number;
}

export interface TransfersWithdrawalsTrendPoint {
  month: string;
  transfers: number;
  withdrawals: number;
}

export interface StageBreakdownPoint {
  stage: Stage;
  transfers: number;
  withdrawals: number;
}

export interface ReasonBreakdownPoint {
  reason: string;
  value: number;
}

export interface BehaviorBreakdownPoint {
  range: string;
  withdrawals: number;
  label: string;
}

export interface TransferWithdrawalRequestRow {
  id: string;
  studentName: string;
  studentNameAr: string;
  stage: string;
  grade: string;
  behaviorAvg: number;
  attendancePercent: number;
  reason: string;
  status: string;
  requestDate: string;
  type: string;
}

export interface TransfersWithdrawalsAdapter {
  getAllTransfers(): TransferApplication[];
  getAllWithdrawals(): WithdrawalApplication[];
  subscribe(listener: () => void): () => void;
  getSnapshot(): number;
  getTransferById(id: string): TransferApplication | undefined;
  getWithdrawalById(id: string): WithdrawalApplication | undefined;
  getTransfersByStudentId(studentId: string): TransferApplication[];
  getWithdrawalsByStudentId(studentId: string): WithdrawalApplication[];
  filterTransfers(filters: TransfersFilters): TransferApplication[];
  filterWithdrawals(filters: WithdrawalsFilters): WithdrawalApplication[];
  createTransfer(data: Partial<TransferApplication>): Promise<TransferApplication>;
  createWithdrawal(data: Partial<WithdrawalApplication>): Promise<WithdrawalApplication>;
  updateTransferStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReason?: string,
  ): Promise<TransferApplication>;
  updateWithdrawalStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReason?: string,
  ): Promise<WithdrawalApplication>;
  getOverviewMetrics(): TransfersWithdrawalsOverviewMetrics;
  getTrendData(stage?: Stage | "all"): TransfersWithdrawalsTrendPoint[];
  getStageBreakdown(): StageBreakdownPoint[];
  getWithdrawalReasons(stage?: Stage | "all"): ReasonBreakdownPoint[];
  getWithdrawalsByBehaviorBand(): BehaviorBreakdownPoint[];
  getRequestsTableRows(): TransferWithdrawalRequestRow[];
  fetchOverviewMetrics?(): Promise<TransfersWithdrawalsOverviewMetrics>;
  fetchTrendData?(stage?: Stage | "all"): Promise<TransfersWithdrawalsTrendPoint[]>;
  fetchStageBreakdown?(): Promise<StageBreakdownPoint[]>;
  fetchWithdrawalReasons?(stage?: Stage | "all"): Promise<ReasonBreakdownPoint[]>;
  fetchWithdrawalsByBehaviorBand?(): Promise<BehaviorBreakdownPoint[]>;
  fetchRequestsTableRows?(): Promise<TransferWithdrawalRequestRow[]>;
}
