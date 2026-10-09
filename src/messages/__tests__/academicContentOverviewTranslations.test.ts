import { describe, expect, it } from "vitest";
import arMessages from "../ar.json";
import enMessages from "../en.json";

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

const requiredKeys = [
  "title",
  "description",
  "create",
  "unavailable",
  "view_all",
  "types.TEACHER_PREPARATION.description",
  "types.WEEKLY_PLAN.description",
  "types.GUARDIAN_WEEKLY_NOTE.description",
  "types.SUBJECT_RESOURCE.description",
  "types.ONLINE_SESSION.description",
  "types.GENERAL_RESOURCE.description",
  "work_in_progress.partial_warning",
  "upcoming_sessions.unavailable_title",
  "recently_updated.columns.actions",
  "quick_links.review_queue",
  "session_states.STARTING_SOON",
  "session_states.UPCOMING",
] as const;

describe("academic content overview translations", () => {
  const english = enMessages.academic_content.overview as MessageTree;
  const arabic = arMessages.academic_content.overview as MessageTree;

  it("keeps English and Arabic leaf keys in parity", () => {
    expect(leafPaths(arabic).sort()).toEqual(leafPaths(english).sort());
  });

  it.each(requiredKeys)("defines non-empty copy for %s", (path) => {
    expect(String(valueAt(english, path)).trim()).not.toBe("");
    expect(String(valueAt(arabic, path)).trim()).not.toBe("");
  });

  it.each(["overview", "all_content"] as const)(
    "defines bilingual shell navigation copy for %s",
    (key) => {
      expect(enMessages.academic_content.shell[key]).toEqual(expect.any(String));
      expect(arMessages.academic_content.shell[key]).toEqual(expect.any(String));
    },
  );
});
