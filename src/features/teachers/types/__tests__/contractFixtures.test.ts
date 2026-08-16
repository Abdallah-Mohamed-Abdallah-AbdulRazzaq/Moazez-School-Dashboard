import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  CreateTeacherRequest,
  TeacherDirectoryDetail,
  TeacherEmploymentStatusResponse,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

const teacherDetailResponse = {
  id: "b90701ef-e774-4b2f-85d3-623437c4222d",
  userId: "28c5beef-b78e-41de-8961-7f0824caa9e0",
  loginEmail: "ahmed6@school.edu",
  username: "ahmed6",
  contactEmail: "assa@gmail.com",
  phone: "+201025453321",
  teacherCode: "DGDASG",
  firstNameAr: "sadsa",
  lastNameAr: "dsadas",
  firstNameEn: "dsad",
  lastNameEn: "sadsad",
  displayName: { firstName: "sadsa", lastName: "dsadas", fullName: "sadsa dsadas" },
  gender: "MALE",
  department: "asdasd",
  specialization: "sadsad",
  accountStatus: "ACTIVE",
  membershipStatus: "ACTIVE",
  membershipEndedAt: null,
  employmentStatus: "ACTIVE",
  profileCompleteness: { isComplete: true, missingFields: [] },
  credentialSummary: {
    hasPassword: true,
    status: "temporary_or_must_change",
    mustChangePassword: true,
    passwordProvisionedAt: "2026-08-01T21:17:13.316Z",
    passwordChangedAt: null,
    credentialVersion: 1,
  },
  createdAt: "2026-08-01T21:17:12.785Z",
  updatedAt: "2026-08-01T21:17:14.255Z",
  employmentType: "FULL_TIME",
  experienceYears: 20,
  hireDate: "2026-08-01",
  workingDays: ["SUNDAY", "MONDAY", "TUESDAY"],
  workStartTime: "00:16:00",
  workEndTime: "04:17:00",
  notesAr: "dsad",
  notesEn: "sad",
} satisfies TeacherDirectoryDetail;

describe("teacher directory contract types", () => {
  it("keeps profile and user identifiers distinct", () => {
    expect(teacherFixture.id).toBe("teacher-1");
    expect(teacherFixture.userId).toBe("user-1");
  });

  it("keeps lifecycle status out of update requests", () => {
    expectTypeOf<UpdateTeacherRequest>().not.toHaveProperty("employmentStatus");
    expectTypeOf<CreateTeacherRequest["employmentStatus"]>().toEqualTypeOf<
      "ACTIVE" | "INACTIVE"
    >();
  });

  it("models the transition response allocation summary", () => {
    expectTypeOf<TeacherEmploymentStatusResponse["transition"]["allocationSummary"]["integrityRiskCount"]>().toEqualTypeOf<number>();
  });

  it("accepts the exact teacher-detail response consumed by the detail page", () => {
    expect(teacherDetailResponse.credentialSummary.status).toBe("temporary_or_must_change");
    expect(teacherDetailResponse.workingDays).toEqual(["SUNDAY", "MONDAY", "TUESDAY"]);
  });

  it("provides the membership-end label in both supported locales", () => {
    expect(arMessages.teachers.details.membership_ended_at).toBeTruthy();
    expect(enMessages.teachers.details.membership_ended_at).toBeTruthy();
  });
});
