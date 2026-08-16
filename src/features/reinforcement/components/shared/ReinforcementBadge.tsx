"use client";

import { useTranslations } from "next-intl";
import type {
  ReinforcementAssignmentScope,
  ReinforcementProofType,
  ReinforcementRewardType,
  ReinforcementSource,
  ReinforcementStatus,
} from "../../types/reinforcement";
import {
  proofTypeStyles,
  rewardTypeStyles,
  scopeStyles,
  sourceStyles,
  statusStyles,
} from "../../utils/reinforcementPresentation";

interface ReinforcementBadgeProps {
  value:
    | ReinforcementStatus
    | ReinforcementSource
    | ReinforcementRewardType
    | ReinforcementProofType
    | ReinforcementAssignmentScope
    | "active"
    | "inactive";
  type: "status" | "source" | "rewardType" | "proofType" | "scope" | "active";
}

const toLabel = (key: string): string =>
  key
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ReinforcementBadge({
  value,
  type,
}: ReinforcementBadgeProps) {
  const t = useTranslations("reinforcement");
  const fallbackLabel = toLabel(String(value || ""));

  const label = () => {
    const namespace =
      type === "scope"
        ? "assignmentScope"
        : type === "active"
          ? "activeState"
          : type;
    const key = `${namespace}.${value}`;
    return typeof t.has !== "function" || t.has(key)
      ? t(key)
      : fallbackLabel || "-";
  };

  const className = () => {
    if (type === "status")
      return statusStyles[value as ReinforcementStatus] || "bg-gray-100 text-gray-700";
    if (type === "source")
      return sourceStyles[value as ReinforcementSource] || "bg-gray-100 text-gray-700";
    if (type === "rewardType")
      return rewardTypeStyles[value as ReinforcementRewardType] || "bg-gray-100 text-gray-700";
    if (type === "proofType")
      return proofTypeStyles[value as ReinforcementProofType] || "bg-gray-100 text-gray-700";
    if (type === "scope")
      return scopeStyles[value as ReinforcementAssignmentScope] || "bg-gray-100 text-gray-700";
    return value === "active"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-100 text-gray-700";
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className()}`}
    >
      {label()}
    </span>
  );
}
