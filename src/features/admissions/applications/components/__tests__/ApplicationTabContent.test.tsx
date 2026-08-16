import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationTabContent from "@/features/admissions/applications/components/ApplicationTabContent";
import type { Application } from "@/features/admissions/types/admissions";

const applicationServiceMocks = vi.hoisted(() => ({
  fetchApplicationById: vi.fn(),
}));

const registrationApiMocks = vi.hoisted(() => ({
  getApplicationRegistrationHandoff: vi.fn(),
}));

const permissionMocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionMocks.permissions.has(permission),
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/admissions/applications/services/applicationsApiService", () => applicationServiceMocks);
vi.mock("@/features/admissions/applications/api/applicationRegistrationApi", () => registrationApiMocks);
vi.mock("@/features/admissions/applications/components/tabs/DetailsTab", () => ({
  default: () => <section>Details tab</section>,
}));

vi.mock("@/features/admissions/applications/components/tabs/ApplicationReadinessPanel", () => ({
  default: () => <section>Readiness tab</section>,
}));

vi.mock("@/features/admissions/applications/components/tabs/GuardiansTab", () => ({
  default: () => <section>Guardians tab</section>,
}));

vi.mock("@/features/admissions/applications/components/tabs/DocumentsTab", () => ({
  default: () => <section>Documents tab</section>,
}));

vi.mock("@/features/admissions/applications/components/tabs/TestsTab", () => ({
  default: () => <section>Tests tab</section>,
}));

vi.mock("@/features/admissions/applications/components/tabs/InterviewsTab", () => ({
  default: () => <section>Interviews tab</section>,
}));

const application = {
  id: "app-1",
  status: "submitted",
  submittedDate: "2026-01-01T00:00:00.000Z",
  full_name_ar: "Student",
  full_name_en: "Student",
  studentName: "Student",
  gender: "N/A",
  date_of_birth: "2018-01-01",
  nationality: "N/A",
  grade_requested: "Grade 1",
  gradeRequested: "Grade 1",
  guardians: [],
  guardianName: "Guardian",
  guardianPhone: "123",
  guardianEmail: "guardian@example.com",
  documents: [],
  tests: [],
  interviews: [],
  requestedGradeId: "grade-1",
} as Application;

describe("ApplicationTabContent requests", () => {
  beforeEach(() => {
    permissionMocks.permissions = new Set([
      "admissions.applications.view",
      "admissions.applications.manage",
    ]);
    applicationServiceMocks.fetchApplicationById.mockReset().mockResolvedValue(application);
    registrationApiMocks.getApplicationRegistrationHandoff.mockReset().mockResolvedValue({
      applicationId: "app-1",
      wizardDraft: null,
      documents: [],
    });
  });

  it("does not fetch registration handoff for the documents tab", async () => {
    render(<ApplicationTabContent applicationId="app-1" tab="documents" />);

    await screen.findByText("Documents tab");

    expect(applicationServiceMocks.fetchApplicationById).toHaveBeenCalledWith("app-1");
    expect(registrationApiMocks.getApplicationRegistrationHandoff).not.toHaveBeenCalled();
  });

  it("renders readiness as a standalone tab without registration handoff", async () => {
    render(
      <ApplicationTabContent
        applicationId="app-1"
        tab={"readiness" as never}
      />,
    );

    await screen.findByText("Readiness tab");

    expect(applicationServiceMocks.fetchApplicationById).toHaveBeenCalledWith("app-1");
    expect(registrationApiMocks.getApplicationRegistrationHandoff).not.toHaveBeenCalled();
  });

  it("does not request the manage-only handoff for a view-only guardian route", async () => {
    permissionMocks.permissions = new Set(["admissions.applications.view"]);

    render(<ApplicationTabContent applicationId="app-1" tab="guardians" />);

    await waitFor(() =>
      expect(applicationServiceMocks.fetchApplicationById).toHaveBeenCalledWith("app-1"),
    );
    expect(registrationApiMocks.getApplicationRegistrationHandoff).not.toHaveBeenCalled();
  });
});
