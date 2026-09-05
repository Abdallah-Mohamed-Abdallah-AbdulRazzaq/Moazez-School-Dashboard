import { describe, expect, it } from "vitest";
import en from "../en.json";
import ar from "../ar.json";

function getMessage(messages: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, messages);
}

describe("Enrollment translations", () => {
  it("provides every enrollment list and dialog message in both locales", () => {
    const paths = [
      "actions.new_enrollment",
      "actions.title",
      "actions.details",
      "actions.retry",
      "actions.save",
      "actions.transfer",
      "actions.promote",
      "actions.withdraw",
      "status.all",
      "status.active",
      "status.completed",
      "status.withdrawn",
      "dialogs.placement.new_title",
      "dialogs.placement.student",
      "dialogs.placement.stage",
      "dialogs.placement.academic_year",
      "dialogs.placement.grade",
      "dialogs.placement.section",
      "dialogs.placement.classroom",
      "dialogs.placement.enrollment_date",
      "dialogs.placement.validation.stage_required",
      "load_error",
      "errors.placement_conflict",
      "errors.inactive_academic_year",
      "errors.no_active_enrollment",
      "errors.unauthorized",
      "errors.permission_denied",
      "errors.not_found",
      "errors.validation_failed",
      "errors.generic",
      "dialogs.workflow.titles.transfer",
      "dialogs.workflow.titles.withdraw",
      "dialogs.workflow.titles.promote",
      "dialogs.workflow.target_section",
      "dialogs.workflow.target_stage",
      "dialogs.workflow.target_grade",
      "dialogs.workflow.target_classroom",
      "dialogs.workflow.target_academic_year",
      "dialogs.workflow.effective_date",
      "dialogs.workflow.reason",
      "dialogs.workflow.notes_optional",
      "details.aria_label",
      "details.title",
      "details.close",
      "details.unable_to_load",
      "details.overview",
      "details.current_enrollment",
      "details.history",
      "details.history_order",
      "details.no_active_enrollment",
      "details.withdrawn_lifecycle_help",
      "details.no_history",
      "details.fields.status",
      "details.fields.academic_year",
      "details.fields.grade",
      "details.fields.section",
      "details.fields.classroom",
      "details.fields.enrollment_date",
      "details.not_available",
    ];

    for (const path of paths) {
      expect(getMessage(en, `admissions.enrollment.${path}`)).toBeTruthy();
      expect(getMessage(ar, `admissions.enrollment.${path}`)).toBeTruthy();
    }
  });
});
