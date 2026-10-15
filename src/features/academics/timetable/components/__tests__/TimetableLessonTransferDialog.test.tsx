import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import TimetableLessonTransferDialog from "../TimetableLessonTransferDialog";
import { lessonTransferFixture } from "../../services/__tests__/fixtures/lessonTransferFixture";
import type { TimetableConflictDisplay } from "../../services/timetableConflictNormalization";

vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useLocale: () => "en",
    useTranslations: (namespace: string) =>
      createTranslator({ locale: "en", messages: en, namespace }),
  };
});

function dialogProps(): React.ComponentProps<
  typeof TimetableLessonTransferDialog
> {
  return {
    input: lessonTransferFixture(),
    subjects: [{ id: "math", nameAr: "الرياضيات", nameEn: "Math" }],
    teachers: [{ id: "teacher-1", nameAr: "أحمد", nameEn: "Ahmed" }],
    configurationName: "Term schedule",
    scopeName: "Term",
    locale: "en",
    classroomName: (classroom) => classroom.nameEn,
    checkConflicts: vi.fn().mockResolvedValue([]),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };
}

async function choosePeriodTwo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("Destination period"));
  await user.click(screen.getByRole("button", { name: /^Period 2/ }));
}

describe("lesson transfer preview", () => {
  it("explains an occupied destination without requesting a conflict check or overwriting it", async () => {
    const user = userEvent.setup();
    const props = dialogProps();
    props.input.entries.push({
      ...props.input.entries[0],
      id: "occupied",
      periodIndex: 2,
    });
    render(<TimetableLessonTransferDialog {...props} />);
    await choosePeriodTwo(user);
    expect(screen.getByRole("alert")).toHaveTextContent("Choose an empty slot");
    expect(
      screen.getByRole("button", { name: "Check destination" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeDisabled();
    expect(props.checkConflicts).not.toHaveBeenCalled();
    expect(props.input.entries).toHaveLength(2);
  });

  it("requires a successful conflict check and invalidates it after destination changes", async () => {
    const user = userEvent.setup();
    const props = dialogProps();
    render(<TimetableLessonTransferDialog {...props} />);
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeDisabled();
    await choosePeriodTwo(user);
    expect(
      screen.getByText("This slot is currently empty."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Math")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Check destination" }));
    await user.click(
      await screen.findByRole("button", { name: "Confirm copy" }),
    );
    expect(props.onConfirm).toHaveBeenCalledWith({
      classroomId: "classroom-1",
      sectionId: "section-1",
      dayKey: "mon",
      periodIndex: 2,
    });
    await user.click(screen.getByLabelText("Destination day"));
    await user.click(screen.getByRole("button", { name: "Tuesday" }));
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeDisabled();
    expect(props.input.entries).toHaveLength(1);
  });

  it("shows backend conflicts and keeps confirmation disabled", async () => {
    const user = userEvent.setup();
    const props = dialogProps();
    props.checkConflicts = vi.fn().mockResolvedValue([
      {
        type: "TEACHER",
        message: "Ahmed teaches another class at 08:45.",
        entryIds: [],
        proposedIndexes: [],
        dayOfWeek: 1,
        severity: "blocking",
      } satisfies TimetableConflictDisplay,
    ]);
    render(<TimetableLessonTransferDialog {...props} />);
    await choosePeriodTwo(user);
    await user.click(screen.getByRole("button", { name: "Check destination" }));
    expect(
      await screen.findByText("Ahmed teaches another class at 08:45."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeDisabled();
  });

  it("does not authorize a changed destination from a late check response", async () => {
    const user = userEvent.setup();
    const props = dialogProps();
    let finishCheck!: (conflicts: TimetableConflictDisplay[]) => void;
    props.checkConflicts = () =>
      new Promise((resolve) => {
        finishCheck = resolve;
      });
    render(<TimetableLessonTransferDialog {...props} />);
    await choosePeriodTwo(user);
    await user.click(screen.getByRole("button", { name: "Check destination" }));
    await user.click(screen.getByLabelText("Destination day"));
    await user.click(screen.getByRole("button", { name: "Tuesday" }));
    await act(async () => {
      finishCheck([]);
    });
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeDisabled();
    expect(
      screen.queryByText(/No conflicts found in this check/),
    ).not.toBeInTheDocument();
  });

  it("retains the draft after a failed check and allows retrying", async () => {
    const user = userEvent.setup();
    const props = dialogProps();
    props.checkConflicts = vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce([]);
    render(<TimetableLessonTransferDialog {...props} />);
    await choosePeriodTwo(user);
    await user.click(screen.getByRole("button", { name: "Check destination" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not complete the conflict check",
    );
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Check destination" }));
    expect(
      await screen.findByText(/No conflicts found in this check/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm copy" })).toBeEnabled();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});
