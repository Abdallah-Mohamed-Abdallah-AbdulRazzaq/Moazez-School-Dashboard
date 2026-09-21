import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RehireTeacherDialog from "../RehireTeacherDialog";

describe("RehireTeacherDialog", () => {
  it("submits the archived ID and complete profile without identity or lifecycle fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RehireTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/rehire\.archived_teacher_id/), {
      target: { value: "archived-teacher-1" },
    });
    fireEvent.change(screen.getByLabelText(/fields.code/), {
      target: { value: "tch 001" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(arabic\)/), {
      target: { value: "نور" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(english\)/), {
      target: { value: "Nour" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(arabic\)/), {
      target: { value: "علي" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(english\)/), {
      target: { value: "Ali" },
    });
    await user.click(screen.getByLabelText(/fields.gender/));
    await user.click(screen.getByRole("button", { name: "gender.female" }));
    await user.click(screen.getByRole("button", { name: "actions.rehire" }));

    expect(onSubmit).toHaveBeenCalledWith("archived-teacher-1", expect.objectContaining({
      teacherCode: "TCH001",
      gender: "FEMALE",
      preferredDisplayLanguage: "EN",
    }));
    const request = onSubmit.mock.calls[0][1];
    expect(request).not.toHaveProperty("username");
    expect(request).not.toHaveProperty("loginEmail");
    expect(request).not.toHaveProperty("employmentStatus");
  });
});
