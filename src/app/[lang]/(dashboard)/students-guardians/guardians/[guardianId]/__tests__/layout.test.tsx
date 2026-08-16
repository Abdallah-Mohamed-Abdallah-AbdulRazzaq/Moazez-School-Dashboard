import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GuardianProfileLayout from "../layout";
import GuardianProfile from "../page";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en", guardianId: "guardian-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useSectionTabs", () => ({
  useSectionTabs: () => ({
    activeTab: "overview",
    entityId: "guardian-1",
    handleTabClick: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    hasAllPermissions: () => true,
    isPermissionsReady: true,
  }),
}));

vi.mock(
  "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities",
  () => ({
    getStudentsGuardiansCapabilities: () => ({
      canManageGuardians: true,
    }),
  }),
);

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchGuardianById: vi.fn(),
  updateGuardian: vi.fn(),
}));

vi.mock(
  "@/features/students-guardians/guardians/components/tabs/OverviewTab",
  () => ({ default: () => <div>guardian-overview</div> }),
);

const guardian = {
  guardianId: "guardian-1",
  full_name: "Mohamed Hassan",
  relation: "father",
  phone_primary: "+201011990001",
  phone_secondary: "+201011990002",
  email: "parent@example.com",
  national_id: "1234567890",
  job_title: "Engineer",
  workplace: "Moazez",
  is_primary: true,
  can_pickup: true,
  can_receive_notifications: true,
};

describe("GuardianProfileLayout", () => {
  it("loads guardian details once across the layout and overview page", async () => {
    vi.mocked(studentsService.fetchGuardianById).mockResolvedValue(guardian);
    render(
      <GuardianProfileLayout>
        <GuardianProfile />
      </GuardianProfileLayout>,
    );

    expect(await screen.findByText("guardian-overview")).toBeInTheDocument();
    expect(studentsService.fetchGuardianById).toHaveBeenCalledTimes(1);
  });

  it("edits the guardian from the routed details header", async () => {
    vi.mocked(studentsService.fetchGuardianById).mockResolvedValue(guardian);
    vi.mocked(studentsService.updateGuardian).mockResolvedValue({
      ...guardian,
      full_name: "Mohamed Updated",
    });

    render(
      <GuardianProfileLayout>
        <div>overview</div>
      </GuardianProfileLayout>,
    );

    expect(
      await screen.findByRole("heading", { name: "Mohamed Hassan" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "actions.edit" }));
    fireEvent.change(screen.getByLabelText(/fields\.full_name/), {
      target: { value: "Mohamed Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));

    await waitFor(() => {
      expect(studentsService.updateGuardian).toHaveBeenCalledWith(
        "guardian-1",
        expect.objectContaining({
          full_name: "Mohamed Updated",
          phone_secondary: "+201011990002",
          national_id: "1234567890",
          is_primary: true,
        }),
      );
    });
    expect(
      await screen.findByRole("heading", { name: "Mohamed Updated" }),
    ).toBeInTheDocument();
  });
});
