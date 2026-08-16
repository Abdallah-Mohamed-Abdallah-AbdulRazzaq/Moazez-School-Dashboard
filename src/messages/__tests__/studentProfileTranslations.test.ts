import { describe, expect, it } from "vitest";
import en from "../en.json";
import ar from "../ar.json";

function getMessage(messages: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, messages);
}

describe("Student profile translations", () => {
  it("provides the profile empty state in both locales", () => {
    expect(getMessage(en, "students_guardians.profile.no_data")).toBeTruthy();
    expect(getMessage(ar, "students_guardians.profile.no_data")).toBeTruthy();
  });

  it("provides every transfer and withdrawal modal message in both locales", () => {
    const modalPaths = [
      "title",
      "cancel",
      "submit",
      "no_students_found",
      "errors.student_required",
      "errors.type_required",
      "errors.reason_required",
      "errors.date_required",
      "fields.student",
      "fields.search_student",
      "fields.student_id",
      "fields.stage",
      "fields.grade",
      "fields.section",
      "fields.classroom",
      "fields.type",
      "fields.reason",
      "fields.select_reason",
      "fields.effective_date",
      "fields.notes",
      "fields.notes_placeholder",
      "types.transfer",
      "types.withdrawal",
      "reasons.relocation",
      "reasons.financial",
      "reasons.academic",
      "reasons.behavior",
      "reasons.other",
    ];

    for (const path of modalPaths) {
      expect(
        getMessage(en, `students_guardians.modal.${path}`),
      ).toBeTruthy();
      expect(
        getMessage(ar, `students_guardians.modal.${path}`),
      ).toBeTruthy();
    }
  });
});
