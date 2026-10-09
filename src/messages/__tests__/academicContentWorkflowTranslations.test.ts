import { describe, expect, it } from "vitest";
import enMessages from "../en.json";
import arMessages from "../ar.json";

type MessageTree = { [key: string]: string | MessageTree };

function leafPaths(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : leafPaths(value, path);
  });
}

function valueAt(
  tree: MessageTree,
  path: string,
): string | MessageTree | undefined {
  return path
    .split(".")
    .reduce<string | MessageTree | undefined>(
      (value, key) =>
        value && typeof value !== "string" ? value[key] : undefined,
      tree,
    );
}

const sections = [
  "library",
  "editor",
  "workflow_policy",
  "settings_hub",
  "notification_policy",
  "workflow",
  "review",
  "templates",
  "readiness",
  "revisions",
  "publication",
  "general_resource_detail",
  "weekly_plan_detail",
  "guardian_notes",
] as const;
const requiredAcademicContentKeys = [
  "common.unavailable_name",
  "library.options_warning",
  "library.remove_filter",
  "library.results",
  "review.options_warning",
  "review.name_unavailable",
  "review.oldest_first_help",
  "review.more_targets",
  "review.pending_total",
  "templates.eyebrow",
  "templates.total",
  "templates.name_unavailable",
  "editor.indicators.unsaved",
  "editor.indicators.saving",
  "editor.indicators.error",
  "editor.indicators.ready",
  "editor.indicators.blocked",
  "workflow.submit",
  "workflow.resubmit",
  "workflow.latest_decision_note",
  "workflow.history_empty",
  "review.empty_title",
  "review.unavailable_title",
  "review.note_required",
  "review.note_too_long",
  "review.stale_decision",
  "review.revision_mismatch",
  "review.revision_unavailable",
  "review.detail_description",
  "review.decision_description",
  "review.reviewing_revision_number",
  "review.note_help",
  "templates.picker_loading",
  "templates.picker_empty",
  "templates.picker_mismatch",
  "templates.picker_description",
  "templates.choose_another",
  "templates.applied_title",
  "templates.applied_description",
  "templates.delete_title",
  "templates.delete_description",
  "templates.delete_confirm",
  "templates.name_required",
  "templates.name_too_long",
  "templates.description_too_long",
  "templates.topic_too_long",
  "templates.notes_too_long",
  "templates.too_many_items",
  "templates.empty_items",
  "templates.item_too_long",
  "readiness.reasons.read_only",
  "readiness.reasons.title_invalid",
  "readiness.reasons.academic_year_missing",
  "readiness.reasons.term_missing",
  "readiness.reasons.term_year_mismatch",
  "readiness.reasons.term_closed",
  "readiness.reasons.audience_invalid",
  "readiness.reasons.targets_missing",
  "readiness.reasons.subject_target_missing",
  "readiness.reasons.type_detail_missing",
  "revisions.overview",
  "revisions.target_context_loading",
  "revisions.target_context_unavailable",
  "revisions.context_unavailable",
  "revisions.yes",
  "revisions.no",
  "publication.statuses.SCHEDULED",
  "publication.statuses.PUBLISHED",
  "publication.statuses.EXPIRED",
  "publication.statuses.CANCELLED",
  "publication.cancellation_reason",
  "publication.supersedes_publication_id",
  "publication.change_significance",
  "publication.notify_minor_update_audit",
  "publication.cancellation_reasons.UNSCHEDULED",
  "publication.cancellation_reasons.WITHDRAWN",
  "publication.cancellation_reasons.REVISION_STARTED",
  "publication.change_significance_values.MINOR",
  "publication.change_significance_values.SIGNIFICANT",
  "publication.revision_publish_rule_title",
  "publication.revision_publish_rule_description",
  "publication.revision_publish_rule_save_hint",
  "publication.errors.identical_revision",
  "publication.errors.idempotency_conflict",
  "publication.errors.lineage_conflict",
  "publication.errors.not_ready",
  "publication.errors.active_conflict",
  "publication.errors.cannot_unschedule",
  "publication.errors.lifecycle_conflict",
  "publication.errors.validation_failed",
  "publication.errors.unknown",
  "publication.errors.trace_id",
  "publication.success.publish_started",
  "publication.success.scheduled",
  "publication.success.unscheduled",
  "publication.success.withdrawn",
  "publication.success.revision_started",
  "publication.reasons.type_or_audience_unavailable",
  "publication.reasons.source_status_unavailable",
  "publication.reasons.revision_strategy_unavailable",
  "publication.reasons.authoring_incomplete",
  "publication.reasons.term_invalid",
  "publication.reasons.term_ended",
  "publication.reasons.targets_missing",
  "publication.reasons.type_detail_incomplete",
  "publication.reasons.assets_invalid",
  "publication.reasons.active_publication_exists",
  "publication.reasons.online_session_finished_or_missing",
  "publication.reasons.unknown",
] as const;

describe("Academic Content workflow translations", () => {
  it("keeps every content type's messages and interpolation variables in parity", () => {
    const english = enMessages.academic_content as MessageTree;
    const arabic = arMessages.academic_content as MessageTree;
    expect(leafPaths(arabic).sort()).toEqual(leafPaths(english).sort());
    for (const path of leafPaths(english)) {
      const placeholders = (message: string) =>
        [
          ...new Set(
            [...message.matchAll(/\{(\w+)(?:,|\})/g)].map((match) => match[1]),
          ),
        ].sort();
      expect(placeholders(String(valueAt(arabic, path))), path).toEqual(
        placeholders(String(valueAt(english, path))),
      );
    }
  });

  it.each(sections)("keeps %s leaf keys in parity", (section) => {
    const english = enMessages.academic_content[section] as MessageTree;
    const arabic = arMessages.academic_content[section] as MessageTree;

    expect(leafPaths(arabic).sort()).toEqual(leafPaths(english).sort());
    for (const path of leafPaths(english)) {
      expect(valueAt(english, path)).toEqual(expect.any(String));
      expect(valueAt(arabic, path)).toEqual(expect.any(String));
      expect(String(valueAt(english, path)).trim()).not.toBe("");
      expect(String(valueAt(arabic, path)).trim()).not.toBe("");
    }
  });

  it.each(requiredAcademicContentKeys)(
    "defines required copy for %s",
    (path) => {
      expect(valueAt(enMessages.academic_content as MessageTree, path)).toEqual(
        expect.any(String),
      );
      expect(valueAt(arMessages.academic_content as MessageTree, path)).toEqual(
        expect.any(String),
      );
    },
  );
});
