import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LessonPlanValidationPanel from "../LessonPlanValidationPanel";

const localizedIssues: Record<string, string> = {
  missing_planned_lesson: "Localized missing planned lesson",
  missing_planned_date: "Localized missing planned date",
  holiday_planned_item: "Localized holiday planned item",
  outside_term_item: "Localized outside term item",
  duplicate_planned_lesson: "Localized duplicate planned lesson",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    namespace === "academics.lessonPlans.validationIssues"
      ? (localizedIssues[key] ?? key)
      : key,
  useLocale: () => "en",
}));

describe("lesson plan validation panel", () => {
  it("localizes exact backend issue codes and preserves unknown messages", async () => {
    const user = userEvent.setup();
    render(
      <LessonPlanValidationPanel
        validation={{
          termId: "term-1",
          academicYearId: "year-1",
          summary: {
            lessonPlansChecked: 2,
            itemsChecked: 8,
            missingPlannedLessons: 1,
            holidayItems: 1,
            outsideTermItems: 1,
            duplicateLessons: 1,
          },
          issues: [
            ...Object.keys(localizedIssues).map((code, index) => ({
              severity: "warning",
              code,
              message: `Backend message ${index}`,
              itemId: `item-${index}`,
            })),
            {
              severity: "warning",
              code: "future_validation_issue",
              message: "Backend future issue message",
              itemId: "item-unknown",
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /showIssues/i }));
    for (const message of Object.values(localizedIssues)) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(screen.getByText("Backend future issue message")).toBeInTheDocument();
    expect(screen.queryByText("Backend message 0")).not.toBeInTheDocument();
  });
});
