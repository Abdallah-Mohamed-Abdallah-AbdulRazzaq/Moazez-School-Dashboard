import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicsContextLayout from "../AcademicsContextLayout";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";

const contextMocks = vi.hoisted(() => ({
  refreshAcademicYears: vi.fn(),
  refreshTerms: vi.fn(),
  requestAcademicYearChange: vi.fn(),
  requestTermChange: vi.fn(),
  hasPermission: vi.fn(),
}));

const translate = (key: string) => {
  const messages: Record<string, string> = {
    no_years_title: "No academic years yet",
    no_years_description:
      "Create an academic year before using academic modules.",
    no_terms_title: "No terms yet",
    no_terms_description:
      "Create a term before using academic modules.",
    create_year: "Create academic year",
    create_term: "Create term",
    permission_required: "You need academic structure permission to create this.",
  };
  return messages[key] ?? key;
};

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: contextMocks.hasPermission,
  }),
}));

vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  AcademicYearTermLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAcademicYearTermLayoutContext: vi.fn(),
}));

vi.mock("@/features/academics/components/shared/ContextBar", () => ({
  default: () => <div data-testid="context-bar" />,
}));

vi.mock("@/features/academics/components/dialogs/YearTermDialogs", () => ({
  YearDialog: ({
    isOpen,
    onSuccess,
  }: {
    isOpen: boolean;
    onSuccess: () => void | Promise<void>;
  }) =>
    isOpen ? (
      <div role="dialog">
        Create Academic Year Dialog
        <button type="button" onClick={() => void onSuccess()}>
          save year
        </button>
      </div>
    ) : null,
  TermDialog: ({
    isOpen,
    onSuccess,
  }: {
    isOpen: boolean;
    onSuccess: () => void | Promise<void>;
  }) =>
    isOpen ? (
      <div role="dialog">
        Create Term Dialog
        <button type="button" onClick={() => void onSuccess()}>
          save term
        </button>
      </div>
    ) : null,
}));

const mockedUseAcademicYearTermLayoutContext = vi.mocked(
  useAcademicYearTermLayoutContext,
);

const academicYear = {
  id: "year-1",
  name: "2026-2027",
  nameAr: "٢٠٢٦-٢٠٢٧",
  nameEn: "2026-2027",
  startDate: "2026-09-01",
  endDate: "2027-06-30",
  isActive: true,
};

function mockAcademicContext(overrides = {}) {
  mockedUseAcademicYearTermLayoutContext.mockReturnValue({
    academicYearId: "",
    termId: "",
    termStatus: "open",
    academicYears: [],
    terms: [],
    isInitializing: false,
    selectedAcademicYear: null,
    selectedTerm: null,
    changeAcademicYear: vi.fn(),
    changeTerm: vi.fn(),
    refreshAcademicYears: contextMocks.refreshAcademicYears,
    refreshTerms: contextMocks.refreshTerms,
    requestAcademicYearChange: contextMocks.requestAcademicYearChange,
    requestTermChange: contextMocks.requestTermChange,
    setGuardHandlers: vi.fn(),
    contextBarActions: null,
    setContextBarActions: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAcademicYearTermLayoutContext>);
}

describe("AcademicsContextLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contextMocks.hasPermission.mockReturnValue(true);
    contextMocks.refreshAcademicYears.mockResolvedValue([academicYear]);
    contextMocks.refreshTerms.mockResolvedValue([]);
  });

  it("shows a create-year empty state instead of children when no academic years exist", () => {
    mockAcademicContext();

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    expect(screen.getByText("No academic years yet")).toBeInTheDocument();
    expect(screen.getByText("Create academic year")).toBeEnabled();
    expect(screen.queryByText("Academic page content")).not.toBeInTheDocument();
  });

  it("opens the year dialog from the no-years empty state", () => {
    mockAcademicContext();

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create academic year" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Create Academic Year Dialog",
    );
  });

  it("shows a create-term empty state instead of children when the selected year has no terms", () => {
    mockAcademicContext({
      academicYearId: academicYear.id,
      academicYears: [academicYear],
      selectedAcademicYear: academicYear,
    });

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    expect(screen.getByText("No terms yet")).toBeInTheDocument();
    expect(screen.getByText("Create term")).toBeEnabled();
    expect(screen.queryByText("Academic page content")).not.toBeInTheDocument();
  });

  it("opens the term dialog from the no-terms empty state", () => {
    mockAcademicContext({
      academicYearId: academicYear.id,
      academicYears: [academicYear],
      selectedAcademicYear: academicYear,
    });

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create term" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Create Term Dialog");
  });

  it("uses the first available year for the no-terms state while selection is settling", () => {
    mockAcademicContext({
      academicYears: [academicYear],
      selectedAcademicYear: null,
    });

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    expect(screen.getByText("No terms yet")).toBeInTheDocument();
    expect(screen.queryByText("Academic page content")).not.toBeInTheDocument();
  });

  it("disables the empty-state CTA when the user cannot manage academic structure", () => {
    contextMocks.hasPermission.mockReturnValue(false);
    mockAcademicContext();

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    expect(
      screen.getByRole("button", { name: "Create academic year" }),
    ).toBeDisabled();
    expect(
      screen.getByText("You need academic structure permission to create this."),
    ).toBeInTheDocument();
  });

  it("renders children when academic year and term exist", () => {
    mockAcademicContext({
      academicYearId: academicYear.id,
      termId: "term-1",
      academicYears: [academicYear],
      selectedAcademicYear: academicYear,
      terms: [
        {
          id: "term-1",
          yearId: academicYear.id,
          name: "Term 1",
          nameAr: "الفصل الأول",
          nameEn: "Term 1",
          startDate: "2026-09-01",
          endDate: "2027-01-15",
          status: "open",
        },
      ],
    });

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    expect(screen.getByText("Academic page content")).toBeInTheDocument();
    expect(screen.queryByText("No academic years yet")).not.toBeInTheDocument();
    expect(screen.queryByText("No terms yet")).not.toBeInTheDocument();
  });

  it("selects the first refreshed year after creating an academic year", async () => {
    mockAcademicContext();

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create academic year" }));
    fireEvent.click(screen.getByRole("button", { name: "save year" }));

    await waitFor(() => {
      expect(contextMocks.refreshAcademicYears).toHaveBeenCalledTimes(1);
      expect(contextMocks.requestAcademicYearChange).toHaveBeenCalledWith(
        academicYear.id,
      );
    });
  });

  it("refreshes and reselects the current year after creating a term", async () => {
    mockAcademicContext({
      academicYearId: academicYear.id,
      academicYears: [academicYear],
      selectedAcademicYear: academicYear,
    });

    render(
      <AcademicsContextLayout>
        <div>Academic page content</div>
      </AcademicsContextLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create term" }));
    fireEvent.click(screen.getByRole("button", { name: "save term" }));

    await waitFor(() => {
      expect(contextMocks.requestAcademicYearChange).toHaveBeenCalledWith(
        academicYear.id,
      );
    });
  });
});
