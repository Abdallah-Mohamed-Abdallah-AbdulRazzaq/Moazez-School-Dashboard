import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import TimetablePrintDialog from "../TimetablePrintDialog";
import { lessonTransferFixture } from "../../services/__tests__/fixtures/lessonTransferFixture";

vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useLocale: () => "en",
    useTranslations: (namespace: string) =>
      createTranslator({ locale: "en", messages: en, namespace }),
  };
});

describe("timetable print options", () => {
  it("switches from the displayed classroom to a compact scope report and applies detail options to native printing", async () => {
    const user = userEvent.setup();
    const fixture = lessonTransferFixture();
    render(
      <TimetablePrintDialog
        open
        onClose={() => undefined}
        locale="en"
        schoolName="School"
        logoUrl="/logo.svg"
        contextName="2026 / Term 1"
        configurationName="Term schedule"
        scopeName="Term"
        status="Draft"
        config={fixture.config}
        entries={fixture.entries}
        classrooms={fixture.classrooms.map((item) => ({
          id: item.id,
          label: item.nameEn,
        }))}
        visibleClassroomIds={["classroom-1"]}
        subjects={[{ id: "math", nameAr: "رياضيات", nameEn: "Math" }]}
        teachers={[{ id: "teacher-1", nameAr: "أحمد", nameEn: "Ahmed" }]}
        rooms={fixture.rooms}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Print 1 classroom" }),
    ).toBeEnabled();
    await user.click(screen.getByLabelText("Classrooms to print"));
    await user.click(
      screen.getByRole("button", {
        name: "All classrooms in this configuration (2)",
      }),
    );
    await user.click(screen.getByLabelText("Layout"));
    await user.click(
      screen.getByRole("button", { name: "Compact report", exact: true }),
    );
    const preview = screen.getByRole("region", { name: "Print preview" });
    expect(within(preview).getAllByRole("table")).toHaveLength(2);
    await user.click(
      screen.getByRole("checkbox", { name: "Include teachers" }),
    );
    expect(within(preview).queryByText("Ahmed")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Print 2 classrooms" }),
    ).toBeEnabled();
    act(() => window.dispatchEvent(new Event("beforeprint")));
    expect(screen.getAllByRole("table", { hidden: true })).toHaveLength(4);
    act(() => window.dispatchEvent(new Event("afterprint")));
    expect(screen.getAllByRole("table", { hidden: true })).toHaveLength(2);
  });
});
