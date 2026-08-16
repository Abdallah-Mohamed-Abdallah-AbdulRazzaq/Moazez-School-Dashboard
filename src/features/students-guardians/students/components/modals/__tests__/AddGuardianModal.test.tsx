import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddGuardianModal from "../AddGuardianModal";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchAllStudents: vi.fn(),
}));

const studentOne = {
  id: "student-1",
  student_id: "STU-001",
  full_name_en: "Adam Hassan",
  status: "Active",
  grade: "Grade 1",
};

const studentTwo = {
  id: "student-2",
  student_id: "STU-002",
  full_name_en: "Sara Ahmed",
  status: "Active",
  grade: "Grade 2",
};

describe("AddGuardianModal", () => {
  it("submits selected student links with guardian data", async () => {
    vi.mocked(studentsService.fetchAllStudents).mockResolvedValue([
      studentOne,
      studentTwo,
    ] as never);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AddGuardianModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByPlaceholderText("full_name_placeholder"), {
      target: { value: "Mohamed Hassan" },
    });
    fireEvent.change(screen.getByPlaceholderText("primary_phone_placeholder"), {
      target: { value: "+201011990001" },
    });
    fireEvent.change(screen.getByPlaceholderText("email_placeholder"), {
      target: { value: "parent@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("student_search_placeholder"), {
      target: { value: "adam" },
    });

    await waitFor(() => {
      expect(screen.getByText("Adam Hassan")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Adam Hassan"));
    fireEvent.change(screen.getByPlaceholderText("student_search_placeholder"), {
      target: { value: "sara" },
    });

    await waitFor(() => {
      expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Sara Ahmed"));
    fireEvent.click(screen.getByLabelText("set_primary_for_student:Sara Ahmed", {
      selector: "button",
    }));
    fireEvent.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Mohamed Hassan",
        phone_primary: "+201011990001",
        email: "parent@example.com",
        selectedStudents: [
          {
            studentId: "student-1",
            label: "Adam Hassan",
            is_primary: false,
          },
          {
            studentId: "student-2",
            label: "Sara Ahmed",
            is_primary: true,
          },
        ],
      }),
    );
  });
});
