import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useApplicationRegistration } from "@/features/admissions/applications/hooks/useApplicationRegistration";

const registrationApiMocks = vi.hoisted(() => ({
  getApplicationRegistrationHandoff: vi.fn(),
  previewApplicationEnrollment: vi.fn(),
  registerApplication: vi.fn(),
}));

const structureMocks = vi.hoisted(() => ({
  fetchAcademicStructureTree: vi.fn(),
}));

vi.mock("@/features/admissions/applications/api/applicationRegistrationApi", () => registrationApiMocks);
vi.mock("@/features/academics/services/academicStructureApiService", () => structureMocks);

describe("useApplicationRegistration", () => {
  beforeEach(() => {
    registrationApiMocks.getApplicationRegistrationHandoff.mockReset().mockResolvedValue({
      applicationId: "app-1",
      status: "accepted",
      eligible: true,
      alreadyRegistered: false,
      wizardDraft: {
        student: { full_name_en: "Omar Ahmed" },
        guardians: [],
        enrollment: {
          academicYearId: "year-1",
          gradeId: "grade-1",
          sectionId: null,
          classroomId: null,
          termId: "term-1",
          enrollmentDate: null,
          status: "active",
        },
        studentAccount: { mode: "none" },
      },
      documents: [],
      registered: null,
      warnings: [],
      missingRequiredForRegistration: [],
    });
    registrationApiMocks.previewApplicationEnrollment.mockReset().mockResolvedValue({
      applicationId: "app-1",
      eligible: true,
      handoff: {
        studentDraft: { fullName: "Omar Ahmed" },
        guardianDrafts: [],
        enrollmentDraft: {
          requestedAcademicYearId: "year-1",
          requestedAcademicYearName: "2026",
          requestedGradeId: "grade-1",
          requestedGradeName: "Grade 1",
        },
      },
    });
    registrationApiMocks.registerApplication.mockReset();
    structureMocks.fetchAcademicStructureTree.mockReset().mockResolvedValue({
      grades: [],
      sections: [],
      classrooms: [],
    });
  });

  it("loads registration context from the registration handoff without the legacy enroll preview", async () => {
    const { result } = renderHook(() =>
      useApplicationRegistration({
        applicationId: "app-1",
        studentName: "Omar Ahmed",
        academicYearId: "year-1",
        termId: "term-1",
        enabled: true,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(registrationApiMocks.getApplicationRegistrationHandoff).toHaveBeenCalledWith("app-1");
    expect(registrationApiMocks.previewApplicationEnrollment).not.toHaveBeenCalled();
    expect(result.current.form.gradeId).toBe("grade-1");
  });
});
