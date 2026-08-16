import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { isXpPolicyDateRangeValid } from "../XpPolicyForm";
import XpPolicyTable from "../XpPolicyTable";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("XP policy components", () => {
  it.each([
    ["", "", true],
    ["2026-07-01", "", true],
    ["2026-07-01", "2026-07-01", true],
    ["2026-07-01", "2026-07-02", true],
    ["2026-07-02", "2026-07-01", false],
  ])("validates policy date range %s to %s", (startsAt, endsAt, expected) => {
    expect(isXpPolicyDateRangeValid(startsAt, endsAt)).toBe(expected);
  });

  it("renders backend scope/default/null values and does not patch a default policy", () => {
    render(
      <XpPolicyTable
        canManage
        scopeOptions={{
          section: [
            {
              value: "section-1",
              scopeType: "section",
              nameEn: "Section 1",
              nameAr: "الشعبة الأولى",
            },
          ],
        }}
        policies={[{
          id: null,
          academicYearId: "year-1",
          termId: "term-1",
          scopeType: "section",
          scopeKey: "section-1",
          dailyCap: null,
          weeklyCap: 1000,
          cooldownMinutes: null,
          allowedReasons: [],
          startsAt: null,
          endsAt: null,
          isActive: true,
          isDefault: true,
          createdAt: null,
          updatedAt: null,
        }]}
      />,
    );

    expect(screen.getByText(/Section 1/)).toBeInTheDocument();
    expect(screen.getByText("xp.defaultPolicy")).toBeInTheDocument();
    expect(screen.getAllByText(/xp.notSet/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "xp.patchCaps" })).not.toBeInTheDocument();
  });
});
