import { test as base, expect, type Route } from "@playwright/test";
import { installLocalSessionNavigation, installSessionCookies } from "./session";

const permissions = [
  "teachers.records.view", "teachers.records.manage", "settings.users.manage",
  "admissions.applications.view", "admissions.applications.manage",
  "academics.structure.view", "academics.subjects.view",
  "attendance.policies.view", "attendance.policies.manage", "attendance.sessions.view",
  "attendance.sessions.manage", "attendance.sessions.submit", "attendance.entries.manage",
  "attendance.absences.view", "attendance.excuses.view", "attendance.excuses.manage", "attendance.reports.view",
  "grades.assessments.view", "grades.assessments.manage", "grades.questions.view", "grades.questions.manage",
  "grades.gradebook.view", "grades.items.view", "grades.items.manage",
  "communication.conversations.view", "communication.conversations.manage", "communication.messages.view",
  "communication.messages.send", "communication.policies.view", "communication.notifications.view",
];

export const sessionUser = {
  id: "user-1", firstName: "Browser", lastName: "Tester", email: "browser@example.test",
  userType: "SCHOOL_USER", status: "ACTIVE", mustChangePassword: false,
  activeMembership: { membershipId: "membership-1", schoolId: "school-1", organizationId: "organization-1", roleKey: "admin", permissions },
};

export function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

export const academicTree = {
  stages: [{ id: "stage-1", nameEn: "Primary", nameAr: "ابتدائي" }],
  grades: [{ id: "grade-1", stageId: "stage-1", nameEn: "Grade 1", nameAr: "الأول" }],
  sections: [{ id: "section-1", gradeId: "grade-1", nameEn: "A", nameAr: "أ" }],
  classrooms: [{ id: "classroom-1", sectionId: "section-1", nameEn: "Class 1", nameAr: "فصل ١" }],
};

function academicResponse(path: string, url: URL): unknown {
  if (path === "/academics/structure/years") return [1, 2].map(index => ({ id: `year-${index}`, nameEn: `Year ${index}`, nameAr: `السنة ${index}`, startDate: "2024-09-01", endDate: "2027-08-31", isActive: index === 1 }));
  if (path === "/academics/structure/terms") {
    const year = url.searchParams.get("yearId") ?? url.searchParams.get("academicYearId") ?? "year-1";
    return [1, 2].map(index => ({ id: `term-${year.slice(-1)}-${index}`, academicYearId: year, nameEn: `Term ${index}`, nameAr: `الفصل ${index}`, status: "open", startDate: "2024-09-01", endDate: "2027-08-31" }));
  }
  if (path === "/academics/structure/tree") return academicTree;
  if (path === "/academics/rooms") return [{ id: "room-1", nameEn: "Room 1", nameAr: "غرفة ١", capacity: 30 }];
  if (path === "/academics/subjects") return [{ id: "subj-5", nameEn: "Math", nameAr: "رياضيات", gradeId: "grade-1" }];
  if (path === "/academics/subject-allocations") return { items: [{ id: "allocation-1", subjectId: "subj-5", gradeId: "grade-1", weeklyHours: 5 }] };
  if (path === "/academics/timetable/all") return { items: [{ classroomId: "classroom-1", effectiveConfig: { id: "timetable-1", activeDays: [0, 1, 2, 3, 4] }, periods: [], entries: [] }], total: 1 };
}

export const test = base.extend({
  page: async ({ page, baseURL, browserName }, runTest) => {
    const target = new URL(baseURL!);
    expect(target.hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
    await installSessionCookies(page);
    if (browserName === "webkit" && target.protocol === "http:") await installLocalSessionNavigation(page, baseURL!);
    const unexpectedRequests = new Set<string>();
    await page.route("**/api/**", async route => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace("/api/session", "");
      if (path === "/auth/me") return fulfillJson(route, sessionUser);
      if (path === "/settings/branding") return fulfillJson(route, { schoolName: "Test School", schoolNameEn: "Test School", schoolNameAr: "مدرسة الاختبار" });
      if (path === "/communication/notifications") return fulfillJson(route, { items: [], total: 0 });
      const academic = route.request().method() === "GET" ? academicResponse(path, url) : undefined;
      if (academic !== undefined) return fulfillJson(route, academic);
      unexpectedRequests.add(`${route.request().method()} ${path}`);
      return fulfillJson(route, { message: `Unmocked browser-test request: ${path}` }, 501);
    });
    await runTest(page);
    expect([...unexpectedRequests], "Every API request must have a test fixture; live API access is blocked").toEqual([]);
  },
});

export { expect };
