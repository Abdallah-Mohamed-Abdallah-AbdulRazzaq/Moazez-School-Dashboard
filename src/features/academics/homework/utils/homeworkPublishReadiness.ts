import type { HomeworkTargetUiModel } from "../services/homeworkApi.types";

export function getHomeworkPublishReadiness(
  targets: HomeworkTargetUiModel[],
) {
  return targets.length > 0
    ? { isReady: true as const }
    : { isReady: false as const, errorKey: "noEligibleTargets" };
}
