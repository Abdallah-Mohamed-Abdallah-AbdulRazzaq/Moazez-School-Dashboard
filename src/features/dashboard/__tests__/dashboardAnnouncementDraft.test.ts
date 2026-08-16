import { describe, expect, it } from "vitest";
import {
  dashboardAnnouncementDraftPayload,
  validateDashboardAnnouncementDraft,
  type DashboardAnnouncementDraftValues,
} from "@/features/dashboard/utils/dashboardAnnouncementDraft";
import { dashboardAnnouncementLabels } from "@/features/dashboard/utils/dashboardAnnouncementLabels";

const baseDraft: DashboardAnnouncementDraftValues = {
  title: "  Term opening  ",
  body: "  Welcome back tomorrow.  ",
  priority: "normal",
  audienceType: "school",
  audienceId: "",
  audienceUserIds: [],
};

describe("dashboard announcement draft", () => {
  it("creates a truthful school-wide draft payload", () => {
    expect(dashboardAnnouncementDraftPayload(baseDraft)).toEqual({
      title: "Term opening",
      body: "Welcome back tomorrow.",
      status: "draft",
      priority: "normal",
      audienceType: "school",
    });
  });

  it("maps scoped and custom audiences without inventing recipients", () => {
    expect(
      dashboardAnnouncementDraftPayload({
        ...baseDraft,
        audienceType: "grade",
        audienceId: "grade-1",
      }).audiences,
    ).toEqual([{ audienceType: "grade", gradeId: "grade-1" }]);

    expect(
      dashboardAnnouncementDraftPayload({
        ...baseDraft,
        audienceType: "custom",
        audienceUserIds: ["user-1", "user-2"],
      }).audiences,
    ).toEqual([
      { audienceType: "custom", userId: "user-1" },
      { audienceType: "custom", userId: "user-2" },
    ]);
  });

  it("requires content and audience details before submission", () => {
    expect(validateDashboardAnnouncementDraft({ ...baseDraft, title: "" })).toBe(
      "title",
    );
    expect(validateDashboardAnnouncementDraft({ ...baseDraft, body: "" })).toBe(
      "body",
    );
    expect(
      validateDashboardAnnouncementDraft({
        ...baseDraft,
        audienceType: "stage",
        audienceId: "",
      }),
    ).toBe("audience");
    expect(
      validateDashboardAnnouncementDraft({
        ...baseDraft,
        audienceType: "custom",
        audienceUserIds: [],
      }),
    ).toBe("audience");
  });

  it("keeps Arabic quick announcement labels readable", () => {
    expect(dashboardAnnouncementLabels.ar).toMatchObject({
      title: "العنوان",
      body: "المحتوى",
      audienceType: "نوع الجمهور",
      createDraft: "إنشاء مسودة",
      openFullForm: "فتح نموذج الإعلان الكامل",
    });
    expect(Object.values(dashboardAnnouncementLabels.ar).join(" ")).not.toContain(
      "Ã",
    );
  });
});
