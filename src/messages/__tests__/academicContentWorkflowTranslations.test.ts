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

function valueAt(tree: MessageTree, path: string): string | MessageTree | undefined {
  return path.split(".").reduce<string | MessageTree | undefined>(
    (value, key) =>
      value && typeof value !== "string" ? value[key] : undefined,
    tree,
  );
}

const sections = ["workflow_policy", "workflow", "review", "templates"] as const;
const requiredWorkflowKeys = [
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
  "templates.picker_loading",
  "templates.picker_empty",
  "templates.picker_mismatch",
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
] as const;

describe("Academic Content Wave 3 translations", () => {
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

  it.each(requiredWorkflowKeys)("defines required workflow copy for %s", (path) => {
    expect(valueAt(enMessages.academic_content as MessageTree, path)).toEqual(
      expect.any(String),
    );
    expect(valueAt(arMessages.academic_content as MessageTree, path)).toEqual(
      expect.any(String),
    );
  });
});
