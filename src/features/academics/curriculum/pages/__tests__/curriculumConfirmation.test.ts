import { describe, expect, it } from "vitest";
import { curriculumConfirmation } from "../curriculumConfirmation";

describe("curriculumConfirmation", () => {
  it("configures archive as a warning confirmation", () => {
    expect(curriculumConfirmation("archive")).toEqual({
      titleKey: "actions.archive_curriculum",
      descriptionKey: "actions.archive_confirm",
      confirmLabelKey: "actions.archive_curriculum",
      severity: "warning",
    });
  });

  it("configures delete as a danger confirmation", () => {
    expect(curriculumConfirmation("delete")).toEqual({
      titleKey: "actions.delete_curriculum",
      descriptionKey: "actions.delete_confirm",
      confirmLabelKey: "actions.delete_curriculum",
      severity: "danger",
    });
  });
});
