import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AutomaticCorrectionDialog from "../AutomaticCorrectionDialog";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, number>) =>
    `${key}${values?.count === undefined ? "" : ` ${values.count}`}`,
}));

describe("AutomaticCorrectionDialog", () => {
  it("shows how many submissions were finalized", () => {
    render(
      <AutomaticCorrectionDialog
        isOpen
        scope="filtered"
        eligibleCount={2}
        isPreviewLoading={false}
        isRunning={false}
        progress={null}
        result={{
          results: [],
          failedSubmissionIds: [],
          totals: {
            correctedCount: 2,
            manualCount: 0,
            missingAnswerCount: 0,
            invalidKeyCount: 0,
            studentsProcessed: 2,
            studentsFailed: 0,
            studentsFinalized: 2,
          },
        }}
        onScopeChange={vi.fn()}
        onConfirm={vi.fn()}
        onRetryFailed={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("result.finalized 2")).toBeInTheDocument();
  });
});
