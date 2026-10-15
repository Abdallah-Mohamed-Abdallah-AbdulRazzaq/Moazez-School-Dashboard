import { describe, expect, it } from "vitest";
import {
  groupValidationConflicts,
  validationReviewIssueKeys,
  validationReviewProgress,
  type ValidationReviewReport,
} from "../timetableValidationReview";
import { emptyValidationSummary } from "../timetableValidationSummary";
import type { TimetableConflictDisplay } from "../timetableConflictNormalization";

const conflict: TimetableConflictDisplay = {
  type: "TEACHER",
  resourceId: "teacher-1",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "09:45",
  severity: "blocking",
  message: "Lessons A and B overlap",
  entryIds: ["A", "B"],
  proposedIndexes: [],
};
const report: ValidationReviewReport = {
  summary: emptyValidationSummary(),
  conflicts: [conflict],
  publication: {
    timetableConfigId: "config-1",
    status: "draft",
    canPublish: false,
    blockingReasons: [],
    publishedAt: null,
  },
};

describe("validation conflict groups", () => {
  it("combines reports for the same resource and interval without losing linked or proposed lessons", () => {
    const groups = groupValidationConflicts([
      conflict,
      {
        ...conflict,
        entryIds: ["B", "C"],
        proposedIndexes: [0],
        message: "Lessons B and C overlap",
      },
      conflict,
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      reports: 3,
      conflict: { entryIds: ["A", "B", "C"], proposedIndexes: [0] },
      messages: ["Lessons A and B overlap", "Lessons B and C overlap"],
    });
    expect(conflict.entryIds).toEqual(["A", "B"]);
  });
  it.each([
    { resourceId: "teacher-2" },
    { dayOfWeek: 2 },
    { startTime: "09:15", endTime: "10:00" },
    { resourceId: undefined },
    { dayOfWeek: null },
    { startTime: undefined, endTime: undefined },
  ])("keeps distinct or unresolved overlaps separate: %j", (changes) => {
    expect(
      groupValidationConflicts([conflict, { ...conflict, ...changes }]),
    ).toHaveLength(2);
  });
});

describe("validation review progress", () => {
  it("counts resolved and new findings by identity even when the total stays unchanged", () => {
    const before = validationReviewIssueKeys(report);
    const after = validationReviewIssueKeys({
      ...report,
      conflicts: [{ ...conflict, resourceId: "teacher-2" }],
    });
    expect(validationReviewProgress(before, after)).toEqual({
      resolved: 1,
      added: 1,
      remaining: 1,
    });
  });
  it("does not report zero remaining when publication is blocked without detailed reasons", () => {
    const keys = validationReviewIssueKeys({
      ...report,
      conflicts: [],
      summary: { ...emptyValidationSummary(), canPublish: true },
    });
    expect(validationReviewProgress([], keys).remaining).toBeGreaterThan(0);
    const readyKeys = validationReviewIssueKeys({
      ...report,
      conflicts: [],
      summary: { ...emptyValidationSummary(), canPublish: true },
      publication: { ...report.publication, canPublish: true },
    });
    expect(validationReviewProgress(keys, readyKeys)).toEqual({
      resolved: 1,
      added: 0,
      remaining: 0,
    });
  });

  it("keeps an overlap unresolved while its affected lessons change and ignores ordering", () => {
    const before = validationReviewIssueKeys(report);
    const after = validationReviewIssueKeys({
      ...report,
      conflicts: [{ ...conflict, entryIds: ["C", "B"] }],
    });
    expect(validationReviewProgress(before, after)).toEqual({
      resolved: 0,
      added: 0,
      remaining: 1,
    });
  });
});
