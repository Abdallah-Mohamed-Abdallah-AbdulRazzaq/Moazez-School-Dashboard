import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GuardianProfilePage from "../GuardianProfilePage";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";

const { translate } = vi.hoisted(() => ({
  translate: (key: string) => key,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
  useLocale: () => "en",
}));

vi.mock("@/features/students-guardians/students/services/studentsService", () => ({
  fetchGuardianById: vi.fn(),
  updateGuardian: vi.fn(),
}));

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

vi.mock("@/features/students-guardians/guardians/components/tabs/StudentsTab", () => ({
  default: () => <div>students tab</div>,
}));

vi.mock(
  "@/features/students-guardians/guardians/components/GuardianAccountLinkModal",
  () => ({
    default: () => null,
  }),
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

describe("GuardianProfilePage", () => {
  it("opens edit modal and saves guardian updates", async () => {
    vi.mocked(studentsService.fetchGuardianById).mockResolvedValue(guardian);
    vi.mocked(studentsService.updateGuardian).mockResolvedValue({
      ...guardian,
      full_name: "Mohamed Updated",
    });

    render(<GuardianProfilePage guardianId="guardian-1" />);

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
