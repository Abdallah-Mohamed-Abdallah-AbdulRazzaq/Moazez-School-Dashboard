import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentsGuardiansLayout from "@/app/[lang]/(dashboard)/students-guardians/layout";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/en/students-guardians/students",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock(
  "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext",
  () => ({
    StudentsGuardiansYearTermProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => children,
    useStudentsGuardiansYearTermContext: () => ({
      academicYears: [{ id: "year-1", name: "2026-2027" }],
      terms: [{ id: "term-1", name: "Term 1" }],
      yearId: "year-1",
      termId: "term-1",
      termStatus: "open",
      isLoading: false,
      setYearId: vi.fn(),
      setTermId: vi.fn(),
    }),
  }),
);

describe("StudentsGuardiansLayout", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/en/students-guardians/students";
  });

  it.each([
    "/en/students-guardians",
    "/en/students-guardians/students",
  ])("hides term selection on the year-scoped route %s", (pathname) => {
    navigationMocks.pathname = pathname;

    render(<StudentsGuardiansLayout>content</StudentsGuardiansLayout>);
    fireEvent.click(screen.getByRole("button", { name: /title/ }));

    expect(screen.getByLabelText("academic_year")).toBeInTheDocument();
    expect(screen.queryByLabelText("term")).not.toBeInTheDocument();
  });

  it("keeps term selection on term-scoped student profile routes", () => {
    navigationMocks.pathname = "/en/students-guardians/students/student-1";

    render(<StudentsGuardiansLayout>content</StudentsGuardiansLayout>);
    fireEvent.click(screen.getByRole("button", { name: /title/ }));

    expect(screen.getByLabelText("term")).toBeInTheDocument();
  });
});
