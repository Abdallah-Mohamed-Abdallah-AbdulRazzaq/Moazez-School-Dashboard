import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicContextSetupStep } from "../components/steps/AcademicContextSetupStep";

const dialogMocks = vi.hoisted(() => ({
  yearDialog: vi.fn(),
  termDialog: vi.fn(),
}));

vi.mock("@/features/academics/components/dialogs/YearTermDialogs", () => ({
  YearDialog: (props: unknown) => {
    dialogMocks.yearDialog(props);
    return (props as { isOpen: boolean }).isOpen ? <div>Year dialog open</div> : null;
  },
  TermDialog: (props: unknown) => {
    dialogMocks.termDialog(props);
    return (props as { isOpen: boolean }).isOpen ? <div>Term dialog open</div> : null;
  },
}));

const year = {
  id: "year-1",
  name: "2026-2027",
  startDate: "2026-09-01",
  endDate: "2027-06-30",
  isActive: true,
};

const term = {
  id: "term-1",
  name: "Term 1",
  yearId: year.id,
  status: "open" as const,
  startDate: "2026-09-01",
  endDate: "2027-01-15",
};

const copy = {
  summary: "Create the academic year and terms.",
  yearsCount: (count: number) => `${count} years`,
  termsCount: (count: number) => `${count} terms`,
  createdContexts: "Created academic years and terms",
  noTerms: "No terms created yet",
  progressLabel: "Academic context progress",
  progressText: (completed: number, total: number) => `${completed} of ${total} complete`,
  academicYear: "Academic year",
  term: "Term",
  done: "Done",
  remaining: "Remaining",
  createYear: "Create academic year",
  createTerm: "Create term",
};

describe("AcademicContextSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists each created academic year with its terms", () => {
    render(
      <AcademicContextSetupStep
        copy={copy}
        data={{ years: [year], termsByYear: { [year.id]: [term] } }}
        selectedYear={year}
        refreshStep={vi.fn()}
      />,
    );

    const createdContexts = screen.getByRole("list", {
      name: "Created academic years and terms",
    });

    expect(createdContexts).toHaveTextContent("2026-2027");
    expect(createdContexts).toHaveTextContent("Term 1");
    expect(screen.getByRole("progressbar", { name: "Academic context progress" })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
  });

  it("opens YearDialog with existingYears when no academic year exists", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();

    render(
      <AcademicContextSetupStep
        copy={copy}
        data={{ years: [], termsByYear: {} }}
        selectedYear={null}
        refreshStep={refreshStep}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create academic year" }));

    expect(screen.getByText("Year dialog open")).toBeVisible();
    expect(dialogMocks.yearDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        existingYears: [],
        editYear: null,
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("opens TermDialog with the selected year and its existing terms", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();

    render(
      <AcademicContextSetupStep
        copy={copy}
        data={{ years: [year], termsByYear: { [year.id]: [term] } }}
        selectedYear={year}
        refreshStep={refreshStep}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create term" }));

    expect(screen.getByText("Term dialog open")).toBeVisible();
    expect(dialogMocks.termDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        academicYear: year,
        existingTerms: [term],
        editTerm: null,
        onSuccess: expect.any(Function),
      }),
    );
  });
});
