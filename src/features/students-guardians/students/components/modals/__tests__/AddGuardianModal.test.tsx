import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("submits account creation details with the guardian", async () => {
    vi.mocked(studentsService.fetchAllStudents).mockResolvedValue([] as never);
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <AddGuardianModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.type(
      screen.getByPlaceholderText("full_name_placeholder"),
      "Mohamed Hassan",
    );
    await user.type(
      screen.getByPlaceholderText("email_placeholder"),
      "parent@example.com",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "create_account" }),
    );
    await user.type(
      screen.getByLabelText("account_username"),
      "mohamed.hassan",
    );
    await user.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        account: {
          username: "mohamed.hassan",
          contactEmail: "parent@example.com",
          temporaryPasswordMode: "generate",
        },
      }),
    );
  });

  it("keeps the temporary password visible after account creation", async () => {
    vi.mocked(studentsService.fetchAllStudents).mockResolvedValue([] as never);
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({
      temporaryPassword: "Guardian!2026",
    });
    const user = userEvent.setup();

    render(<AddGuardianModal isOpen onClose={onClose} onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("full_name_placeholder"),
      "Mohamed Hassan",
    );
    await user.type(
      screen.getByPlaceholderText("email_placeholder"),
      "parent@example.com",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "create_account" }),
    );
    await user.type(
      screen.getByLabelText("account_username"),
      "mohamed.hassan",
    );
    await user.click(screen.getByRole("button", { name: "add" }));

    expect(await screen.findByText("Guardian!2026")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("confirms when the temporary password is copied", async () => {
    vi.mocked(studentsService.fetchAllStudents).mockResolvedValue([] as never);
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({
      temporaryPassword: "Guardian!2026",
    });

    render(<AddGuardianModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("full_name_placeholder"),
      "Mohamed Hassan",
    );
    await user.type(
      screen.getByPlaceholderText("email_placeholder"),
      "parent@example.com",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "create_account" }),
    );
    await user.type(
      screen.getByLabelText("account_username"),
      "mohamed.hassan",
    );
    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(await screen.findByRole("button", { name: "copy_password" }));

    expect(
      screen.getByRole("button", { name: "password_copied" }),
    ).toBeInTheDocument();
  });
});
