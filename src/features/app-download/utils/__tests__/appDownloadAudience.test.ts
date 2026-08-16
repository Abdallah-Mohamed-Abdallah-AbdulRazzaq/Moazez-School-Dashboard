import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppDownloadAudience } from "../appDownloadAudience";

function user(userType: string, roleKey = "school.admin") {
  return {
    userType,
    activeMembership: { roleKey },
  };
}

describe("getAppDownloadAudience", () => {
  it.each([
    ["STUDENT", "school.admin", "student"],
    ["TEACHER", "school.admin", "teacher"],
    ["PARENT", "school.admin", "parent"],
    ["SCHOOL_USER", "dismissal_staff", "dismissalStaff"],
    ["SCHOOL_USER", "DISMISSAL_STAFF", "dismissalStaff"],
  ])("maps %s with role %s to %s", (userType, roleKey, audience) => {
    expect(getAppDownloadAudience(user(userType, roleKey) as never)).toBe(
      audience,
    );
  });

  it("allows a non-target school user through", () => {
    expect(getAppDownloadAudience(user("SCHOOL_USER") as never)).toBeNull();
  });
});

describe("mobile app store configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    [
      "student",
      "NEXT_PUBLIC_MOBILE_APP_STUDENT",
      "https://play.google.com/store/apps/details?id=student",
      "https://apps.apple.com/app/student/id123",
    ],
    [
      "teacher",
      "NEXT_PUBLIC_MOBILE_APP_TEACHER",
      "https://play.google.com/store/apps/details?id=teacher",
      "https://apps.apple.com/app/teacher/id456",
    ],
    [
      "parent",
      "NEXT_PUBLIC_MOBILE_APP_PARENT",
      "https://play.google.com/store/apps/details?id=parent",
      "https://apps.apple.com/app/parent/id789",
    ],
    [
      "dismissalStaff",
      "NEXT_PUBLIC_MOBILE_APP_DISMISSAL_STAFF",
      "https://play.google.com/store/apps/details?id=dismissal",
      "https://apps.apple.com/app/dismissal/id321",
    ],
  ])("uses configured %s store URLs", async (audience, envPrefix, androidUrl, iosUrl) => {
    vi.stubEnv(`${envPrefix}_GOOGLE_PLAY_URL`, androidUrl);
    vi.stubEnv(`${envPrefix}_APP_STORE_URL`, iosUrl);
    vi.resetModules();

    const { APP_DOWNLOAD_CONFIG } = await import("../appDownloadAudience");

    expect(APP_DOWNLOAD_CONFIG[audience].androidUrl).toBe(androidUrl);
    expect(APP_DOWNLOAD_CONFIG[audience].iosUrl).toBe(iosUrl);
  });
});
