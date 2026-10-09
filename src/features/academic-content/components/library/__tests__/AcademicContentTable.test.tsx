import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AcademicContentTable from "../AcademicContentTable";
import type {
  AcademicContentLibraryItem,
  AcademicContentLibrarySummary,
  AcademicContentType,
} from "../../../types/contracts";

function contentItem(
  id: string,
  type: AcademicContentType,
  summary: AcademicContentLibrarySummary | null,
): AcademicContentLibraryItem {
  return {
    id,
    academicYearId: "year-1",
    termId: "term-1",
    type,
    audience: "STUDENTS",
    title: `Title ${id}`,
    description: null,
    status: "DRAFT",
    archivedAt: null,
    createdAt: "2026-09-29T08:00:00.000Z",
    updatedAt: "2026-09-29T09:00:00.000Z",
    summary,
  };
}

describe("AcademicContentTable", () => {
  it("renders every type summary and keeps session secrets out of list rows", () => {
    const items = [
      contentItem("prep", "TEACHER_PREPARATION", {
        type: "TEACHER_PREPARATION",
        topic: "Fractions",
      }),
      contentItem("week", "WEEKLY_PLAN", {
        type: "WEEKLY_PLAN",
        weekStartDate: "2026-09-27",
        weekEndDate: "2026-10-01",
      }),
      contentItem("note", "GUARDIAN_WEEKLY_NOTE", {
        type: "GUARDIAN_WEEKLY_NOTE",
        priority: "IMPORTANT",
        requiresAcknowledgement: true,
      }),
      contentItem("resource", "SUBJECT_RESOURCE", {
        type: "SUBJECT_RESOURCE",
        resourceCategory: "WORKSHEET",
      }),
      contentItem("session", "ONLINE_SESSION", {
        type: "ONLINE_SESSION",
        platform: "ZOOM",
        startAt: "2026-09-30T08:00:00.000Z",
        endAt: "2026-09-30T09:00:00.000Z",
      }),
      contentItem("general", "GENERAL_RESOURCE", null),
    ];

    render(
      <AcademicContentTable
        items={items}
        page={1}
        limit={50}
        total={6}
        isLoading={false}
        searchQuery=""
        onOpen={vi.fn()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Fractions")).toBeInTheDocument();
    expect(screen.getByText("Teacher preparation")).toBeInTheDocument();
    expect(screen.getAllByText("Students")).not.toHaveLength(0);
    expect(screen.getByText("Sep 27, 2026 – Oct 1, 2026")).toBeInTheDocument();
    expect(
      screen.getByText(/Important.*Acknowledgement required/),
    ).toBeInTheDocument();
    expect(screen.getByText("Worksheet")).toBeInTheDocument();
    expect(screen.getByText(/Zoom.*Sep 30, 2026/)).toBeInTheDocument();
    expect(screen.getByText("No details yet")).toBeInTheDocument();
    expect(screen.queryByText(/https:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/access code/i)).not.toBeInTheDocument();
  });
});
