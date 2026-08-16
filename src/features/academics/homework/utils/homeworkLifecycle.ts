import type { HomeworkAssignmentUiModel } from "../services/homeworkApi.types";

export type HomeworkLifecycleAction = "publish" | "close" | "cancel";

const ACTIONS_BY_STATUS: Record<
  HomeworkAssignmentUiModel["status"],
  readonly HomeworkLifecycleAction[]
> = {
  draft: ["publish", "cancel"],
  published: ["close", "cancel"],
  closed: [],
  cancelled: [],
  archived: [],
};

export function homeworkLifecycle(status: HomeworkAssignmentUiModel["status"]) {
  return {
    isEditable: status === "draft",
    actions: ACTIONS_BY_STATUS[status],
  };
}
