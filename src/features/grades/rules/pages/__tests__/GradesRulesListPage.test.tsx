import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchGradeRules: vi.fn(),
  fetchGradesFiltersData: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  usePathname: () => "/en/grades/rules",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/grades/hooks/GradesYearTermLayoutContext", () => ({
  useGradesYearTermLayoutContext: () => ({ academicYearId: "year-1", termId: "term-1", isInitializing: false }),
}));
vi.mock("@/components/ui/toast/Toast", () => ({ useToast: () => ({ showError: vi.fn() }) }));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));
vi.mock("../../services/gradesRulesService", () => ({ fetchGradeRules: mocks.fetchGradeRules }));
vi.mock("@/features/grades/gradebook/services/gradesGradebookService", () => ({
  fetchGradesFiltersData: mocks.fetchGradesFiltersData,
}));

import GradesRulesListPage from "../GradesRulesListPage";

describe("GradesRulesListPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows backend rules in the shared table and opens the selected editor with year and term context", async () => {
    mocks.fetchGradeRules.mockResolvedValue([{ id: "rule-1", scopeType: "grade", passMark: 70, rounding: "DECIMAL_2" }]);
    mocks.fetchGradesFiltersData.mockResolvedValue({ scopeEntities: { school: [], stage: [], grade: [], section: [], classroom: [] } });
    render(<GradesRulesListPage />);

    await userEvent.click(await screen.findByText("70%"));

    expect(mocks.push).toHaveBeenCalledWith("/en/grades/rules/rule-1?year=year-1&term=term-1");
  });

  it("reloads the table with the selected backend scope filters", async () => {
    mocks.fetchGradeRules.mockResolvedValue([]);
    mocks.fetchGradesFiltersData.mockResolvedValue({
      scopeEntities: {
        school: [],
        stage: [],
        grade: [{ id: "grade-1", nameEn: "Grade 1", nameAr: "الصف الأول", scopeType: "grade" }],
        section: [],
        classroom: [],
      },
    });
    render(<GradesRulesListPage />);

    await userEvent.click(await screen.findByLabelText("filters.scopeType"));
    await userEvent.click(screen.getByRole("button", { name: "filters.scopeTypes.grade" }));
    await userEvent.click(await screen.findByLabelText("filters.scope"));
    await userEvent.click(screen.getByRole("button", { name: "Grade 1" }));

    await waitFor(() => expect(mocks.fetchGradeRules).toHaveBeenLastCalledWith(
      "year-1",
      "term-1",
      { scopeType: "grade", scopeId: "grade-1", gradeId: "grade-1" },
    ));
  });
});
