"use client";

import type {
  ReinforcementAssignmentScope,
  ReinforcementSource,
  ReinforcementStatus,
  ReinforcementRewardType,
  ReinforcementTaskFilters,
} from "../types/reinforcement";

export type ReinforcementOverviewChartKey =
  | "status"
  | "source"
  | "rewardType"
  | "topPerformance";

export type ReinforcementActivityFilter = "all" | "reward" | "task" | "submission";

const VALID_SCOPES: Array<ReinforcementAssignmentScope | "all"> = [
  "all",
  "school",
  "stage",
  "grade",
  "section",
  "classroom",
  "student",
];

const VALID_SOURCES: Array<ReinforcementSource | "all"> = [
  "all",
  "teacher",
  "parent",
  "system",
];

const VALID_STATUSES: Array<ReinforcementStatus | "all"> = [
  "all",
  "cancelled",
  "in_progress",
  "completed",
  "not_completed",
];

const VALID_REWARD_TYPES: Array<ReinforcementRewardType | "all"> = [
  "all",
  "moral",
  "financial",
  "xp",
  "badge",
];

const VALID_CHARTS: ReinforcementOverviewChartKey[] = [
  "status",
  "source",
  "rewardType",
  "topPerformance",
];

const VALID_ACTIVITY_FILTERS: ReinforcementActivityFilter[] = [
  "all",
  "reward",
  "task",
  "submission",
];

const isValid = <T extends string>(value: string | null, allowed: readonly T[]): value is T =>
  Boolean(value && allowed.includes(value as T));

export function parseReinforcementTasksQueryState(
  searchParams: URLSearchParams,
): ReinforcementTaskFilters {
  const assignmentScope = searchParams.get("scope");
  const source = searchParams.get("source");
  const status = searchParams.get("status");
  const rewardType = searchParams.get("rewardType");

  const parsed: ReinforcementTaskFilters = {
    assignmentScope: isValid(assignmentScope, VALID_SCOPES) ? assignmentScope : "all",
    source: isValid(source, VALID_SOURCES) ? source : "all",
    status: isValid(status, VALID_STATUSES) ? status : "all",
    rewardType: isValid(rewardType, VALID_REWARD_TYPES) ? rewardType : "all",
  };

  const query = searchParams.get("q");
  const targetId = searchParams.get("targetId");
  const dueDate = searchParams.get("dueDate");

  if (query) parsed.search = query;
  if (targetId) parsed.targetId = targetId;
  if (dueDate) parsed.dueDate = dueDate;

  return parsed;
}

export function buildReinforcementTasksQueryState(
  filters: ReinforcementTaskFilters,
  currentSearchParams: URLSearchParams,
): string {
  const params = new URLSearchParams(currentSearchParams.toString());

  if (filters.search?.trim()) params.set("q", filters.search.trim());
  else params.delete("q");

  if (filters.assignmentScope && filters.assignmentScope !== "all") {
    params.set("scope", filters.assignmentScope);
  } else {
    params.delete("scope");
  }

  if (filters.targetId) params.set("targetId", filters.targetId);
  else params.delete("targetId");

  if (filters.source && filters.source !== "all") params.set("source", filters.source);
  else params.delete("source");

  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  else params.delete("status");

  if (filters.rewardType && filters.rewardType !== "all") {
    params.set("rewardType", filters.rewardType);
  } else {
    params.delete("rewardType");
  }

  if (filters.dueDate) params.set("dueDate", filters.dueDate);
  else params.delete("dueDate");

  return params.toString();
}

export function parseReinforcementOverviewQueryState(searchParams: URLSearchParams) {
  const chart = searchParams.get("chart");
  const activity = searchParams.get("activity");

  return {
    chart: isValid(chart, VALID_CHARTS) ? chart : "status",
    activity: isValid(activity, VALID_ACTIVITY_FILTERS) ? activity : "all",
  };
}

export function buildReinforcementOverviewQueryState(
  next: {
    chart: ReinforcementOverviewChartKey;
    activity: ReinforcementActivityFilter;
  },
  currentSearchParams: URLSearchParams,
): string {
  const params = new URLSearchParams(currentSearchParams.toString());

  if (next.chart !== "status") params.set("chart", next.chart);
  else params.delete("chart");

  if (next.activity !== "all") params.set("activity", next.activity);
  else params.delete("activity");

  return params.toString();
}
