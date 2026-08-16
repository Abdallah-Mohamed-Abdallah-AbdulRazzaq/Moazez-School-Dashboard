"use client";

import { useTranslations } from "next-intl";
import type {
  HeroJourneyMissionStatus,
  HeroJourneyProgressStatus,
} from "../types";
import {
  heroJourneyMissionStatusStyles,
  heroJourneyProgressStatusStyles,
} from "../utils/heroJourneyPresentation";

interface HeroJourneyStatusPillProps {
  kind: "mission" | "progress";
  value: HeroJourneyMissionStatus | HeroJourneyProgressStatus;
}

export default function HeroJourneyStatusPill({
  kind,
  value,
}: HeroJourneyStatusPillProps) {
  const t = useTranslations("heroJourney");
  const className =
    kind === "mission"
      ? heroJourneyMissionStatusStyles[value as HeroJourneyMissionStatus]
      : heroJourneyProgressStatusStyles[value as HeroJourneyProgressStatus];
  const label =
    kind === "mission"
      ? t(`status.${value as HeroJourneyMissionStatus}`)
      : t(`progressStatus.${value as HeroJourneyProgressStatus}`);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
