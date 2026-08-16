import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import RecentActivitiesPage from "@/features/dashboard/pages/RecentActivitiesPage";
import { fetchDashboardActivityFeed } from "@/features/dashboard/services/dashboardApiService";
import { dashboardActivityFeedResponse } from "@/features/dashboard/__tests__/dashboardTestFixtures";

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({ isInitializing: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isPermissionsReady: true,
  }),
}));

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchDashboardActivityFeed: vi.fn(),
}));

const mockedFetchDashboardActivityFeed = vi.mocked(fetchDashboardActivityFeed);

describe("RecentActivitiesPage", () => {
  beforeEach(() => {
    mockedFetchDashboardActivityFeed.mockReset();
  });

  it("renders recent activity details and appends the next cursor page", async () => {
    const user = userEvent.setup();
    mockedFetchDashboardActivityFeed
      .mockResolvedValueOnce(
        dashboardActivityFeedResponse({
          pageInfo: {
            limit: 1,
            nextCursor: "cursor-2",
            hasMore: true,
          },
          deferred: {
            readState: "deferred",
          },
        }),
      )
      .mockResolvedValueOnce(
        dashboardActivityFeedResponse({
          items: [
            {
              activityId: "audit:audit-2",
              source: "students",
              eventType: "students.profile.update",
              title: "Student profile updated",
              description: "A student profile was updated.",
              actor: {
                id: "actor-2",
                displayName: "Registrar",
                type: "admin",
              },
              subject: {
                type: "student",
                id: "student-1",
                label: "Mona Ahmed",
              },
              occurredAt: "2026-06-13T09:00:00.000Z",
            },
          ],
          pageInfo: {
            limit: 1,
            nextCursor: null,
            hasMore: false,
          },
        }),
      );

    render(<RecentActivitiesPage />);

    expect(await screen.findByText("Recent activities")).toBeInTheDocument();
    expect(screen.getByText("attendance.session.submit")).toBeInTheDocument();
    expect(screen.getByText("Read state")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /load more/i }));

    expect(mockedFetchDashboardActivityFeed).toHaveBeenLastCalledWith({
      limit: 20,
      cursor: "cursor-2",
    });
    expect(await screen.findByText("Student profile updated")).toBeInTheDocument();
    expect(screen.getByText(/Mona Ahmed/)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /load more/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("renders an honest empty state when the feed has no items", async () => {
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse({ items: [] }),
    );

    render(<RecentActivitiesPage />);

    expect(await screen.findByText("No activity yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Successful audit events will appear here when activity is recorded.",
      ),
    ).toBeInTheDocument();
  });

  it("applies documented filters and resets pagination", async () => {
    const user = userEvent.setup();
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse({
        items: [
          {
            activityId: "audit:audit-filtered",
            source: "attendance",
            eventType: "attendance.session.submit",
            title: "Filtered attendance activity",
            description: "A filtered attendance event was returned.",
            actor: {
              id: "actor-1",
              displayName: "School Admin",
              type: "admin",
            },
            subject: {
              type: "attendance_session",
              id: "session-1",
              label: "Attendance Session",
            },
            occurredAt: "2026-06-13T10:00:00.000Z",
          },
        ],
      }),
    );

    render(<RecentActivitiesPage />);

    expect(await screen.findByText("Recent activities")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Apply filters" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Source" }));
    await user.click(screen.getByRole("button", { name: "Attendance" }));
    await user.click(screen.getByRole("button", { name: "Actor type" }));
    await user.click(screen.getByRole("button", { name: "Admin" }));
    await user.type(
      screen.getByPlaceholderText("Filter by event type"),
      "attendance.session.submit",
    );

    await waitFor(() => {
      expect(mockedFetchDashboardActivityFeed).toHaveBeenLastCalledWith({
        source: "attendance",
        eventType: "attendance.session.submit",
        actorType: "admin",
        limit: 20,
      });
    });
    expect(
      await screen.findByText("Filtered attendance activity"),
    ).toBeInTheDocument();
  });

  it("shows skeleton rows while filter changes are loading", async () => {
    const user = userEvent.setup();
    let resolveFilteredActivities!: (
      activityFeedResponse: ReturnType<typeof dashboardActivityFeedResponse>,
    ) => void;
    const filteredActivitiesPromise = new Promise<
      ReturnType<typeof dashboardActivityFeedResponse>
    >((resolve) => {
      resolveFilteredActivities = resolve;
    });

    mockedFetchDashboardActivityFeed
      .mockResolvedValueOnce(dashboardActivityFeedResponse())
      .mockReturnValueOnce(filteredActivitiesPromise);

    render(<RecentActivitiesPage />);

    expect(await screen.findByText("Recent activities")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Source" }));
    await user.click(screen.getByRole("button", { name: "Attendance" }));

    expect(screen.getByLabelText("Loading recent activities")).toBeInTheDocument();

    await act(async () => {
      resolveFilteredActivities(
        dashboardActivityFeedResponse({
          items: [
            {
              activityId: "audit:audit-filtered-loaded",
              source: "attendance",
              eventType: "attendance.session.submit",
              title: "Filtered activity loaded",
              description: "The filtered activity request has completed.",
              actor: {
                id: "actor-1",
                displayName: "School Admin",
                type: "admin",
              },
              subject: {
                type: "attendance_session",
                id: "session-1",
                label: "Attendance Session",
              },
              occurredAt: "2026-06-13T10:00:00.000Z",
            },
          ],
        }),
      );
    });

    expect(await screen.findByText("Filtered activity loaded")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Loading recent activities"),
    ).not.toBeInTheDocument();
  });

  it("resets active filters to the default activity query", async () => {
    const user = userEvent.setup();
    mockedFetchDashboardActivityFeed.mockResolvedValue(
      dashboardActivityFeedResponse(),
    );

    render(<RecentActivitiesPage />);

    expect(await screen.findByText("Recent activities")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Filter by event type"),
      "attendance.session.submit",
    );
    await waitFor(() => {
      expect(mockedFetchDashboardActivityFeed).toHaveBeenLastCalledWith({
        eventType: "attendance.session.submit",
        limit: 20,
      });
    });

    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    await waitFor(() => {
      expect(mockedFetchDashboardActivityFeed).toHaveBeenLastCalledWith({
        limit: 20,
      });
    });
    expect(screen.getByPlaceholderText("Filter by event type")).toHaveValue("");
  });
});
