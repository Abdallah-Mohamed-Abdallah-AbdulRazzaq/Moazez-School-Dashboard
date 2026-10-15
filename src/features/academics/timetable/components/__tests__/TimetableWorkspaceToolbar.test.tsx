import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableWorkspaceToolbar from "../TimetableWorkspaceToolbar";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useLocale: () => "en",
    useTranslations: () =>
      createTranslator({
        locale: "en",
        messages: en,
        namespace: "academics.timetable.workspace",
      }),
  };
});

function toolbarProps(): React.ComponentProps<
  typeof TimetableWorkspaceToolbar
> {
  return {
    context: {
      selection: "Classroom 1",
      academicYear: "2026/2027",
      term: "First term",
      configuration: "Grade 1 schedule",
      scope: "Grade 1",
      status: "draft",
      inherited: false,
      readOnly: false,
      dirty: true,
    },
    actions: {
      save: { label: "Save", onClick: vi.fn() },
      validate: { label: "Validate", onClick: vi.fn() },
      generate: { label: "Generate", onClick: vi.fn() },
      publication: { label: "Publish", onClick: vi.fn(), disabled: true },
      settings: [{ value: "periods", label: "Edit periods", onClick: vi.fn() }],
      more: [
        { value: "export", label: "Export", onClick: vi.fn() },
        {
          value: "delete",
          label: "Delete all lessons",
          onClick: vi.fn(),
          tone: "danger",
          disabled: true,
        },
      ],
    },
    density: "comfortable",
    onDensityChange: vi.fn(),
  };
}

describe("timetable workspace toolbar", () => {
  it("keeps context and all actions directly available without menus", async () => {
    const user = userEvent.setup();
    const props = toolbarProps();
    render(<TimetableWorkspaceToolbar {...props} />);
    for (const text of [
      "Classroom 1",
      "2026/2027 · First term",
      "Grade 1 schedule",
      "Unsaved changes",
    ])
      expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(
      screen.getByText("Save your changes before publishing."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(props.actions.save?.onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete all lessons" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(props.actions.more[0].onClick).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Edit periods" }));
    expect(props.actions.settings[0].onClick).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Compact" }));
    expect(props.onDensityChange).toHaveBeenCalledWith("compact");
  });

  it("shows read-only inherited context without exposing unavailable management actions", () => {
    const props = toolbarProps();
    render(
      <TimetableWorkspaceToolbar
        {...props}
        context={{
          ...props.context,
          status: "published",
          inherited: true,
          readOnly: true,
          dirty: false,
        }}
        actions={{
          validate: props.actions.validate,
          settings: [],
          more: [props.actions.more[0]],
        }}
      />,
    );
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Inherited configuration")).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Settings" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate" })).toBeEnabled();
  });
});
