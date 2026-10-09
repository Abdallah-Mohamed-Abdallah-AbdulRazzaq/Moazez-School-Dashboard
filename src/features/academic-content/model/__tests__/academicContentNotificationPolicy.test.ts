import { describe, expect, it } from "vitest";
import type { AcademicContentNotificationPolicy } from "../../types/contracts";
import {
  notificationPolicyChanges,
  parseReminderOffsets,
} from "../academicContentNotificationPolicy";

const policy: AcademicContentNotificationPolicy = {
  notificationsEnabled: true,
  studentNotificationsEnabled: true,
  guardianNotificationsEnabled: true,
  weeklyPlanNotificationsEnabled: true,
  guardianWeeklyNoteNotificationsEnabled: true,
  subjectResourceNotificationsEnabled: true,
  onlineSessionNotificationsEnabled: true,
  generalResourceNotificationsEnabled: true,
  significantUpdateNotificationsEnabled: true,
  cancellationNotificationsEnabled: true,
  onlineSessionRemindersEnabled: true,
  onlineSessionReminderOffsetsMinutes: [30, 60],
};

describe("academic content notification policy", () => {
  it("normalizes unique reminder offsets in ascending order", () => {
    expect(parseReminderOffsets("60, 30, 60, 5")).toEqual({
      value: [5, 30, 60],
      error: null,
    });
    expect(parseReminderOffsets("  ")).toEqual({ value: [], error: null });
  });

  it.each([
    ["4", "range"],
    ["10081", "range"],
    ["30.5", "invalid"],
    ["a", "invalid"],
    ["5,10,15,20,25,30", "too_many"],
  ] as const)("rejects invalid reminder offsets %s", (input, error) => {
    expect(parseReminderOffsets(input).error).toBe(error);
  });

  it("returns only changed fields and compares offset arrays by value", () => {
    expect(notificationPolicyChanges(policy, { ...policy })).toEqual({});
    expect(
      notificationPolicyChanges(policy, {
        ...policy,
        notificationsEnabled: false,
        onlineSessionReminderOffsetsMinutes: [5, 30],
      }),
    ).toEqual({
      notificationsEnabled: false,
      onlineSessionReminderOffsetsMinutes: [5, 30],
    });
  });
});
