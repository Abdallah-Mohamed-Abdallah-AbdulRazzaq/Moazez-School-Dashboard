import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/features/dashboard/__tests__/dashboardI18nMock";
import ModuleTabDashboardView from "../components/ModuleTabDashboardView";
import type { DashboardModulePage } from "../types/dashboardApi.types";
import type { ReactNode } from "react";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <>{children}</>,
  LineChart: ({ children }: { children?: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children?: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("ModuleTabDashboardView", () => {
  const mockPageData = {
    module: {
      moduleKey: "academics",
      source: "academics",
      title: "Academics",
      description: "Academics Module Description",
      status: "available",
      iconKey: "graduation-cap",
      tone: "info",
      frontendRoute: "/academics",
      sourceRoute: "/academics",
    },
    overview: {
      quickStats: [
        { key: "homework", label: "Homework Pending", value: 5, tone: "info", iconKey: "book-open" },
        { key: "grades", label: "Grades Published", value: 12, tone: "success", iconKey: "book-open" },
      ],
      risks: [
        {
          key: "attendance.low",
          severity: "critical",
          title: "Low attendance rate detected",
          count: 3,
          source: "attendance",
          action: { label: "Review", target: "/attendance/review" },
        },
      ],
      actions: [
        {
          key: "grades.approve",
          priority: "high",
          label: "Approve grades",
          description: "Term 1 grades are pending approval",
          source: "grades",
          action: { label: "Open grades", target: "/grades/approve" },
        },
      ],
    },
    widgets: [
      {
        widgetKey: "academics.homework_today",
        type: "stat-card",
        source: "homework",
        title: "Homework Today",
        subtitle: "Assigned today",
        iconKey: "book-open",
        tone: "info",
        data: { value: 8, unit: null, label: "Homework assigned today" },
        action: null,
        emptyState: null,
        meta: {},
      },
      {
        widgetKey: "reinforcement.tasks",
        type: "progress-card",
        source: "reinforcement",
        title: "Reinforcement Tasks",
        subtitle: "Overall task progress",
        iconKey: "school",
        tone: "success",
        data: {
          value: 75,
          max: 100,
          percent: 75,
          unit: "percent",
          label: "Overall task progress",
          segments: [{ key: "completed", label: "Completed", value: 75 }],
        },
        action: null,
        emptyState: null,
        meta: {},
      },
    ],
    analytics: {
      charts: [
        {
          chartKey: "academics.gpa_trend",
          chartType: "line",
          title: "GPA Trend",
          subtitle: "Class average GPA",
          source: "grades",
          series: ["GPA"],
        },
      ],
      availableData: [
        {
          chartKey: "academics.gpa_trend",
          data: {
            series: [
              {
                key: "gpa",
                label: "GPA",
                points: [
                  { x: "Term 1", y: 3.2, coordinate: {} },
                  { x: "Term 2", y: 3.4, coordinate: {} },
                  { x: "Term 3", y: 3.5, coordinate: {} },
                ],
              },
            ],
            totals: {},
            summary: null,
            empty: false,
          },
        },
      ],
    },
  } as unknown as DashboardModulePage;

  it("renders module identity details, quick stats, risks, next actions, and charts", () => {
    render(<ModuleTabDashboardView pageData={mockPageData} pathname="/en/dashboard" />);

    // Identity
    expect(screen.getByText("Academics")).toBeInTheDocument();
    expect(screen.getByText("Academics Module Description")).toBeInTheDocument();

    // Quick Stats
    expect(screen.getByText("Homework Pending")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Grades Published")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    // Risks
    const riskTitle = screen.getByText("Low attendance rate detected");
    expect(riskTitle).toBeInTheDocument();
    expect(riskTitle.parentElement).toHaveTextContent("Count: 3");

    // Next Actions
    expect(screen.getByText("Approve grades")).toBeInTheDocument();
    expect(screen.getByText("Term 1 grades are pending approval")).toBeInTheDocument();

    // Widgets
    expect(screen.getByText("Homework Today")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Reinforcement Tasks")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    // Charts
    expect(screen.getByText("GPA Trend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("opens the module source route instead of its dashboard route", () => {
    render(
      <ModuleTabDashboardView
        pageData={{
          ...mockPageData,
          module: {
            ...mockPageData.module,
            frontendRoute: "/dashboard/modules/academics",
            sourceRoute: "/attendance/roll-call",
          },
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /open module page/i })).toHaveAttribute(
      "href",
      "/en/attendance/roll-call",
    );
  });
});
