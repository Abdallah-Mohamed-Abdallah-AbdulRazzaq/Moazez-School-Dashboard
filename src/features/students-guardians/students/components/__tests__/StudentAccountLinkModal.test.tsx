import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import StudentAccountLinkModal from "@/features/students-guardians/students/components/StudentAccountLinkModal";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

describe("StudentAccountLinkModal", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({
      items: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          fullName: "Student One",
          email: "student.one@school.test",
          loginEmail: "student.one@school.test",
          roleId: "role-student",
          roleName: "Student",
          status: "active",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    });
    apiMocks.apiPost.mockReset().mockResolvedValue({
      studentId: "student-1",
      linked: true,
      user: {
        fullName: "Student One",
        username: "student.one",
        loginEmail: "student.one@school.test",
        contactEmail: null,
        userType: "student",
        roleKey: "student",
        roleName: "Student",
        status: "active",
        hasPassword: true,
        mustChangePassword: false,
      },
    });
  });

  it("submits backend link mode with the selected existing user id", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <StudentAccountLinkModal
          isOpen
          student={{ id: "student-1", full_name_en: "Student One" } as never}
          onClose={vi.fn()}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "fields.mode" }));
    await user.click(
      screen.getByRole("button", { name: "modes.link_existing" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "fields.search_users" }),
      "Student",
    );
    await user.click(
      await screen.findByRole("button", { name: /Student One/ }),
    );
    await user.click(screen.getByRole("button", { name: "actions.submit" }));

    await waitFor(() =>
      expect(apiMocks.apiPost).toHaveBeenCalledWith(
        "/students-guardians/students/student-1/account",
        {
          mode: "link",
          userId: "00000000-0000-4000-8000-000000000002",
        },
      ),
    );
  });
});
