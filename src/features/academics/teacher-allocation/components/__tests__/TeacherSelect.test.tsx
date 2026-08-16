import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import TeacherSelect from "../TeacherSelect";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("TeacherSelect", () => {
  it("loads active teachers lazily after the dropdown opens", async () => {
    const user = userEvent.setup();
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          id: "teacher-1",
          fullName: "Teacher One",
          email: "teacher@example.com",
          loginEmail: "teacher@example.com",
          roleId: "teacher-role",
          status: "active",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    });

    render(
      <TeacherSelect
        teachers={[]}
        teacherRoleId="teacher-role"
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(apiGet).not.toHaveBeenCalled();
    await user.click(screen.getByRole("combobox"));

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith(
        "/settings/users?page=1&limit=20&roleId=teacher-role&status=active",
      ),
    );
    expect(await screen.findByText("Teacher One")).toBeVisible();
  });
});
