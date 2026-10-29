import type { Page } from "@playwright/test";
import { fulfillJson } from "./mock-session";

export async function mockAttendanceApi(page: Page) {
  await page.route("**/api/session/attendance/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/session/attendance", "");
    const yearId = url.searchParams.get("academicYearId") ?? "year-1";
    const termId = url.searchParams.get("termId") ?? "term-1-1";
    const policy = { id: "policy-1", academicYearId: yearId, termId, nameEn: "Daily policy", nameAr: "حضور يومي", scopeType: "SCHOOL", mode: "DAILY", isActive: true, allowExcuses: true };
    if (request.method() === "GET") {
      if (path === "/policies") return fulfillJson(route, { items: [policy] });
      if (path === "/policies/effective") return fulfillJson(route, { policy });
      if (["/absences", "/excuse-requests", "/reports/daily-trend", "/reports/scope-breakdown", "/reports/derived-daily-absences", "/roll-call/sessions"].includes(path)) return fulfillJson(route, { items: [], total: 0 });
      if (["/absences/summary", "/reports/summary"].includes(path)) return fulfillJson(route, { totalEntries: 0, presentCount: 0, absentCount: 0, lateCount: 0, earlyLeaveCount: 0, excusedCount: 0, attendanceRate: 0, affectedStudentsCount: 0 });
      if (path === "/roll-call/roster") return fulfillJson(route, { items: [{ id: "student-1", nameEn: "Ali Test", nameAr: "علي", studentNumber: "S-001" }] });
    }
    if (request.method() === "POST" && path === "/roll-call/session/resolve") {
      return fulfillJson(route, { session: { ...request.postDataJSON(), id: "session-1", status: "DRAFT", createdAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-01T08:00:00Z" }, entries: [] });
    }
    return route.fallback();
  });
}
