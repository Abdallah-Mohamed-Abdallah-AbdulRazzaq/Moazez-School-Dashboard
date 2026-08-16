import { fetchTermsByYear } from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  TransferApplication,
  WithdrawalApplication,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import { getAllTransfers, getAllWithdrawals } from "./transfersWithdrawalsService";

export interface TransfersWithdrawalsOverviewMetrics {
  filteredTransfers: TransferApplication[];
  filteredWithdrawals: WithdrawalApplication[];
  transfersThisTerm: number;
  internalTransfers: number;
  externalTransfers: number;
  netChange: number;
  withdrawalsThisTerm: number;
  dropoutRate: number;
  behaviorRelatedWithdrawals: number;
}

export interface TransfersTermTrendPoint {
  label: string;
  value: number;
}

export interface TransferTabMetrics {
  transfersThisTerm: number;
  internalTransfers: number;
  externalTransfers: number;
  netChange: number;
  statusBreakdown: Array<{ label: string; value: number }>;
  stageBreakdown: Array<{ label: string; value: number }>;
  trend: TransfersTermTrendPoint[];
}

export interface WithdrawalTabMetrics {
  withdrawalsThisTerm: number;
  dropoutRate: number;
  behaviorRelated: number;
  financialPending: number;
  reasonBreakdown: Array<{ label: string; value: number }>;
  statusBreakdown: Array<{ label: string; value: number }>;
  trend: TransfersTermTrendPoint[];
}

function isInTermRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

function buildWeeklyTrend(dates: string[]) {
  const buckets = new Map<string, number>();

  dates.forEach((date) => {
    const monthKey = date.slice(0, 7);
    buckets.set(monthKey, (buckets.get(monthKey) || 0) + 1);
  });

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }));
}

function buildBreakdown<T extends string>(items: T[]) {
  const counts = new Map<T, number>();

  items.forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

export function buildTransferTabMetrics(
  transfers: TransferApplication[],
): TransferTabMetrics {
  const internalTransfers = transfers.filter((item) => item.type === "internal").length;
  const externalTransfers = transfers.filter((item) => item.type === "external").length;

  return {
    transfersThisTerm: transfers.length,
    internalTransfers,
    externalTransfers,
    netChange: internalTransfers - externalTransfers,
    statusBreakdown: buildBreakdown(transfers.map((item) => item.status)),
    stageBreakdown: buildBreakdown(transfers.map((item) => item.stage)),
    trend: buildWeeklyTrend(
      transfers.map((item) => item.effectiveDate || item.requestDate),
    ),
  };
}

export function buildWithdrawalTabMetrics(
  withdrawals: WithdrawalApplication[],
  transfersInTermCount = 0,
): WithdrawalTabMetrics {
  const withdrawalsThisTerm = withdrawals.length;

  return {
    withdrawalsThisTerm,
    dropoutRate:
      withdrawalsThisTerm === 0
        ? 0
        : Number(
            ((withdrawalsThisTerm /
              Math.max(withdrawalsThisTerm + transfersInTermCount, 1)) *
              100).toFixed(1),
          ),
    behaviorRelated: withdrawals.filter((item) => item.reason === "behavior").length,
    financialPending: withdrawals.filter((item) => item.financialClearance === "pending").length,
    reasonBreakdown: buildBreakdown(withdrawals.map((item) => item.reason)),
    statusBreakdown: buildBreakdown(withdrawals.map((item) => item.status)),
    trend: buildWeeklyTrend(
      withdrawals.map((item) => item.effectiveDate || item.requestDate),
    ),
  };
}

export async function fetchTransfersWithdrawalsOverviewMetrics(
  yearId: string,
  termId: string,
): Promise<TransfersWithdrawalsOverviewMetrics> {
  const terms = await fetchTermsByYear(yearId);
  const selectedTerm = terms.find((term) => term.id === termId);
  const transfers = getAllTransfers();
  const withdrawals = getAllWithdrawals();

  if (!selectedTerm) {
    const internalTransfers = transfers.filter((item) => item.type === "internal").length;
    const externalTransfers = transfers.filter((item) => item.type === "external").length;

    return {
      filteredTransfers: transfers,
      filteredWithdrawals: withdrawals,
      transfersThisTerm: transfers.length,
      internalTransfers,
      externalTransfers,
      netChange: internalTransfers - externalTransfers,
      withdrawalsThisTerm: withdrawals.length,
      dropoutRate: 0,
      behaviorRelatedWithdrawals: withdrawals.filter((item) => item.reason === "behavior").length,
    };
  }

  const filteredTransfers = transfers.filter((item) =>
    isInTermRange(item.effectiveDate || item.requestDate, selectedTerm.startDate, selectedTerm.endDate),
  );
  const filteredWithdrawals = withdrawals.filter((item) =>
    isInTermRange(item.effectiveDate || item.requestDate, selectedTerm.startDate, selectedTerm.endDate),
  );

  const transferMetrics = buildTransferTabMetrics(filteredTransfers);
  const withdrawalMetrics = buildWithdrawalTabMetrics(
    filteredWithdrawals,
    filteredTransfers.length,
  );

  return {
    filteredTransfers,
    filteredWithdrawals,
    transfersThisTerm: transferMetrics.transfersThisTerm,
    internalTransfers: transferMetrics.internalTransfers,
    externalTransfers: transferMetrics.externalTransfers,
    netChange: transferMetrics.netChange,
    withdrawalsThisTerm: withdrawalMetrics.withdrawalsThisTerm,
    dropoutRate: withdrawalMetrics.dropoutRate,
    behaviorRelatedWithdrawals: withdrawalMetrics.behaviorRelated,
  };
}

