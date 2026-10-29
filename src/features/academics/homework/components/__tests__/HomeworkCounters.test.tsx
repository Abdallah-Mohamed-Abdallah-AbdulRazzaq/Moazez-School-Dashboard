import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import type { HomeworkTargetUiModel } from "../../services/homeworkApi.types";
import HomeworkCounters from "../HomeworkCounters";

vi.unmock("next-intl");

const statuses = ["assigned", "viewed", "submitted", "late", "missing", "reviewed", "excused"] as const;
const targets: HomeworkTargetUiModel[] = statuses.map((status, index) => ({
  targetId: `target-${index}`,
  studentId: `student-${index}`,
  studentName: `Student ${status}`,
  status: status.toUpperCase(),
  viewedAt: "2026-10-20T10:00:00Z",
}));
const counters = { totalTargets: 7, assigned: 1, viewed: 1, submitted: 1, late: 1, missing: 1, reviewed: 1, excused: 1 };

function renderCounters(canViewStudents = true) {
  return render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Cairo">
      <HomeworkCounters counters={counters} targets={targets} canViewStudents={canViewStudents} />
    </NextIntlClientProvider>,
  );
}

describe("HomeworkCounters", () => {
  it.each(statuses)("opens only students currently %s, regardless of past activity", (status) => {
    renderCounters();
    const label = en.academics.homework.counters[status];
    fireEvent.click(screen.getByRole("button", { name: `${label}: 1 — view students` }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(1);
    expect(within(dialog).getByText(`Student ${status}`)).toBeInTheDocument();
  });

  it("shows every target under all students and searches by name or ID", () => {
    renderCounters();
    fireEvent.click(screen.getByRole("button", { name: "All students: 7 — view students" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(7);
    const search = within(dialog).getByRole("textbox", { name: "Search by student name or ID" });
    fireEvent.change(search, { target: { value: " REVIEWED " } });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(1);
    expect(within(dialog).getByText("Student reviewed")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "student-0" } });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(1);
    expect(within(dialog).getByText("Student assigned")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "unknown student" } });
    expect(within(dialog).getByText("No students match your search.")).toBeInTheDocument();
  });

  it("keeps counters visible without allowing student access when permission is absent", () => {
    renderCounters(false);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(8);
    buttons.forEach((button) => expect(button).toBeDisabled());
    fireEvent.click(buttons[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Student assigned")).not.toBeInTheDocument();
  });

  it("switches student statuses inside the dialog and closes with Escape", () => {
    renderCounters();
    fireEvent.click(screen.getByRole("button", { name: "All students: 7 — view students" }));
    fireEvent.click(screen.getByLabelText("Status"));
    fireEvent.click(screen.getByRole("button", { name: "Reviewed", exact: true }));
    const dialog = screen.getByRole("dialog", { name: "Students: Reviewed" });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(1);
    expect(within(dialog).getByText("Student reviewed")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens an empty status with a clear empty state", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Cairo">
        <HomeworkCounters counters={{ totalTargets: 0, assigned: 0 }} targets={[]} canViewStudents />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Assigned: 0 — view students" }));
    expect(within(screen.getByRole("dialog")).getByText("No students in this status.")).toBeInTheDocument();
  });

  it("provides Arabic counter and student list labels", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={ar} timeZone="Africa/Cairo">
        <HomeworkCounters counters={counters} targets={targets} canViewStudents />
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "تمت المراجعة: 1 — عرض الطلاب" }));
    expect(screen.getByRole("dialog", { name: "الطلاب: تمت المراجعة" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "البحث باسم الطالب أو معرّفه" })).toBeInTheDocument();
  });
});
