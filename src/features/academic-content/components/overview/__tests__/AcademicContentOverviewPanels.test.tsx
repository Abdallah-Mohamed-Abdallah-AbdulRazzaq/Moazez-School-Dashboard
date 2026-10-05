import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OverviewResource } from "../../../hooks/useAcademicContentOverview";
import type { UpcomingAcademicContentSession } from "../../../model/academicContentOverview";
import type {
  AcademicContentLibraryItem,
  AcademicContentOnlineSessionSummary,
} from "../../../types/contracts";
import RecentlyUpdatedPanel from "../RecentlyUpdatedPanel";
import UpcomingSessionsPanel from "../UpcomingSessionsPanel";
import WorkInProgressPanel from "../WorkInProgressPanel";

function content(
  id: string,
  overrides: Partial<AcademicContentLibraryItem> = {},
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type: "TEACHER_PREPARATION",
    audience: "INTERNAL_STAFF",
    title: id,
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-10-05T08:00:00.000Z",
    updatedAt: "2026-10-05T09:15:00.000Z",
    summary: null,
    ...overrides,
  };
}

function resource<TData>(
  data: TData,
  overrides: Partial<OverviewResource<TData>> = {},
): OverviewResource<TData> {
  return { data, error: null, isLoading: false, partial: false, ...overrides };
}

const defaultActions = { onOpen: vi.fn(), onRetry: vi.fn() };

describe("academic content overview panels", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T10:00:00.000Z"));
    defaultActions.onOpen.mockReset();
    defaultActions.onRetry.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("shows supported work-in-progress fields and a non-blocking partial warning", () => {
    const draft = content("Fractions preparation");
    render(
      <WorkInProgressPanel
        {...defaultActions}
        resource={resource([draft], {
          error: { code: "UNKNOWN_ERROR", message: "Changes unavailable" },
          partial: true,
        })}
      />,
    );

    expect(screen.getByText("Fractions preparation")).toBeVisible();
    expect(screen.getByText("Teacher preparation")).toBeVisible();
    expect(screen.getByText("Draft")).toBeVisible();
    expect(screen.getByText("Some work in progress could not be loaded.")).toBeVisible();
    expect(document.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-10-05T09:15:00.000Z",
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(defaultActions.onOpen).toHaveBeenCalledWith(draft.id);
  });

  it("shows only supported upcoming-session details and states", () => {
    const sessionSummary: AcademicContentOnlineSessionSummary = {
      type: "ONLINE_SESSION",
      platform: "GOOGLE_MEET",
      startAt: "2026-10-05T10:15:00.000Z",
      endAt: "2026-10-05T11:00:00.000Z",
    };
    const sessionContent = content("Problem solving", {
      type: "ONLINE_SESSION",
      description: "Omar Hassan · Grade 5A · secret join URL",
      summary: sessionSummary,
    });
    const session: UpcomingAcademicContentSession = {
      content: sessionContent,
      summary: sessionSummary,
      state: "STARTING_SOON",
    };
    const laterSession: UpcomingAcademicContentSession = {
      content: content("Reading comprehension", {
        type: "ONLINE_SESSION",
        summary: { ...sessionSummary, startAt: "2026-10-05T12:00:00.000Z" },
      }),
      summary: { ...sessionSummary, startAt: "2026-10-05T12:00:00.000Z" },
      state: "UPCOMING",
    };
    render(
      <UpcomingSessionsPanel
        {...defaultActions}
        resource={resource([session, laterSession])}
      />,
    );

    expect(screen.getByText("Problem solving")).toBeVisible();
    expect(screen.getAllByText("Google Meet")).toHaveLength(2);
    expect(screen.getByText("Starting soon")).toBeVisible();
    expect(screen.getByText("Upcoming")).toBeVisible();
    expect(document.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-10-05T10:15:00.000Z",
    );
    expect(screen.queryByText(/Omar Hassan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Grade 5A/)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret join URL/)).not.toBeInTheDocument();
  });

  it("renders recent updates without an Updated By column", () => {
    render(
      <RecentlyUpdatedPanel
        {...defaultActions}
        resource={resource([content("Geometry worksheet", {
          type: "SUBJECT_RESOURCE",
          status: "PUBLISHED",
        })])}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Title" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Content type" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Updated" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    expect(screen.queryByText("Updated By")).not.toBeInTheDocument();
  });

  it("distinguishes loading, empty, and blocking error states with scoped retry", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <WorkInProgressPanel
        onOpen={vi.fn()}
        onRetry={onRetry}
        resource={resource([], { isLoading: true })}
      />,
    );
    expect(screen.getByRole("status")).toBeVisible();

    rerender(
      <WorkInProgressPanel
        onOpen={vi.fn()}
        onRetry={onRetry}
        resource={resource([])}
      />,
    );
    expect(screen.getByText("No work in progress")).toBeVisible();

    rerender(
      <WorkInProgressPanel
        onOpen={vi.fn()}
        onRetry={onRetry}
        resource={resource([], {
          error: { code: "UNKNOWN_ERROR", message: "Unavailable" },
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
