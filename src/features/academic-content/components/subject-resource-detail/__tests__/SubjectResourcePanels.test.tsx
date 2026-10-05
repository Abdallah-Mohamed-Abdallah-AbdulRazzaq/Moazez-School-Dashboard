import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import type { AcademicContentDetailOptions } from "../../../services/academicContentDetailOptions";
import SubjectResourceContextRail from "../SubjectResourceContextRail";
import SubjectResourceHeader from "../SubjectResourceHeader";
import SubjectResourceMetadataStrip from "../SubjectResourceMetadataStrip";

const content = {
  id: "resource-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "SUBJECT_RESOURCE",
  audience: "STUDENTS",
  title: "Fractions worksheet",
  description: "Practice **equivalent fractions**.",
  status: "APPROVED",
  archivedAt: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
  latestPublicationId: "publication-1",
  publicationStatus: "PUBLISHED",
  publishAt: "2026-10-02T08:00:00.000Z",
  visibleFrom: "2026-10-02T08:00:00.000Z",
  visibleUntil: null,
  targets: [],
  assets: [],
  links: [
    {
      id: "link-1",
      label: "Practice guide",
      url: "https://example.com/guide",
      sortOrder: 0,
    },
  ],
  tags: [{ id: "tag-1", value: "Fractions", sortOrder: 0 }],
  details: {
    resourceCategory: "WORKSHEET",
    curriculumId: "curriculum-1",
    curriculumUnitId: "unit-1",
    curriculumLessonId: "lesson-1",
  },
} satisfies Extract<AcademicContentDetail, { type: "SUBJECT_RESOURCE" }>;

const options = {
  curricula: [
    {
      id: "curriculum-1",
      title: "British Curriculum",
      units: [
        {
          id: "unit-1",
          title: "Numbers",
          lessons: [{ id: "lesson-1", title: "Equivalent fractions" }],
        },
      ],
    },
  ],
  lessonPlans: [],
  homeworkAssignments: [],
  assessments: [],
  timetableEntries: [],
} as AcademicContentDetailOptions;

describe("subject resource detail panels", () => {
  it("shows saved contract context without inventing creator data", () => {
    render(
      <SubjectResourceContextRail
        content={content}
        options={options}
        targets={[
          {
            targetId: "target-1",
            subject: "Mathematics",
            scope: "Primary · Grade 4",
            assignedTeacher: null,
          },
        ]}
        targetError={null}
      />,
    );

    expect(screen.getByText("British Curriculum")).toBeVisible();
    expect(
      screen.getByText("Primary · Grade 4", { exact: false }),
    ).toBeVisible();
    expect(screen.getByText("Fractions")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Practice guide" }),
    ).toHaveAttribute("href", "https://example.com/guide");
    expect(screen.queryByText(/created by/i)).toBeNull();
  });

  it("preserves the resource-list query and exposes edit and share actions", () => {
    const onEdit = vi.fn();
    const onShare = vi.fn();
    render(
      <SubjectResourceHeader
        content={content}
        locale="en"
        selectedAsset={null}
        canManage
        onEdit={onEdit}
        onShare={onShare}
        onDownload={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Back to resources" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/subject-resources?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("heading", { name: "Fractions worksheet" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledOnce();
  });

  it("shows the saved audience and resolved academic target", () => {
    render(
      <SubjectResourceMetadataStrip
        content={content}
        selectedAsset={null}
        targets={[
          {
            targetId: "target-1",
            subject: "Mathematics",
            scope: "Primary · Grade 4",
            assignedTeacher: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Students")).toBeVisible();
    expect(screen.getByText("Mathematics · Primary · Grade 4")).toBeVisible();
  });
});
