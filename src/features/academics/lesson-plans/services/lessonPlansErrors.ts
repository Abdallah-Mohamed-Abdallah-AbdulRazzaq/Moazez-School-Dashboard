import { ApiError } from "@/lib/api-error";

const messages: Record<string, string> = {
  "academics.lesson_plan.not_found": "Lesson plan was not found",
  "academics.lesson_plan.duplicate":
    "A lesson plan already exists for this week",
  "academics.lesson_plan.invalid_scope": "The lesson plan scope is invalid",
  "academics.lesson_plan.closed_term": "Closed terms are read-only",
  "academics.lesson_plan.invalid_date_range":
    "The lesson plan date range is invalid",
  "academics.lesson_plan.holiday_date":
    "Lessons cannot be scheduled on a holiday",
  "academics.lesson_plan.auto_plan_no_curriculum":
    "No curriculum lessons are available for auto-plan",
  "academics.lesson_plan.auto_plan_no_slots":
    "No timetable slots are available for auto-plan",
  "academics.lesson_plan.invalid_timetable_entry":
    "The timetable entry is outside this lesson plan scope",
  "academics.lesson_plan.read_only": "This lesson plan is read-only",
  "academics.lesson_plan.invalid_transition":
    "This lesson plan status change is not allowed",
  "academics.lesson_plan.item_not_found": "Lesson plan item was not found",
  "academics.lesson_plan.invalid_item_scope":
    "The lesson plan item scope is invalid",
  "academics.lesson_plan.item_invalid_transition":
    "This lesson status change is not allowed",
};

export function lessonPlansUiError(error: unknown): string {
  if (error instanceof ApiError) {
    const message = messages[error.code] ?? error.message;
    return error.traceId ? `${message} (trace: ${error.traceId})` : message;
  }
  return error instanceof Error
    ? error.message
    : "Failed to update lesson plans";
}
