import type {
  HeroJourneyMissionStatus,
  HeroJourneyProgressStatus,
} from "../types";

export const heroJourneyMissionStatusStyles: Record<
  HeroJourneyMissionStatus,
  string
> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-sky-100 text-sky-700",
  archived: "bg-amber-100 text-amber-700",
};

export const heroJourneyProgressStatusStyles: Record<
  HeroJourneyProgressStatus,
  string
> = {
  on_track: "bg-emerald-100 text-emerald-700",
  at_risk: "bg-amber-100 text-amber-700",
  inactive: "bg-slate-100 text-slate-700",
};

export function formatHeroJourneyPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export function canToggleHeroJourneyMissionPublishStatus(
  status: HeroJourneyMissionStatus,
) {
  return status !== "archived";
}
