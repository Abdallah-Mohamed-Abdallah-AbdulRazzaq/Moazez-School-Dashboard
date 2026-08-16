import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RewardCatalogScopeFields, {
  type RewardCatalogScopeValue,
} from "../RewardCatalogScopeFields";

const academicMocks = vi.hoisted(() => ({ fetchTermsByYear: vi.fn() }));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    fetchTermsByYear: academicMocks.fetchTermsByYear,
  }),
);

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const years = [
  {
    id: "year-1",
    name: "2026/2027",
    nameEn: "2026/2027",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  },
];

function Harness({ initialValue }: { initialValue: RewardCatalogScopeValue }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <RewardCatalogScopeFields
        academicYears={years}
        defaultAcademicYearId="year-1"
        defaultTermId="term-1"
        value={value}
        onChange={setValue}
      />
      <output data-testid="scope">{JSON.stringify(value)}</output>
    </>
  );
}

describe("RewardCatalogScopeFields", () => {
  beforeEach(() => {
    academicMocks.fetchTermsByYear.mockReset().mockResolvedValue([
      {
        id: "term-1",
        name: "Term 1",
        nameEn: "Term 1",
        yearId: "year-1",
        status: "open",
        startDate: "2026-09-01",
        endDate: "2027-01-01",
      },
    ]);
  });

  it("loads terms for the selected academic year", async () => {
    render(
      <Harness
        initialValue={{
          isGlobal: false,
          academicYearId: "year-1",
          termId: "term-1",
        }}
      />,
    );

    await waitFor(() =>
      expect(academicMocks.fetchTermsByYear).toHaveBeenCalledWith("year-1"),
    );
  });

  it("clears both identifiers when global scope is selected", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialValue={{
          isGlobal: false,
          academicYearId: "year-1",
          termId: "term-1",
        }}
      />,
    );

    await user.click(
      screen.getByText("rewardsModule.catalog.form.globalReward"),
    );

    expect(screen.getByTestId("scope")).toHaveTextContent(
      JSON.stringify({ isGlobal: true, academicYearId: null, termId: null }),
    );
  });

  it("shows a localized term load failure without clearing the year", async () => {
    academicMocks.fetchTermsByYear.mockRejectedValue(new Error("failed"));
    render(
      <Harness
        initialValue={{
          isGlobal: false,
          academicYearId: "year-1",
          termId: null,
        }}
      />,
    );

    expect(
      await screen.findByText("rewardsModule.catalog.form.termsLoadFailed"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("scope")).toHaveTextContent("year-1");
  });
});
