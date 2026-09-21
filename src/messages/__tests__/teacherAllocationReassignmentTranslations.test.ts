import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

const requiredKeys = [
  "title",
  "description",
  "currentTeacher",
  "targetTeacher",
  "status.ready",
  "status.blocked",
  "sections.transfers",
  "sections.history",
  "sections.policies",
  "sections.blockers",
  "actions.cancel",
  "actions.confirm",
  "actions.confirming",
  "actions.handoff.timetable",
  "actions.handoff.lessonPlans",
  "actions.handoff.homework",
  "history.timetable",
  "history.lessonPlans",
  "history.homework",
  "history.reinforcement",
  "history.announcements",
  "blockers.targetIsCurrentTeacher",
  "blockers.targetAlreadyAllocated",
  "blockers.targetTeacherConflict",
  "blockers.activeReinforcementTasks",
  "blockers.mutableTeacherAnnouncements",
  "errors.targetNotFound",
  "errors.targetIneligible",
  "errors.blocked",
  "errors.stalePreview",
  "errors.concurrentChange",
  "errors.unknown",
  "errors.traceId",
  "eligibility.incompatibleIdentity",
  "eligibility.accountStatusIneligible",
  "eligibility.membershipIneligible",
  "eligibility.profileMissing",
  "eligibility.employmentInactive",
  "eligibility.profileIncomplete",
  "policies.assessments",
  "policies.curriculum",
  "policies.attendance",
  "policies.messages",
] as const;

function readTranslation(
  messages: Record<string, unknown>,
  path: string,
): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, messages);
}

describe("teacher allocation reassignment translations", () => {
  it.each([
    ["English", en],
    ["Arabic", ar],
  ] as const)("defines every reassignment message in %s", (_, messages) => {
    const reassignment = messages.academics.teacherAllocation.reassignment;

    for (const key of requiredKeys) {
      expect(readTranslation(reassignment, key), key).toEqual(
        expect.any(String),
      );
    }

    expect(messages.academics.teacherAllocation.actions.saveSuccess).toEqual(
      expect.any(String),
    );
  });
});
