import type {
  LessonPlan,
  LessonPlanItemStatus,
  ReorderLessonPlanItemCommand,
} from "../services/lessonPlansService";

export function lessonPlanItemAction(status: LessonPlanItemStatus) {
  const actions = {
    IN_PROGRESS: "start",
    DONE: "complete",
    SKIPPED: "skip",
    CANCELLED: "cancel",
  } as const;
  const action = actions[status as keyof typeof actions];
  if (!action)
    throw new Error(`Unsupported lesson plan item transition: ${status}`);
  return action;
}

type LessonPlanItemTransition = Exclude<
  LessonPlanItemStatus,
  "PLANNED" | "UNKNOWN"
>;

const transitions: Record<
  LessonPlanItemStatus,
  readonly LessonPlanItemTransition[]
> = {
  PLANNED: ["IN_PROGRESS", "DONE", "SKIPPED", "CANCELLED"],
  IN_PROGRESS: ["DONE", "SKIPPED", "CANCELLED"],
  DONE: [],
  SKIPPED: [],
  CANCELLED: [],
  RESCHEDULED: [],
  UNKNOWN: [],
};

export function lessonPlanItemTransitions(status: LessonPlanItemStatus) {
  return transitions[status];
}

export function adjacentReorderCommands(
  plan: LessonPlan,
  itemId: string,
  direction: "up" | "down",
): ReorderLessonPlanItemCommand[] {
  const ordered = [...plan.items].sort((left, right) => left.order - right.order);
  const currentIndex = ordered.findIndex((item) => item.id === itemId);
  const targetIndex = currentIndex + (direction === "up" ? -1 : 1);
  const current = ordered[currentIndex];
  const target = ordered[targetIndex];

  if (!current || !target) return [];

  return [
    {
      lessonPlanId: plan.id,
      itemId: current.id,
      payload: { sortOrder: target.order },
    },
    {
      lessonPlanId: plan.id,
      itemId: target.id,
      payload: { sortOrder: current.order },
    },
  ];
}
