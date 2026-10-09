import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeacherPreparationTargetDisplay } from "../../../model/teacherPreparationDetail";
import type { AcademicContentDetail } from "../../../types/contracts";
import WeeklyPlanHeader from "../WeeklyPlanHeader";
import WeeklyPlanSectionNav from "../WeeklyPlanSectionNav";

const content = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "WEEKLY_PLAN",
  audience: "STUDENTS",
  title: "The Solar System",
  description: "Weekly plan",
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  latestPublicationId: null,
  publicationStatus: null,
  publishAt: null,
  visibleFrom: null,
  visibleUntil: null,
  targets: [],
  assets: [],
  links: [],
  tags: [],
  details: {
    weekStartDate: "2026-10-05",
    weekEndDate: "2026-10-09",
    objectives: [],
    topics: [],
    expectedHomework: null,
    upcomingAssessments: null,
    notes: null,
    homeworkAssignmentIds: [],
    gradeAssessmentIds: [],
  },
} satisfies Extract<AcademicContentDetail, { type: "WEEKLY_PLAN" }>;

const targets: TeacherPreparationTargetDisplay[] = [
  {
    targetId: "target-1",
    scope: "Grade 5 - B",
    subject: "Science",
    assignedTeacher: null,
  },
];

describe("weekly plan detail chrome", () => {
  it("shows saved contract context and preserves the weekly plans query", () => {
    render(
      <WeeklyPlanHeader content={content} locale="en" targets={targets} />,
    );

    expect(
      screen.getByRole("link", { name: "Back to Weekly Plans" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/weekly-plans?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("heading", { name: "The Solar System" }),
    ).toBeVisible();
    expect(screen.getByText("Science")).toBeVisible();
    expect(screen.getByText("Grade 5 - B")).toBeVisible();
    expect(screen.getByText("Students")).toBeVisible();
  });

  it("shows the contract fallback when week dates are unavailable", () => {
    render(
      <WeeklyPlanHeader
        content={{ ...content, details: null }}
        locale="en"
        targets={targets}
      />,
    );

    expect(screen.getByText("Week not set")).toBeVisible();
  });

  it("exposes responsive navigation without unsupported sections", () => {
    const onChange = vi.fn();
    render(
      <WeeklyPlanSectionNav
        activePanel="details"
        variant="desktop"
        showPublication={false}
        indicators={{ objectives: "unsaved" }}
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Plan details" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Publication" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /daily breakdown/i }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Topics" }));
    expect(onChange).toHaveBeenCalledWith("topics");
  });
});
