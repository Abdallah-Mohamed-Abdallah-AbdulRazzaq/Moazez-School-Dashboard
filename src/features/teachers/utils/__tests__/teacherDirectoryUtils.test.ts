import { describe, expect, it } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import { activationBlockers, getAllowedTransitions } from "../employmentTransitions";
import { buildTeacherPatch } from "../buildTeacherPatch";
import { derivePagination } from "../pagination";
import { createFormToRequest, detailToEditForm, editFormToRehireRequest, editFormToRequest, emptyCreateTeacherForm } from "../teacherFormMappers";

describe("teacher form mapping", () => {
  it("omits login email in username mode and normalizes nullable fields", () => {
    const form = emptyCreateTeacherForm("EN");
    form.identity.username = " nour.ali ";
    form.profile.teacherCode = " TCH-001 ";
    form.profile.firstNameAr = "نور";
    form.profile.lastNameAr = "علي";
    form.profile.firstNameEn = "Nour";
    form.profile.lastNameEn = "Ali";
    form.profile.gender = "FEMALE";
    const request = createFormToRequest(form);
    expect(request).toMatchObject({ username: "nour.ali", teacherCode: "TCH-001", contactEmail: null });
    expect(request).not.toHaveProperty("loginEmail");
  });

  it("initializes edit projection language from locale", () => {
    expect(detailToEditForm(teacherFixture, "AR").profile.preferredDisplayLanguage).toBe("AR");
  });

  it("does not submit username or login email changes from the edit form", () => {
    const form = detailToEditForm(teacherFixture, "EN");
    form.identity.username = "different.username";
    form.identity.loginEmail = "different@school.example";

    expect(editFormToRequest(form)).not.toHaveProperty("username");
    expect(editFormToRequest(form)).not.toHaveProperty("loginEmail");
  });

  it("builds rehire data without identity or lifecycle fields", () => {
    const request = editFormToRehireRequest(detailToEditForm(teacherFixture, "EN"));

    expect(request).toMatchObject({
      teacherCode: "TCH-001",
      firstNameEn: "Nour",
      preferredDisplayLanguage: "EN",
      workingDays: ["SUNDAY", "MONDAY"],
    });
    expect(request).not.toHaveProperty("username");
    expect(request).not.toHaveProperty("loginEmail");
    expect(request).not.toHaveProperty("employmentStatus");
  });
});

describe("teacher patch building", () => {
  it("returns an empty patch for an unchanged detail form", () => {
    const form = detailToEditForm(teacherFixture, "EN");
    expect(buildTeacherPatch(teacherFixture, editFormToRequest(form), "EN")).toEqual({});
  });

  it("couples name changes to preferred display language", () => {
    const form = detailToEditForm(teacherFixture, "AR");
    form.profile.firstNameAr = "نورا";
    expect(buildTeacherPatch(teacherFixture, editFormToRequest(form), "AR")).toEqual({ firstNameAr: "نورا", preferredDisplayLanguage: "AR" });
  });
});

describe("employment and pagination rules", () => {
  it.each([
    ["ACTIVE", ["INACTIVE", "TERMINATED"]],
    ["INACTIVE", ["ACTIVE", "TERMINATED"]],
    ["TERMINATED", []],
  ] as const)("allows only legal transitions from %s", (status, expected) => {
    expect(getAllowedTransitions(status)).toEqual(expected);
  });

  it("blocks activation when profile or credentials are incomplete", () => {
    expect(activationBlockers({ ...teacherFixture, profileCompleteness: { isComplete: false, missingFields: ["gender"] }, credentialSummary: { ...teacherFixture.credentialSummary, hasPassword: false } })).toEqual(["profile_incomplete", "credential_missing"]);
  });

  it("derives boundary pagination values", () => {
    expect(derivePagination({ page: 2, limit: 20, total: 41 })).toEqual({ totalPages: 3, hasNext: true, hasPrevious: true });
    expect(derivePagination({ page: 1, limit: 20, total: 0 })).toEqual({ totalPages: 0, hasNext: false, hasPrevious: false });
  });
});
