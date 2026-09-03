import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GuardiansList from "../GuardiansList";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { linkGuardianAccount } from "@/features/students-guardians/services/accountLinkingService";

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
      canManageGuardians: true,
    }),
  }),
);

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchAllGuardians: vi.fn(),
  fetchAllStudents: vi.fn(),
  createGuardian: vi.fn(),
  linkGuardianToStudent: vi.fn(),
}));

vi.mock(
  "@/features/students-guardians/services/accountLinkingService",
  () => ({ linkGuardianAccount: vi.fn() }),
);

vi.mock("@/components/ui/kpi-card/KPICardV2", () => ({
  default: () => null,
}));

vi.mock(
  "@/features/students-guardians/guardians/components/GuardianAccountLinkModal",
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

  it("creates the optional account from the create guardian modal", async () => {
    vi.mocked(studentsService.fetchAllGuardians).mockResolvedValue([] as never);
    vi.mocked(studentsService.fetchAllStudents).mockResolvedValue([] as never);
    vi.mocked(studentsService.createGuardian).mockResolvedValue({
      guardianId: "guardian-1",
      full_name: "Mohamed Hassan",
      relation: "father",
      phone_primary: "+201011990001",
      email: "parent@example.com",
      is_primary: false,
      can_pickup: true,
      can_receive_notifications: true,
    } as never);
    const user = userEvent.setup();

    render(<GuardiansList />);

    await user.click(
      screen.getByRole("button", { name: "actions.create_guardian" }),
    );
    await user.type(
      screen.getByPlaceholderText("full_name_placeholder"),
      "Mohamed Hassan",
    );
    await user.type(
      screen.getByPlaceholderText("email_placeholder"),
      "parent@example.com",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "create_account" }),
    );
    await user.type(
      screen.getByLabelText("account_username"),
      "mohamed.hassan",
    );
    await user.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() => {
      expect(linkGuardianAccount).toHaveBeenCalledWith("guardian-1", {
        mode: "create",
        username: "mohamed.hassan",
        contactEmail: "parent@example.com",
        temporaryPasswordMode: "generate",
      });
    });

    expect(studentsService.createGuardian).toHaveBeenCalledWith(
      expect.not.objectContaining({ account: expect.anything() }),
    );
  });
});
