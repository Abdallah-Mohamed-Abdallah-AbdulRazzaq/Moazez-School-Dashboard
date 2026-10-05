import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../../types/contracts";
import type { TeacherPreparationTargetDisplay } from "../../../model/teacherPreparationDetail";
import TeacherPreparationHeader from "../TeacherPreparationHeader";
import TeacherPreparationSectionNav from "../TeacherPreparationSectionNav";

const content = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  audience: "INTERNAL_STAFF",
  title: "Fractions and Equivalent Fractions",
  description: "Understanding and comparing fractions",
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
  details: null,
} satisfies Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }>;

const targets: TeacherPreparationTargetDisplay[] = [
  {
    targetId: "target-1",
    scope: "Class 4A",
    subject: "Mathematics",
    assignedTeacher: "Mona Ali",
  },
  {
    targetId: "target-2",
    scope: "Grade 9",
    subject: "Science",
    assignedTeacher: null,
  },
];

describe("teacher preparation detail chrome", () => {
  it("shows contract-backed context and preserves the preparations query", () => {
    render(
      <TeacherPreparationHeader
        content={content}
        locale="en"
        academicYearName="2026/2027"
        termName="Term 1"
        targets={targets}
        canSubmit={false}
        showSubmit
        isSubmitting={false}
        submitLabel="Submit for approval"
        submissionHint="Complete readiness requirements"
        onSubmit={vi.fn()}
        lifecycleActions={<button type="button">More actions</button>}
      />,
    );

    expect(screen.getByRole("link", { name: "Back to preparations" })).toHaveAttribute(
      "href",
      "/en/academic-content-hub/preparations?year=year-1&term=term-1",
    );
    expect(screen.getByRole("heading", { name: content.title })).toBeVisible();
    expect(screen.getByText("Assigned teacher: Mona Ali")).toBeVisible();
    expect(screen.getByText("2 targets")).toBeVisible();
    expect(screen.getByRole("button", { name: "Submit for approval" })).toBeDisabled();
    expect(screen.queryByText(/%|minutes/i)).not.toBeInTheDocument();
  });

  it("submits through the injected workflow action", () => {
    const onSubmit = vi.fn();
    render(
      <TeacherPreparationHeader
        content={content}
        locale="en"
        academicYearName="2026/2027"
        termName="Term 1"
        targets={targets.slice(0, 1)}
        canSubmit
        showSubmit
        isSubmitting={false}
        submitLabel="Submit for approval"
        submissionHint="Ready to submit"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit for approval" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("supports accessible desktop and mobile section selection", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TeacherPreparationSectionNav
        activePanel="overview"
        variant="desktop"
        showPublication={false}
        indicators={{ objectives: "unsaved", readiness: "blocked" }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("button", { name: "Publication" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Objectives" }));
    expect(onChange).toHaveBeenCalledWith("objectives");

    rerender(
      <TeacherPreparationSectionNav
        activePanel="references"
        variant="mobile"
        showPublication
        indicators={{}}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Academic references" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Publication" })).toBeVisible();
  });
});
