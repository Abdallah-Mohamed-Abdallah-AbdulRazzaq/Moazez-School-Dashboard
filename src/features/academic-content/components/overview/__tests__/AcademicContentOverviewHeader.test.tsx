import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OverviewResource } from "../../../hooks/useAcademicContentOverview";
import {
  ACADEMIC_CONTENT_TYPES,
  type AcademicContentType,
} from "../../../types/contracts";
import AcademicContentOverviewHeader from "../AcademicContentOverviewHeader";
import AcademicContentQuickLinks from "../AcademicContentQuickLinks";
import ContentTypeGrid from "../ContentTypeGrid";

const testState = vi.hoisted(() => ({
  canManage: false,
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: testState.push }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.manage" && testState.canManage,
  }),
}));

function totalResource(
  data: number | null,
  error: OverviewResource<number | null>["error"] = null,
): OverviewResource<number | null> {
  return { data, error, isLoading: false, partial: false };
}

function totals(): Record<AcademicContentType, OverviewResource<number | null>> {
  return Object.fromEntries(
    ACADEMIC_CONTENT_TYPES.map((contentType, index) => [
      contentType,
      totalResource(index === 0 ? 0 : index),
    ]),
  ) as Record<AcademicContentType, OverviewResource<number | null>>;
}

describe("academic content overview navigation", () => {
  beforeEach(() => {
    testState.canManage = false;
    testState.push.mockReset();
  });

  it("hides creation without manage permission and never renders prototype copy", () => {
    render(<AcademicContentOverviewHeader yearId="year-1" termId="term-1" />);

    expect(screen.getByRole("heading", { name: "Academic Content Center" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Create content/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Screen 1")).not.toBeInTheDocument();
  });

  it("offers every backend content type with the selected context", () => {
    testState.canManage = true;
    render(<AcademicContentOverviewHeader yearId="year-1" termId="term-1" />);

    const trigger = screen.getByRole("button", { name: /Create content/ });
    for (const contentType of ACADEMIC_CONTENT_TYPES) {
      fireEvent.click(trigger);
      const menu = screen.getByRole("menu");
      expect(within(menu).getAllByRole("menuitem")).toHaveLength(6);
      fireEvent.click(within(menu).getByRole("menuitem", {
        name: new RegExp(contentType.replaceAll("_", " "), "i"),
      }));
      expect(testState.push).toHaveBeenLastCalledWith(
        `/en/academic-content-hub/new?year=year-1&term=term-1&type=${contentType}`,
      );
    }
  });

  it("renders six context-preserving type cards with zero and unavailable totals", () => {
    const overviewTotals = totals();
    overviewTotals.WEEKLY_PLAN = totalResource(null, {
      code: "UNKNOWN_ERROR",
      message: "Weekly total unavailable",
    });
    const onRetryType = vi.fn();

    render(
      <ContentTypeGrid
        yearId="year-1"
        termId="term-1"
        totals={overviewTotals}
        onRetryType={onRetryType}
      />,
    );

    expect(screen.getByText("0 items")).toBeVisible();
    expect(screen.getByText("Unavailable")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /View all/ })).toHaveLength(6);
    expect(screen.getByRole("link", { name: /Teacher preparation.*View all/i })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/preparations?year=year-1&term=term-1",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryType).toHaveBeenCalledWith("WEEKLY_PLAN");
  });

  it("shows the review shortcut only to approvers", () => {
    const { rerender } = render(
      <AcademicContentQuickLinks
        yearId="year-1"
        termId="term-1"
        canApprove={false}
      />,
    );

    expect(screen.queryByRole("link", { name: /Review queue/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Preparation templates/ })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/templates?year=year-1&term=term-1",
    );

    rerender(
      <AcademicContentQuickLinks
        yearId="year-1"
        termId="term-1"
        canApprove
      />,
    );
    expect(screen.getByRole("link", { name: /Review queue/ })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/review?year=year-1&term=term-1",
    );
  });
});
