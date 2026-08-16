import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("@/lib/api", () => api);

import {
  getApplicationRegistrationHandoff,
  previewApplicationEnrollment,
  registerApplication,
} from "../applicationRegistrationApi";

describe("application registration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.apiGet.mockResolvedValue({ applicationId: "app-1", eligible: true });
    api.apiPost.mockResolvedValue({ applicationId: "app-1", eligible: true });
  });

  it("uses the preview and handoff endpoints", async () => {
    await previewApplicationEnrollment("app-1");
    await getApplicationRegistrationHandoff("app-1");
    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/enroll",
      {},
    );
    expect(api.apiGet).toHaveBeenCalledWith(
      "/admissions/applications/app-1/registration-handoff",
    );
  });

  it("binds registration to the route application id", async () => {
    const payload = {
      student: {
        name: "Omar Ahmed",
        dateOfBirth: "2017-05-10",
        gender: "male",
        nationality: "Egyptian",
        status: "active",
      },
      guardians: [
        {
          profile: {
            full_name: "Ahmed Mostafa",
            relation: "father",
            phone_primary: "+201001112233",
          },
          relationship: { is_primary: true },
          account: { mode: "none" as const },
        },
      ],
      enrollment: {
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-01",
        status: "active",
      },
      studentAccount: { mode: "none" as const },
    };
    await registerApplication("app-1", payload);
    expect(api.apiPost).toHaveBeenCalledWith(
      "/admissions/applications/app-1/register",
      payload,
    );
  });
});

