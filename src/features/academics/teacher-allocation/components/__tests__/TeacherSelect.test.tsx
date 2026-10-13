import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TeacherSelect from "../TeacherSelect";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const teacher = {
  id: "teacher-user-1",
  nameAr: "مريم علي",
  nameEn: "Mariam Ali",
  isActive: true,
};

describe("TeacherSelect", () => {
  it.each([
    ["Saved Teacher", "Saved Teacher"],
    [undefined, "assignedTeacherUnavailable"],
  ])(
    "displays a retained assignee missing from candidates with name %s",
    async (selectedTeacherName, label) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TeacherSelect
          teachers={[]}
          value="saved-teacher"
          selectedTeacherName={selectedTeacherName}
          onChange={onChange}
        />,
      );
      expect(
        screen.getByRole("button", { name: "selectTeacher" }),
      ).toHaveTextContent(label);
      await user.click(screen.getByRole("button", { name: "selectTeacher" }));
      await user.click(screen.getByRole("button", { name: label }));
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it("searches both languages and preserves the canonical selected teacher label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const teachers = [
      teacher,
      { id: "other-teacher", nameAr: "أحمد", nameEn: "Ahmed", isActive: true },
    ];
    const { rerender } = render(
      <TeacherSelect teachers={teachers} value={null} onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: "selectTeacher" }));
    await user.type(screen.getByPlaceholderText("searchTeacher"), "مريم");
    expect(
      screen.queryByRole("button", { name: "Ahmed" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mariam Ali" }));
    expect(onChange).toHaveBeenCalledWith("teacher-user-1");
    rerender(
      <TeacherSelect
        teachers={teachers}
        value="teacher-user-1"
        onChange={onChange}
      />,
    );
    expect(
      screen.getByRole("button", { name: "selectTeacher" }),
    ).toHaveTextContent("Mariam Ali");
    expect(
      screen.queryByPlaceholderText("searchTeacher"),
    ).not.toBeInTheDocument();
  });

  it("allows a retained assignee to be cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TeacherSelect
        teachers={[]}
        value="saved-teacher"
        selectedTeacherName="Saved Teacher"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "selectTeacher" }));
    await user.click(screen.getByRole("button", { name: "noTeacher" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
