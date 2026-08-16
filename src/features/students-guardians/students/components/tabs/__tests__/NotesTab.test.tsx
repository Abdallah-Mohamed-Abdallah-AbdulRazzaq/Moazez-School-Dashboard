import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotesTab from "../NotesTab";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { renderWithPermissions } from "@/__tests__/test-utils/renderWithPermissions";

vi.mock(
  "@/features/students-guardians/students/services/studentsService",
  () => ({
    fetchStudentNotes: vi.fn(),
    createStudentNote: vi.fn(),
    updateStudentNote: vi.fn(),
  }),
);

describe("NotesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(studentsService.fetchStudentNotes).mockResolvedValue([
      {
        id: "note-1",
        studentId: "student-1",
        date: "2026-07-14T10:00:00.000Z",
        category: "behavior",
        note: "Follow-up required",
        visibility: "guardian_visible",
        created_by: "Teacher One",
      },
    ] as never);
  });

  it("shows backend category and guardian visibility correctly", async () => {
    renderWithPermissions(
      <NotesTab student={{ id: "student-1" } as never} />,
      ["students.notes.view"],
    );

    await waitFor(() => {
      expect(screen.getByText("Follow-up required")).toBeInTheDocument();
    });

    expect(screen.getByText("behavior")).toBeInTheDocument();
    expect(screen.getByText("visible")).toBeInTheDocument();
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
  });
});
