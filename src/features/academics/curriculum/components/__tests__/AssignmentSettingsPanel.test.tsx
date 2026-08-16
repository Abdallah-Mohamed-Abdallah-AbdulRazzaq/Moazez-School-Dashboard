import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AssignmentSettingsPanel from "../AssignmentSettingsPanel";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/input/DateTimePicker", () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="assignment-due-date-time-picker">{label}</div>
  ),
}));

describe("AssignmentSettingsPanel", () => {
  it("uses single title and description controls for homework", () => {
    const onUpdate = vi.fn();
    render(
      <AssignmentSettingsPanel
        assignment={{
          id: "homework-1",
          lessonId: "homework",
          titleAr: "Homework title",
          titleEn: "Homework title",
          descriptionAr: "Homework description",
          descriptionEn: "Homework description",
          maxScore: 10,
        }}
        pointsSummary={{ maxScore: 10, totalPoints: 10, difference: 0, isMatch: true }}
        validationErrors={{}}
        isReadOnly={false}
        detailsInputMode="single"
        onUpdate={onUpdate}
        onAutoDistributePoints={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("assignment_title"), {
      target: { value: "Updated title" },
    });
    fireEvent.change(screen.getByPlaceholderText("description"), {
      target: { value: "Updated description" },
    });

    expect(onUpdate).toHaveBeenNthCalledWith(1, {
      titleAr: "Updated title",
      titleEn: "Updated title",
    });
    expect(onUpdate).toHaveBeenNthCalledWith(2, {
      descriptionAr: "Updated description",
      descriptionEn: "Updated description",
    });
  });

  it("keeps nullable marks empty and exposes backend numeric and text limits", () => {
    const onUpdate = vi.fn();
    const rendered = render(
      <AssignmentSettingsPanel
        assignment={{
          id: "homework-1",
          lessonId: "homework",
          titleAr: "Homework title",
          titleEn: "Homework title",
          descriptionAr: "",
          descriptionEn: "",
          maxScore: null,
        }}
        pointsSummary={{ maxScore: 0, totalPoints: 0, difference: 0, isMatch: true }}
        validationErrors={{}}
        isReadOnly={false}
        detailsInputMode="single"
        onUpdate={onUpdate}
        onAutoDistributePoints={vi.fn()}
      />,
    );

    const title = screen.getByLabelText(/assignment_title/);
    const description = screen.getByLabelText("description");
    const marks = screen.getByLabelText(/max_score/);
    const minutes = screen.getByLabelText("expected_time_minutes");

    expect(title).toHaveAttribute("maxlength", "180");
    expect(description).toHaveAttribute("maxlength", "4000");
    expect(marks).toHaveValue(null);
    expect(marks).toHaveAttribute("min", "0.01");
    expect(marks).toHaveAttribute("step", "0.01");
    expect(minutes).toHaveAttribute("min", "1");
    expect(minutes).toHaveAttribute("step", "1");

    rendered.rerender(
      <AssignmentSettingsPanel
        assignment={{
          id: "homework-1",
          lessonId: "homework",
          titleAr: "Homework title",
          titleEn: "Homework title",
          maxScore: 2,
        }}
        pointsSummary={{ maxScore: 2, totalPoints: 0, difference: -2, isMatch: false }}
        validationErrors={{}}
        isReadOnly={false}
        detailsInputMode="single"
        onUpdate={onUpdate}
        onAutoDistributePoints={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(/max_score/), { target: { value: "" } });
    expect(onUpdate).toHaveBeenLastCalledWith({ maxScore: null });
  });

  it("uses a date-time control for the assignment deadline", () => {
    render(
      <AssignmentSettingsPanel
        assignment={{
          id: "homework-1",
          lessonId: "homework",
          titleAr: "Homework title",
          titleEn: "Homework title",
          descriptionAr: "",
          descriptionEn: "",
          maxScore: 10,
          dueDate: "2026-08-02T09:30:00.000Z",
        }}
        pointsSummary={{ maxScore: 10, totalPoints: 10, difference: 0, isMatch: true }}
        validationErrors={{}}
        isReadOnly={false}
        detailsInputMode="single"
        onUpdate={vi.fn()}
        onAutoDistributePoints={vi.fn()}
      />,
    );

    expect(screen.getByTestId("assignment-due-date-time-picker")).toHaveTextContent("due_date");
  });
});
