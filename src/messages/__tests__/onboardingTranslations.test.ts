import { describe, expect, it } from "vitest";
import en from "../en.json";
import ar from "../ar.json";

function keysOf(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("onboarding translations and navigation", () => {
  it("keeps onboarding translation keys identical in both locales", () => {
    expect(ar.onboarding).toBeDefined();
    expect(en.onboarding).toBeDefined();
    expect(keysOf(ar.onboarding).sort()).toEqual(keysOf(en.onboarding).sort());
  });

  it("contains complete localized onboarding copy", () => {
    expect(en.onboarding.welcome.title).toBe(
      "Welcome to your school workspace",
    );
    expect(ar.onboarding.welcome.title).toBe("مرحبًا بك في مساحة عمل مدرستك");
    expect(en.onboarding.setup.skip).toBe("Skip setup");
    expect(ar.onboarding.setup.skip).toBe("تخطي الإعداد");
    expect(en.onboarding.steps.organization.saveFailed).toBe(
      "Could not save profile",
    );
    expect(ar.onboarding.steps.organization.saveFailed).toBe(
      "تعذر حفظ ملف المدرسة",
    );
    expect(en.onboarding.guide.progressText).toContain("{completed}");
    expect(ar.onboarding.steps.academicContext.yearsCount).toContain("plural");
    expect(en.onboarding.steps.organization.editBranding).toBe("Edit branding");
    expect(en.onboarding.steps.organization.completeness).toContain(
      "{percent}",
    );
    expect(ar.onboarding.steps.organization.editBranding).toBe("تعديل الهوية");
    expect(ar.onboarding.steps.organization.locationRequired).toBeTruthy();
  });
});
