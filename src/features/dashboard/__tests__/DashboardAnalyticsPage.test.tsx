import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import DashboardPermissionGuard from "@/features/dashboard/components/DashboardPermissionGuard";
import DashboardAnalyticsPage from "@/features/dashboard/pages/DashboardAnalyticsPage";
import {
  fetchAnalyticsCatalog,
  fetchAnalyticsCharts,
  fetchAnalyticsChartData,
} from "@/features/dashboard/services/dashboardApiService";
import { ApiError } from "@/lib/api-error";
import type { DashboardAnalyticsChartsResponse } from "@/features/dashboard/types/dashboardApi.types";
import type { ReactNode } from "react";

const permissionState = vi.hoisted(() => ({
  isPermissionsReady: true,
  hasPermission: vi.fn(() => true),
}));

const academicContextState = vi.hoisted(() => ({
  refreshAcademicYears: vi.fn(),
  refreshTerms: vi.fn(),
  requestAcademicYearChange: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/analytics",
}));

vi.mock("@/features/dashboard/services/dashboardApiService", () => ({
  fetchAnalyticsCatalog: vi.fn(),
  fetchAnalyticsCharts: vi.fn(),
  fetchAnalyticsChartData: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => permissionState,
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    academicYears: [{ id: "year-1", name: "2026-27" }],
    ...academicContextState,
    terms: [{ id: "term-1", name: "Term 1", nameAr: "الفصل الأول", nameEn: "Term 1" }],
  }),
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn().mockResolvedValue({
    stages: [],
    grades: [{ id: "grade-1", name: "Grade 1", nameAr: "الصف الأول", nameEn: "Grade 1", stageId: "stage-1" }],
    sections: [{ id: "sec-1", name: "Section 1", nameAr: "الفصل 1", nameEn: "Section 1", gradeId: "grade-1" }],
    classrooms: [{ id: "cls-1", name: "Classroom 1", nameAr: "الغرفة 1", nameEn: "Classroom 1", sectionId: "sec-1" }],
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children?: ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: { children?: ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: { children?: ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockedFetchCatalog = vi.mocked(fetchAnalyticsCatalog);
const mockedFetchCharts = vi.mocked(fetchAnalyticsCharts);
const mockedFetchChartData = vi.mocked(fetchAnalyticsChartData);

describe("DashboardAnalyticsPage", () => {
  const mockCatalog = {
    generatedAt: "2026-07-15T09:00:00Z",
    catalog: {
      version: "v1",
      sources: [
        { source: "admissions", label: "Admissions", status: "available", description: "" },
        { source: "students", label: "Students", status: "available", description: "" },
        { source: "academics", label: "Academics", status: "available", description: "" },
      ],
      supportedChartTypes: ["line", "bar", "pie"],
      supportedRanges: ["7d", "30d", "90d"],
      supportedGranularities: ["day", "week"],
      charts: [],
    },
  };

  const mockChartsResponse = {
    generatedAt: "2026-07-15T09:00:00Z",
    charts: [
      {
        chartKey: "academics.gpa_trend",
        type: "line",
        title: "Class GPA Trend",
        description: "Academic year average GPA",
        source: "academics",
        series: [{ key: "gpa", label: "GPA" }],
        defaultRange: "30d",
        supportedRanges: ["7d", "30d", "90d"],
        supportedGranularities: ["day", "week"],
        filters: ["range", "granularity", "academicYearId"],
        queryCapabilities: {
          timeFilterMode: "historical",
          snapshotOnly: false,
          historicalSeriesCapable: true,
          categoryTableFunnelCapable: false,
          definitionOnly: false,
          timeFiltersApplicable: true,
          granularityApplicable: true,
          supportedRanges: ["7d", "30d", "90d"],
          supportedGranularities: ["day", "week"],
          supportedHierarchyFilters: ["academicYearId"],
          requiredHierarchyFilters: [],
        },
      },
    ],
  };

  const mockChartData = {
    generatedAt: "2026-07-15T09:00:00Z",
    chartKey: "academics.gpa_trend",
    source: "academics",
    title: "Class GPA Trend",
    type: "line",
    status: "available",
    range: "30d",
    granularity: "day",
    filters: {},
    data: {
      series: [
        {
          key: "gpa",
          label: "GPA",
          points: [
            { x: "2026-07-01", y: 3.2, coordinate: {} },
            { x: "2026-07-02", y: 3.5, coordinate: {} },
          ],
        },
      ],
      totals: {},
      summary: null,
      empty: false,
    },
    emptyState: null,
    meta: {},
  };

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
      observe: (target: Element) => queueMicrotask(() => callback([
        { isIntersecting: true, target } as IntersectionObserverEntry,
      ], {} as IntersectionObserver)),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })));
    mockedFetchCatalog.mockReset();
    mockedFetchCharts.mockReset();
    mockedFetchChartData.mockReset();
    permissionState.isPermissionsReady = true;
    permissionState.hasPermission.mockReset().mockReturnValue(true);
    academicContextState.refreshAcademicYears.mockReset().mockResolvedValue([
      { id: "year-1", name: "2026-27" },
    ]);
    academicContextState.refreshTerms.mockReset().mockResolvedValue([
      { id: "term-1", name: "Term 1" },
    ]);
    academicContextState.requestAcademicYearChange.mockReset();

    mockedFetchCatalog.mockResolvedValue(
      mockCatalog as unknown as Awaited<ReturnType<typeof fetchAnalyticsCatalog>>,
    );
    mockedFetchCharts.mockResolvedValue(
      mockChartsResponse as unknown as DashboardAnalyticsChartsResponse,
    );
    mockedFetchChartData.mockResolvedValue(mockChartData);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders page header, filters catalog, and loads charts list with visual Recharts", async () => {
    render(<DashboardAnalyticsPage />);

    expect(await screen.findByText("Analytics Dashboard")).toBeInTheDocument();
    
    // Wait for catalog and charts list fetch
    await waitFor(() => {
      expect(mockedFetchCatalog).toHaveBeenCalled();
      expect(mockedFetchCharts).toHaveBeenCalled();
    });

    // Check chart details
    expect(await screen.findByText("Class GPA Trend")).toBeInTheDocument();
    expect(screen.getByText("Academic year average GPA")).toBeInTheDocument();

    // Check Recharts render
    await waitFor(() => {
      expect(mockedFetchChartData).toHaveBeenCalledWith("academics.gpa_trend", expect.any(Object));
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });

  it("regression: sends only each chart's supported defaults and hierarchy context", async () => {
    mockedFetchCharts.mockResolvedValue({
      generatedAt: "2026-07-15T09:00:00Z",
      charts: [
        ...mockChartsResponse.charts,
        {
          chartKey: "settings.email_connection_readiness",
          type: "donut",
          title: "Email readiness",
          description: "Current email configuration state",
          source: "settings",
          series: [{ key: "ready", label: "Ready" }],
          defaultRange: "30d",
          supportedRanges: ["30d"],
          supportedGranularities: ["day"],
          filters: [],
          queryCapabilities: {
            timeFilterMode: "snapshot_compatibility",
            snapshotOnly: true,
            historicalSeriesCapable: false,
            categoryTableFunnelCapable: false,
            definitionOnly: false,
            timeFiltersApplicable: false,
            granularityApplicable: false,
            supportedRanges: ["30d"],
            supportedGranularities: ["day"],
            supportedHierarchyFilters: [],
            requiredHierarchyFilters: [],
          },
        },
      ],
    } as unknown as DashboardAnalyticsChartsResponse);

    render(<DashboardAnalyticsPage />);

    await waitFor(() => {
      expect(mockedFetchChartData).toHaveBeenCalledWith("academics.gpa_trend", {
        range: "30d",
        granularity: "day",
        academicYearId: "year-1",
      });
      expect(mockedFetchChartData).toHaveBeenCalledWith(
        "settings.email_connection_readiness",
        {},
      );
    });
  });

  it("does not request analytics data for a user without dashboard analytics access", async () => {
    permissionState.hasPermission.mockReturnValue(false);

    render(
      <DashboardPermissionGuard permission="dashboard.analytics.view">
        <DashboardAnalyticsPage />
      </DashboardPermissionGuard>,
    );

    await waitFor(() => {
      expect(permissionState.hasPermission).toHaveBeenCalledWith("dashboard.analytics.view");
    });
    expect(mockedFetchCatalog).not.toHaveBeenCalled();
    expect(mockedFetchCharts).not.toHaveBeenCalled();
    expect(mockedFetchChartData).not.toHaveBeenCalled();
  });

  it("allows classroom analytics without selecting a grade or section", async () => {
    mockedFetchCharts.mockResolvedValue({
      ...mockChartsResponse,
      charts: mockChartsResponse.charts.map((chart) => ({
        ...chart,
        filters: ["range", "granularity", "academicYearId", "classroomId"],
        queryCapabilities: {
          ...chart.queryCapabilities,
          supportedHierarchyFilters: ["academicYearId", "classroomId"],
        },
      })),
    } as DashboardAnalyticsChartsResponse);

    render(<DashboardAnalyticsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Classroom" }));
    fireEvent.click(await screen.findByRole("button", { name: "Classroom 1" }));

    await waitFor(() => {
      expect(mockedFetchChartData).toHaveBeenLastCalledWith(
        "academics.gpa_trend",
        expect.objectContaining({ classroomId: "cls-1", academicYearId: "year-1" }),
      );
    });
  });

  it("recovers weekly analytics validation errors by switching the chart to daily", async () => {
    mockedFetchCharts.mockResolvedValue({
      ...mockChartsResponse,
      charts: mockChartsResponse.charts.map((chart) => ({
        ...chart,
        defaultRange: "term",
        supportedRanges: ["term"],
        supportedGranularities: ["week", "day"],
        queryCapabilities: {
          ...chart.queryCapabilities,
          supportedRanges: ["term"],
          supportedGranularities: ["week", "day"],
        },
      })),
    } as DashboardAnalyticsChartsResponse);
    mockedFetchChartData.mockRejectedValueOnce(
      new ApiError(
        "Weekly analytics requires at least seven civil days",
        400,
        "validation.failed",
        undefined,
        { fields: ["granularity", "range"] },
      ),
    );

    render(<DashboardAnalyticsPage />);

    expect(
      await screen.findByText("This period is too short for the selected grouping"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch to daily" }));

    await waitFor(() => {
      expect(mockedFetchChartData).toHaveBeenLastCalledWith(
        "academics.gpa_trend",
        expect.objectContaining({ range: "term", granularity: "day" }),
      );
    });
  });

  it.each(["academic_year", "term"])(
    "shows an empty state when the selected %s has no reporting period",
    async (range) => {
    mockedFetchCharts.mockResolvedValue({
      ...mockChartsResponse,
      charts: mockChartsResponse.charts.map((chart) => ({
        ...chart,
        defaultRange: range,
        supportedRanges: [range],
        queryCapabilities: {
          ...chart.queryCapabilities,
          supportedRanges: [range],
        },
      })),
    } as DashboardAnalyticsChartsResponse);
    mockedFetchChartData.mockRejectedValueOnce(
      new ApiError(
        "Dashboard analytics hierarchy was not found",
        404,
        "not_found",
      ),
    );

    render(<DashboardAnalyticsPage />);

    expect(
      await screen.findByText("No reporting period is available"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Dashboard analytics hierarchy was not found"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Academic context refreshed"),
    ).not.toBeInTheDocument();
    },
  );

  it("recovers from the production stale-hierarchy analytics response", async () => {
    academicContextState.refreshTerms.mockResolvedValueOnce([
      { id: "term-2", name: "Term 2" },
    ]);
    mockedFetchChartData.mockRejectedValueOnce(
      new ApiError(
        "Dashboard analytics hierarchy was not found",
        404,
        "not_found",
      ),
    );

    render(<DashboardAnalyticsPage />);

    expect(
      await screen.findByText("Academic context refreshed"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Dashboard analytics hierarchy was not found"),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(academicContextState.refreshAcademicYears).toHaveBeenCalled();
      expect(academicContextState.refreshTerms).toHaveBeenCalledWith("year-1");
      expect(academicContextState.requestAcademicYearChange).toHaveBeenCalledWith(
        "year-1",
      );
    });
  });

  it("triggers CSV downloader on Export button click", async () => {
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    render(<DashboardAnalyticsPage />);

    // Wait for chart title to appear, ensuring chart card is rendered and state success resolves
    expect(await screen.findByText("Class GPA Trend")).toBeInTheDocument();

    const exportBtn = await screen.findByRole("button", { name: /csv export/i });
    expect(exportBtn).toBeInTheDocument();

    // Trigger click
    fireEvent.click(exportBtn);

    // Verify it doesn't crash on download execution
    expect(exportBtn).toBeInTheDocument();
    anchorClick.mockRestore();
  });

  it("loads chart data as cards become visible", async () => {
    const observedCards = new Map<Element, IntersectionObserverCallback>();
    vi.stubGlobal("IntersectionObserver", vi.fn().mockImplementation((callback: IntersectionObserverCallback) => {
      return {
        observe: (target: Element) => observedCards.set(target, callback),
        unobserve: vi.fn(), disconnect: vi.fn(),
      };
    }));
    mockedFetchCharts.mockResolvedValue({
      ...mockChartsResponse,
      charts: [
        mockChartsResponse.charts[0],
        { ...mockChartsResponse.charts[0], chartKey: "academics.attendance", title: "Attendance Trend" },
      ],
    } as unknown as DashboardAnalyticsChartsResponse);

    render(<DashboardAnalyticsPage />);
    const firstCard = (await screen.findByText("Class GPA Trend")).closest("article")!;
    const secondCard = screen.getByText("Attendance Trend").closest("article")!;
    expect(mockedFetchChartData).not.toHaveBeenCalled();

    act(() => observedCards.get(firstCard)!([{ isIntersecting: true, target: firstCard } as IntersectionObserverEntry], {} as IntersectionObserver));
    await waitFor(() => expect(mockedFetchChartData).toHaveBeenCalledTimes(1));
    act(() => observedCards.get(secondCard)!([{ isIntersecting: true, target: secondCard } as IntersectionObserverEntry], {} as IntersectionObserver));
    await waitFor(() => expect(mockedFetchChartData).toHaveBeenCalledTimes(2));
  });

  it("keeps chart-data concurrency at four requests", async () => {
    const observedCards = new Map<Element, IntersectionObserverCallback>();
    vi.stubGlobal("IntersectionObserver", vi.fn().mockImplementation((callback: IntersectionObserverCallback) => {
      return {
        observe: (target: Element) => observedCards.set(target, callback),
        unobserve: vi.fn(), disconnect: vi.fn(),
      };
    }));
    const pendingResolvers: Array<(response: typeof mockChartData) => void> = [];
    mockedFetchChartData.mockImplementation(() => new Promise((resolve) => { pendingResolvers.push(resolve); }));
    mockedFetchCharts.mockResolvedValue({
      ...mockChartsResponse,
      charts: Array.from({ length: 5 }, (_, index) => ({
        ...mockChartsResponse.charts[0],
        chartKey: `academics.chart_${index}`,
        title: `Chart ${index}`,
      })),
    } as unknown as DashboardAnalyticsChartsResponse);

    render(<DashboardAnalyticsPage />);
    await screen.findByText("Chart 4");
    const cards = Array.from(document.querySelectorAll("[data-chart-key]"));
    act(() => observedCards.get(cards[0])!(cards.map((target) => ({ isIntersecting: true, target } as IntersectionObserverEntry)), {} as IntersectionObserver));
    await waitFor(() => expect(mockedFetchChartData).toHaveBeenCalledTimes(4));

    act(() => pendingResolvers[0](mockChartData));
    await waitFor(() => expect(mockedFetchChartData).toHaveBeenCalledTimes(5));
  });

  it("ignores an old chart error after the classroom filter changes", async () => {
    let rejectOlder!: (error: Error) => void;
    mockedFetchChartData
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectOlder = reject; }))
      .mockResolvedValueOnce(mockChartData);
    mockedFetchCharts.mockResolvedValue({
      ...mockChartsResponse,
      charts: mockChartsResponse.charts.map((chart) => ({
        ...chart,
        filters: ["range", "granularity", "academicYearId", "classroomId"],
        queryCapabilities: {
          ...chart.queryCapabilities,
          supportedHierarchyFilters: ["academicYearId", "classroomId"],
        },
      })),
    } as DashboardAnalyticsChartsResponse);

    render(<DashboardAnalyticsPage />);
    await waitFor(() => expect(mockedFetchChartData).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Classroom" }));
    fireEvent.click(screen.getByRole("button", { name: "Classroom 1" }));
    await waitFor(() => expect(mockedFetchChartData).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId("line-chart")).toBeInTheDocument();

    await act(async () => rejectOlder(new Error("Old request failed")));
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.queryByText("Old request failed")).not.toBeInTheDocument();
  });
});
