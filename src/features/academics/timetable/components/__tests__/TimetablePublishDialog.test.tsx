import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetablePublishDialog from "../TimetablePublishDialog";

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const messages = (await import("@/messages/en.json")).default;
  return {
    ...actual,
    useLocale: () => "en",
    useTranslations: (namespace: string) =>
      actual.createTranslator({ locale: "en", messages, namespace }),
  };
});

const context = {
  open: true,
  contextName: "2026/2027 · First term",
  configurationName: "Primary timetable",
  scopeName: "Section: Primary › Grade 1 › Section A",
  classroomCount: 4,
  lessonCount: 35,
};

describe("TimetablePublishDialog", () => {
  it("identifies the whole configuration and lets the user return to review without publishing", async () => {
    const onReview = vi.fn();
    const onConfirm = vi.fn();
    render(
      <TimetablePublishDialog
        {...context}
        loading={false}
        hasWarnings
        onClose={vi.fn()}
        onReview={onReview}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(context.scopeName)).toBeInTheDocument();
    expect(screen.getByText("Primary timetable")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByRole("note")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Review again" }));
    expect(onReview).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("prevents dismissal and repeated actions while publication is pending", () => {
    const onClose = vi.fn();
    render(
      <TimetablePublishDialog
        {...context}
        loading
        hasWarnings={false}
        onClose={onClose}
        onReview={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
