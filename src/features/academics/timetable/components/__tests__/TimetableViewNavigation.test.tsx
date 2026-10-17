import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import TimetableViewNavigation from "../TimetableViewNavigation";

vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useLocale: () => "en",
    useTranslations: (namespace: string) =>
      createTranslator({ locale: "en", messages: en, namespace }),
  };
});

function NavigationHarness() {
  const [classroomId, setClassroomId] = useState("a");
  const [query, setQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  return (
    <TimetableViewNavigation
      classrooms={[
        { value: "a", label: "Grade 1 / Alpha" },
        { value: "b", label: "Grade 1 / Beta" },
      ]}
      classroomId={classroomId}
      onClassroomChange={setClassroomId}
      query={query}
      onQueryChange={setQuery}
      matchCount={0}
      matchPosition={0}
      onMatchStep={() => undefined}
      focusMode={focusMode}
      onFocusModeChange={setFocusMode}
      disabled={false}
    />
  );
}

describe("timetable view navigation", () => {
  it("switches adjacent classrooms and searches the classroom picker", async () => {
    const user = userEvent.setup();
    render(<NavigationHarness />);
    expect(
      screen.getByRole("button", { name: "Previous classroom" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next classroom" }));
    expect(screen.getByLabelText("Classroom")).toHaveTextContent("Beta");
    expect(
      screen.getByRole("button", { name: "Next classroom" }),
    ).toBeDisabled();
    await user.click(screen.getByLabelText("Classroom"));
    await user.type(screen.getByLabelText("Search classrooms"), "Alpha");
    await user.click(screen.getByRole("button", { name: "Grade 1 / Alpha" }));
    expect(screen.getByLabelText("Classroom")).toHaveTextContent("Alpha");
  });

  it("clears an unmatched lesson query and toggles focus mode", async () => {
    const user = userEvent.setup();
    render(<NavigationHarness />);
    await user.type(
      screen.getByRole("searchbox", { name: "Find lessons" }),
      "Unknown",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No matching lessons in this scope",
    );
    expect(
      screen.getByRole("button", { name: "Next matching lesson" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Clear lesson search" }),
    );
    expect(screen.getByRole("searchbox")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Focus mode" }));
    expect(
      screen.getByRole("button", { name: "Exit focus mode" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
