"use client";

import type {
  ReinforcementAssignmentScope,
  ReinforcementProofType,
  ReinforcementRewardType,
  ReinforcementSource,
  ReinforcementStatus,
} from "../types/reinforcement";

export const statusStyles: Record<ReinforcementStatus, string> = {
  cancelled: "bg-rose-100 text-rose-700",
  in_progress: "bg-blue-100 text-blue-700",
  under_review: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  not_completed: "bg-amber-100 text-amber-700",
};

export const sourceStyles: Record<ReinforcementSource, string> = {
  teacher: "bg-teal-100 text-teal-700",
  parent: "bg-indigo-100 text-indigo-700",
  system: "bg-slate-100 text-slate-700",
};

export const rewardTypeStyles: Record<ReinforcementRewardType, string> = {
  moral: "bg-sky-100 text-sky-700",
  financial: "bg-emerald-100 text-emerald-700",
  xp: "bg-violet-100 text-violet-700",
  badge: "bg-amber-100 text-amber-700",
};

export const proofTypeStyles: Record<ReinforcementProofType, string> = {
  image: "bg-pink-100 text-pink-700",
  video: "bg-orange-100 text-orange-700",
  document: "bg-cyan-100 text-cyan-700",
  none: "bg-gray-100 text-gray-700",
};

export const scopeStyles: Record<ReinforcementAssignmentScope, string> = {
  school: "bg-slate-100 text-slate-700",
  stage: "bg-indigo-100 text-indigo-700",
  grade: "bg-sky-100 text-sky-700",
  section: "bg-teal-100 text-teal-700",
  classroom: "bg-amber-100 text-amber-700",
  student: "bg-emerald-100 text-emerald-700",
};

export function getProgressLabel(completed: number, total: number) {
  return `${completed}/${total}`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
