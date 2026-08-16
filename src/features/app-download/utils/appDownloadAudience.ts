import type { MeResponse } from "@/types/user";

export type AppDownloadAudience =
  | "student"
  | "teacher"
  | "parent"
  | "dismissalStaff";

export const MOBILE_APP_AUDIENCES = [
  "student",
  "teacher",
  "parent",
  "dismissalStaff",
] as const satisfies readonly AppDownloadAudience[];

export const APP_DOWNLOAD_CONFIG: Record<
  AppDownloadAudience,
  {
    translationKey: "student" | "teacher" | "parent" | "dismissal_staff";
    androidUrl: string | null;
    iosUrl: string | null;
  }
> = {
  student: {
    translationKey: "student",
    androidUrl: process.env.NEXT_PUBLIC_MOBILE_APP_STUDENT_GOOGLE_PLAY_URL || null,
    iosUrl: process.env.NEXT_PUBLIC_MOBILE_APP_STUDENT_APP_STORE_URL || null,
  },
  teacher: {
    translationKey: "teacher",
    androidUrl: process.env.NEXT_PUBLIC_MOBILE_APP_TEACHER_GOOGLE_PLAY_URL || null,
    iosUrl: process.env.NEXT_PUBLIC_MOBILE_APP_TEACHER_APP_STORE_URL || null,
  },
  parent: {
    translationKey: "parent",
    androidUrl: process.env.NEXT_PUBLIC_MOBILE_APP_PARENT_GOOGLE_PLAY_URL || null,
    iosUrl: process.env.NEXT_PUBLIC_MOBILE_APP_PARENT_APP_STORE_URL || null,
  },
  dismissalStaff: {
    translationKey: "dismissal_staff",
    androidUrl:
      process.env.NEXT_PUBLIC_MOBILE_APP_DISMISSAL_STAFF_GOOGLE_PLAY_URL || null,
    iosUrl:
      process.env.NEXT_PUBLIC_MOBILE_APP_DISMISSAL_STAFF_APP_STORE_URL || null,
  },
};

type AppDownloadUser = Pick<MeResponse, "userType" | "activeMembership">;

export function getAppDownloadAudience(
  user: AppDownloadUser | null | undefined,
): AppDownloadAudience | null {
  if (!user) return null;

  if (user.userType === "STUDENT") return "student";
  if (user.userType === "TEACHER") return "teacher";
  if (user.userType === "PARENT") return "parent";

  const roleKey = user.activeMembership?.roleKey;
  if (roleKey === "dismissal_staff" || roleKey === "DISMISSAL_STAFF") {
    return "dismissalStaff";
  }

  return null;
}
