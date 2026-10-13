import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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
  const getBoundingClientRect = vi.spyOn(
    HTMLElement.prototype,
    "getBoundingClientRect",
  );

  beforeAll(() => {
    getBoundingClientRect.mockReturnValue(
      DOMRect.fromRect({ x: 1, y: 1, width: 1, height: 1 }),
    );
  });

  afterAll(() => getBoundingClientRect.mockRestore());

  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it.each([
    ["Saved Teacher", "Saved Teacher"],
    [undefined, "assignedTeacherUnavailable"],
  ])("displays a persisted selection missing from the directory with name %s", (selectedTeacherName, expectedLabel) => {
    const onChange = vi.fn();
    render(<TeacherSelect teachers={[]} teacherRoleId="teacher-role" value="saved-teacher"
      selectedTeacherName={selectedTeacherName} onChange={onChange} />);

    expect(screen.getByRole("combobox")).toHaveTextContent(expectedLabel);
    expect(onChange).not.toHaveBeenCalled();
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("retains the selected lazy-loaded teacher's label after the menu closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "new-teacher", fullName: "New Teacher", email: "teacher@example.com", roleId: "teacher-role", status: "active" }],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    const { rerender } = render(<TeacherSelect teachers={[]} teacherRoleId="teacher-role" value={null} onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("New Teacher"));
    expect(onChange).toHaveBeenCalledWith("new-teacher");
    rerender(<TeacherSelect teachers={[]} teacherRoleId="teacher-role" value="new-teacher" onChange={onChange} />);

    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(screen.getByRole("combobox")).toHaveTextContent("New Teacher");
    rerender(<TeacherSelect teachers={[]} teacherRoleId="teacher-role" value={null} onChange={onChange} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("selectTeacher");
  });

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

  it("appends the next teacher page when the menu is scrolled to the end", async () => {
    const user = userEvent.setup();
    const firstPageTeachers = Array.from({ length: 20 }, (_, index) => ({
      id: `teacher-${index + 1}`,
      fullName: `Teacher ${index + 1}`,
      email: `teacher-${index + 1}@example.com`,
      loginEmail: `teacher-${index + 1}@example.com`,
      roleId: "teacher-role",
      status: "active",
    }));
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        items: firstPageTeachers,
        pagination: { page: 1, limit: 20, total: 21 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "teacher-21",
            fullName: "Teacher 21",
            email: "teacher-21@example.com",
            loginEmail: "teacher-21@example.com",
            roleId: "teacher-role",
            status: "active",
          },
        ],
        pagination: { page: 2, limit: 20, total: 21 },
      });

    render(
      <TeacherSelect
        teachers={[]}
        teacherRoleId="teacher-role"
        value={null}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("Teacher 20")).toBeVisible();

    const scrollContainer = screen.getByRole("listbox").parentElement;
    expect(scrollContainer).not.toBeNull();
    Object.defineProperties(scrollContainer!, {
      scrollHeight: { configurable: true, value: 320 },
      scrollTop: { configurable: true, value: 280 },
      clientHeight: { configurable: true, value: 40 },
    });
    fireEvent.scroll(scrollContainer!);

    expect(await screen.findByText("Teacher 21")).toBeVisible();
  });

  it("allows the selected teacher to be removed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
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
        teachers={[
          {
            id: "teacher-1",
            nameAr: "Teacher One",
            nameEn: "Teacher One",
            subjects: [],
            isActive: true,
          },
        ]}
        teacherRoleId="teacher-role"
        value="teacher-1"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("noTeacher"));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
