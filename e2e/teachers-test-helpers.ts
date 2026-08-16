import { expect, type Page, type Route } from "@playwright/test";

export const teacherRecord = {
  id: "teacher-1",
  userId: "user-1",
  loginEmail: "nour@school.test",
  username: "nour.ali",
  contactEmail: "nour@example.com",
  phone: "+201000000000",
  teacherCode: "TCH-001",
  firstNameAr: "نور",
  lastNameAr: "علي",
  firstNameEn: "Nour",
  lastNameEn: "Ali",
  displayName: { firstName: "Nour", lastName: "Ali", fullName: "Nour Ali" },
  gender: "FEMALE",
  department: "Science",
  specialization: "Biology",
  accountStatus: "ACTIVE",
  membershipStatus: "ACTIVE",
  membershipEndedAt: null,
  employmentStatus: "INACTIVE",
  profileCompleteness: { isComplete: true, missingFields: [] },
  credentialSummary: { hasPassword: true, status: "set", mustChangePassword: false, passwordProvisionedAt: null, passwordChangedAt: null, credentialVersion: 1 },
  employmentType: "FULL_TIME",
  experienceYears: 4,
  hireDate: "2022-08-18",
  workingDays: ["SUNDAY", "MONDAY"],
  workStartTime: "07:30:00",
  workEndTime: "14:30:00",
  notesAr: null,
  notesEn: null,
  createdAt: "2026-07-01T08:00:00Z",
  updatedAt: "2026-07-20T08:00:00Z",
} as const;

function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

const transitionResponse = {
  teacher: { ...teacherRecord, employmentStatus: "ACTIVE" },
  transition: {
    previousEmploymentStatus: "INACTIVE",
    employmentStatus: "ACTIVE",
    accountStatus: "ACTIVE",
    membershipStatus: "ACTIVE",
    membershipEndedAt: null,
    effectiveAt: "2026-07-21T08:00:00Z",
    revokedSessionCount: 0,
    reassignmentRequired: false,
    allocationSummary: {
      currentActiveCount: 0,
      futureCount: 0,
      historicalCount: 0,
      currentInactiveCount: 0,
      inconsistentCount: 0,
      invalidCount: 0,
      integrityRiskCount: 0,
      integrityReason: "none",
    },
  },
};

export async function mockTeacherDirectory(page: Page) {
  await page.route("**/api/v1/teachers**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "GET" && path.endsWith("/teachers")) {
      return fulfillJson(route, { items: [teacherRecord], pagination: { page: 1, limit: 20, total: 1 } });
    }
    if (request.method() === "GET" && path.endsWith(`/teachers/${teacherRecord.id}`)) {
      return fulfillJson(route, teacherRecord);
    }
    if (request.method() === "POST" && path.endsWith("/teachers")) {
      return fulfillJson(route, teacherRecord, 201);
    }
    if (request.method() === "PATCH" && path.endsWith(`/teachers/${teacherRecord.id}/employment-status`)) {
      return fulfillJson(route, transitionResponse);
    }
    if (request.method() === "PATCH" && path.endsWith(`/teachers/${teacherRecord.id}`)) {
      return fulfillJson(route, teacherRecord);
    }
    if (request.method() === "DELETE" && path.endsWith(`/teachers/${teacherRecord.id}`)) {
      return route.fulfill({ status: 204, body: "" });
    }
    if (request.method() === "POST" && path.endsWith(`/teachers/${teacherRecord.id}/rehire`)) {
      return fulfillJson(route, teacherRecord);
    }
    return route.continue();
  });
  await page.route("**/api/v1/settings/users/*/credentials/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "POST") return route.continue();
    if (path.endsWith("/credentials/generate") || path.endsWith("/credentials/regenerate")) {
      return fulfillJson(route, {
        user: { userId: teacherRecord.userId, fullName: teacherRecord.displayName.fullName, username: teacherRecord.username, loginEmail: teacherRecord.loginEmail, contactEmail: teacherRecord.contactEmail },
        temporaryPassword: "MZ-7KQ9-PL2R",
        mustChangePassword: true,
        generatedAt: "2026-07-21T09:00:00Z",
        credentialVersion: 2,
      }, 201);
    }
    if (path.endsWith("/credentials/set")) {
      return fulfillJson(route, {
        user: { userId: teacherRecord.userId, fullName: teacherRecord.displayName.fullName, username: teacherRecord.username, loginEmail: teacherRecord.loginEmail, contactEmail: teacherRecord.contactEmail },
        mustChangePassword: true,
        generatedAt: "2026-07-21T09:00:00Z",
        credentialVersion: 2,
      }, 201);
    }
    return route.continue();
  });
}

export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

export async function expectNoPageErrors(errors: string[]) {
  expect(errors.filter((message) => !message.includes("Hydration failed"))).toEqual([]);
}
