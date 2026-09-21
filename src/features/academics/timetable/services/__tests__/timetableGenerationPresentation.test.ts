import { describe, expect, it } from "vitest";
import {
  presentTimetableGeneration,
  type TimetableGenerationPresentationContext,
} from "@/features/academics/timetable/services/timetableGenerationPresentation";

const context: TimetableGenerationPresentationContext = {
  classroomNames: new Map([
    ["classroom-1", "Class 1"],
    ["classroom-2", "Class 2"],
  ]),
  subjectNames: new Map([
    ["subject-1", "Mathematics"],
    ["subject-2", "Science"],
  ]),
};

const completeResponse = {
  timetableConfigId: "config-1",
  createdCount: 12,
  existingCount: 3,
  remainingDemandCount: 0,
  complete: true,
  createdEntryIds: ["entry-1"],
  unresolved: [],
  searchNodesVisited: 8,
  searchBudgetExhausted: false,
  validation: {} as never,
  publishReadiness: {
    canPublish: true,
    blockingReasons: [],
    warnings: [],
  },
};

describe("presentTimetableGeneration", () => {
  it("presents a complete persisted generation", () => {
    expect(presentTimetableGeneration(completeResponse, context)).toMatchObject({
      status: "complete",
      createdCount: 12,
      existingCount: 3,
      remainingDemandCount: 0,
      complete: true,
      groups: [],
    });
  });

  it("groups partial unresolved demand by classroom and subject", () => {
    const viewModel = presentTimetableGeneration(
      {
        ...completeResponse,
        createdCount: 4,
        remainingDemandCount: 2,
        complete: false,
        unresolved: [
          {
            code: "missing_teacher_allocation" as const,
            classroomId: "classroom-1",
            subjectId: "subject-1",
            requiredWeeklySlots: 4,
            scheduledWeeklySlots: 2,
            remainingWeeklySlots: 2,
          },
          {
            code: "no_feasible_slot" as const,
            classroomId: "classroom-1",
            subjectId: "subject-2",
            requiredWeeklySlots: 3,
            scheduledWeeklySlots: 2,
            remainingWeeklySlots: 1,
          },
        ],
      },
      context,
    );

    expect(viewModel).toMatchObject({
      status: "partial",
      groups: [
        {
          classroomId: "classroom-1",
          classroomName: "Class 1",
          items: [
            {
              subjectName: "Mathematics",
              messageKey: "missing_teacher_allocation",
            },
            {
              subjectName: "Science",
              messageKey: "no_feasible_slot",
            },
          ],
        },
      ],
    });
  });

  it.each([
    ["missing_teacher_allocation", "missing_teacher_allocation"],
    ["no_feasible_slot", "no_feasible_slot"],
    ["existing_over_scheduled", "existing_over_scheduled"],
  ] as const)("keeps the %s diagnostic actionable", (code, messageKey) => {
    const viewModel = presentTimetableGeneration(
      {
        ...completeResponse,
        complete: false,
        remainingDemandCount: 1,
        unresolved: [
          {
            code,
            classroomId: "classroom-2",
            subjectId: "subject-1",
            requiredWeeklySlots: 2,
            scheduledWeeklySlots: 1,
            remainingWeeklySlots: 1,
          },
        ],
      },
      context,
    );

    expect(viewModel.groups[0].items[0].messageKey).toBe(messageKey);
  });

  it("does not claim partial generation when the backend exhausts its search budget", () => {
    const viewModel = presentTimetableGeneration(
      {
        ...completeResponse,
        createdCount: 0,
        complete: false,
        remainingDemandCount: 3,
        searchBudgetExhausted: true,
        unresolved: [
          {
            code: "search_budget_exhausted",
            classroomId: null,
            subjectId: null,
            requiredWeeklySlots: null,
            scheduledWeeklySlots: null,
            remainingWeeklySlots: 3,
          },
        ],
      },
      context,
    );

    expect(viewModel).toMatchObject({
      status: "budget_exhausted",
      groups: [
        {
          classroomId: null,
          classroomName: "Unassigned classroom",
          items: [
            {
              subjectName: "Unassigned subject",
              messageKey: "search_budget_exhausted",
            },
          ],
        },
      ],
    });
  });
});
