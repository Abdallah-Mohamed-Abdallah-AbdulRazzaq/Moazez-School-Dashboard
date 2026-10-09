import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import WeeklyPlanContextRail from "../WeeklyPlanContextRail";

const content = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "WEEKLY_PLAN",
  audience: "STUDENTS",
  title: "The Solar System",
  description: null,
  status: "PUBLISHED",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  latestPublicationId: "publication-1",
  publicationStatus: "PUBLISHED",
  publishAt: "2026-10-05T08:00:00.000Z",
  visibleFrom: "2026-10-05T08:00:00.000Z",
  visibleUntil: null,
  targets: [],
  assets: [
    {
      assetId: "asset-1",
      fileId: "file-1",
      originalName: "plan.pdf",
      mimeType: "application/pdf",
      sizeBytes: "1024",
      sortOrder: 0,
      createdAt: "2026-10-05T08:00:00.000Z",
    },
  ],
  links: [],
  tags: [],
  details: {
    weekStartDate: "2026-10-05",
    weekEndDate: "2026-10-09",
    objectives: [],
    topics: ["The Sun"],
    expectedHomework: null,
    upcomingAssessments: null,
    notes: null,
    homeworkAssignmentIds: [],
    gradeAssessmentIds: [],
  },
} satisfies Extract<AcademicContentDetail, { type: "WEEKLY_PLAN" }>;

describe("WeeklyPlanContextRail", () => {
  it("shows backend readiness, publication, topics, and attachments without a percentage", () => {
    render(
      <WeeklyPlanContextRail
        content={content}
        readiness={{ canAdvance: true, blockingReasons: [] }}
        targets={[]}
        targetError={null}
        onRefreshReadiness={vi.fn()}
      />,
    );

    expect(screen.getByText("Ready to advance")).toBeVisible();
    expect(screen.getByText("Published")).toBeVisible();
    expect(screen.getByText("The Sun")).toBeVisible();
    expect(screen.getByText("plan.pdf")).toBeVisible();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/created by/i)).toBeNull();
  });
});
