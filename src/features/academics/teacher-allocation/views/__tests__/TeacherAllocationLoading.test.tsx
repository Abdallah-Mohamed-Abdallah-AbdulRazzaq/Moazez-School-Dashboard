import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeacherAllocationView from "../TeacherAllocationView";

const loadingProps: ComponentProps<typeof TeacherAllocationView> = {
  academicYearId: "year-1",
  termId: "term-1",
  academicYears: [],
  terms: [],
  canView: true,
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
  subjects: [],
  subjectAllocations: [],
  teachers: [],
  hasTeacherDirectoryAccess: true,
  teacherAllocations: [],
  isLoading: true,
  apiError: null,
  isSaving: false,
  activeTab: "matrix",
  validationPanelOpen: false,
  isReadOnly: false,
  isTermClosed: false,
  onValidate: vi.fn(),
  onAllocationsChange: vi.fn(),
  onRefresh: vi.fn().mockResolvedValue(undefined),
  onRetry: vi.fn().mockResolvedValue(undefined),
  onTabChange: vi.fn(),
  onCloseValidationPanel: vi.fn(),
};

describe("Teacher Allocation loading", () => {
  it.each(["matrix", "load"] as const)("replaces the %s loading skeleton once data has loaded", (activeTab) => {
    const { rerender } = render(<TeacherAllocationView {...loadingProps} activeTab={activeTab} />);

    expect(screen.getByRole("status", { name: /loading/i })).toHaveAttribute("aria-busy", "true");

    rerender(<TeacherAllocationView {...loadingProps} activeTab={activeTab} isLoading={false} />);

    expect(screen.queryByRole("status", { name: /loading/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /no_grades_or_classrooms.title/i })).toBeInTheDocument();
  });
});
