import { describe, expect, it } from "vitest";
import { menuItems } from "@/config/navigation";

describe("Admissions navigation", () => {
  it("uses Applications as the Admissions entry point without an Overview child", () => {
    const admissions = menuItems.find(
      (menuItem) => menuItem.key === "admissions-registration",
    );

    expect(admissions).toBeDefined();
    expect(admissions?.href_en).toBe("/en/admissions/applications");
    expect(admissions?.href_ar).toBe("/ar/admissions/applications");
    expect(admissions?.children?.[0]?.key).toBe("admissions-applications");
    expect(admissions?.children).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "admissions-dashboard" }),
      ]),
    );
  });

  it("links the workflow policy page from Admissions", () => {
    const admissions = menuItems.find((item) => item.key === "admissions-registration");
    expect(admissions?.children).toEqual(expect.arrayContaining([expect.objectContaining({ key: "admissions-workflow-policy", href_en: "/en/admissions/workflow-policy", href_ar: "/ar/admissions/workflow-policy" })]));
  });
});

describe("Students & Guardians navigation", () => {
  it("exposes Profile Correction Requests after its route exists", () => {
    const studentsGuardians = menuItems.find(
      (menuItem) => menuItem.key === "students-guardians",
    );

    expect(studentsGuardians?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "profile-correction-requests",
          href_en: "/en/students-guardians/profile-correction-requests",
          href_ar: "/ar/students-guardians/profile-correction-requests",
        }),
      ]),
    );
  });
});

describe("Nedaa navigation", () => {
  it("exposes only backend dismissal contract pages", () => {
    const nedaa = menuItems.find((menuItem) => menuItem.key === "nedaa");

    expect(nedaa).toBeDefined();
    expect(nedaa?.href_en).toBe("/en/nedaa/settings");
    expect(nedaa?.href_ar).toBe("/ar/nedaa/settings");
    expect(nedaa?.children?.map((child) => child.key)).toEqual([
      "nedaa-operations",
      "nedaa-settings",
      "nedaa-gates",
      "nedaa-staff-assignments",
    ]);
    expect(nedaa?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "nedaa-operations",
          href_en: "/en/nedaa/operations",
          href_ar: "/ar/nedaa/operations",
        }),
      ]),
    );
  });
});
