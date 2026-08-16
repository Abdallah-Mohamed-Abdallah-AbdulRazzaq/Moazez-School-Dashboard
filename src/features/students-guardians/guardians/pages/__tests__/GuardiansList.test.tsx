import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GuardiansList from "../GuardiansList";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ lang: "en" }),
  usePathname: () => "/en/students-guardians/guardians",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock(
  "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext",
  () => ({
    useStudentsGuardiansYearTermContext: () => ({
      yearId: "year-1",
      termId: "term-1",
      isLoading: false,
      error: null,
    }),
  }),
);

vi.mock(
  "@/features/students-guardians/shared/hooks/useUrlQueryState",
  () => ({
    useUrlQueryState: () => ({
      values: { search: "", relation: "all" },
      setValue: vi.fn(),
      replaceValues: vi.fn(),
      reset: vi.fn(),
    }),
  }),
);

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({}),
}));

vi.mock(
  "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities",
  () => ({
    getStudentsGuardiansCapabilities: () => ({
      canLinkGuardianAccount: true,
    }),
  }),
);

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchAllGuardians: vi.fn(),
}));

vi.mock("@/components/ui/kpi-card/KPICardV2", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/students-guardians/guardians/components/GuardianAccountLinkModal",
  () => ({ default: () => null }),
);

vi.mock(
  "@/features/students-guardians/students/components/modals/AddGuardianModal",
  () => ({ default: () => null }),
);

vi.mock(
  "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal",
  () => ({ default: () => null }),
);

describe("GuardiansList", () => {
  it("shows the table loading state on the first frame while guardians are pending", () => {
    vi.mocked(studentsService.fetchAllGuardians).mockReturnValue(
      new Promise(() => {}),
    );

    render(<GuardiansList />);

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("no_guardians")).not.toBeInTheDocument();
  });
});
