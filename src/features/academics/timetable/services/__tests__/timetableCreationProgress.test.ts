import { describe, expect, it } from "vitest";
import {
  resolveTimetableCreationProgress,
  type TimetableCreationProgress,
} from "@/features/academics/timetable/services/timetableCreationProgress";
import { emptyValidationSummary } from "@/features/academics/timetable/services/timetableValidationSummary";
import type { PublicationResponse } from "@/features/academics/timetable/services/timetableApiTypes";
import type { ResolvedTimetableConfig } from "@/features/academics/timetable/types/timetableConfig";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";

describe("resolveTimetableCreationProgress", () => {
  it("shows checking while the selected scope is loading", () => {
    const progress = resolveTimetableCreationProgress({
      ...readyToPublishInput(),
      isLoading: true,
    });

    expect(progress.state).toBe("checking");
  });

  it("treats the active term as a valid timetable scope", () => {
    const progress = resolveTimetableCreationProgress(readyToPublishInput());

    expect(step(progress, "scope")).toMatchObject({
      status: "complete",
      actionable: true,
    });
    expect(step(progress, "configuration")).toMatchObject({
      status: "complete",
      actionable: true,
    });
  });

  it("requires saved entries before review when edits are pending", () => {
    const progress = resolveTimetableCreationProgress({
      ...readyToPublishInput(),
      isDirty: true,
    });

    expect(step(progress, "schedule")).toMatchObject({
      status: "current",
      actionable: true,
    });
    expect(step(progress, "validation")).toMatchObject({
      status: "blocked",
      prerequisiteKey: "saveSchedule",
    });
  });

  it("blocks scheduling until the effective configuration has an active day", () => {
    const progress = resolveTimetableCreationProgress({
      ...readyToPublishInput(),
      resolvedConfig: {
        ...resolvedConfig(),
        days: [{ ...resolvedConfig().days[0], isActive: false }],
      },
    });

    expect(step(progress, "configuration")?.status).toBe("current");
    expect(step(progress, "schedule")).toMatchObject({
      status: "blocked",
      prerequisiteKey: "configureTimetable",
    });
  });

  it("blocks publishing when validation has a blocking reason", () => {
    const progress = resolveTimetableCreationProgress({
      ...readyToPublishInput(),
      validationSummary: {
        ...emptyValidationSummary(),
        canPublish: false,
        blockingReasons: ["Missing teacher allocation"],
      },
    });

    expect(step(progress, "validation")).toMatchObject({
      status: "current",
      actionable: true,
    });
    expect(step(progress, "publish")).toMatchObject({
      status: "blocked",
      prerequisiteKey: "resolveReviewIssues",
    });
  });

  it("enables publishing after a clean saved review", () => {
    const progress = resolveTimetableCreationProgress(readyToPublishInput());

    expect(step(progress, "validation")?.status).toBe("complete");
    expect(step(progress, "publish")).toMatchObject({
      status: "current",
      actionable: true,
    });
  });

  it("marks the journey published from the persisted publication state", () => {
    const progress = resolveTimetableCreationProgress({
      ...readyToPublishInput(),
      publication: publication({ isPublished: true, status: "published" }),
    });

    expect(step(progress, "publish")?.status).toBe("published");
  });

  it("uses the backend publication reason when publishing is blocked", () => {
    const progress = resolveTimetableCreationProgress({
      ...readyToPublishInput(),
      publication: publication({
        canPublish: false,
        blockingReasons: [
          { code: "missing_period", message: "Add a second period" },
        ],
      }),
    });

    expect(step(progress, "publish")?.prerequisiteMessage).toBe(
      "Add a second period",
    );
  });
});

function readyToPublishInput() {
  return {
    isLoading: false,
    resolvedConfig: resolvedConfig(),
    entries: [entry()],
    isDirty: false,
    validationSummary: {
      ...emptyValidationSummary(),
      canPublish: true,
    },
    conflicts: [],
    publication: publication(),
    isReadOnly: false,
  };
}

function resolvedConfig(): ResolvedTimetableConfig {
  return {
    days: [
      {
        key: "sun",
        index: 0,
        nameAr: "الأحد",
        nameEn: "Sunday",
        isActive: true,
      },
    ],
    periods: [
      {
        id: "period-1",
        index: 1,
        nameAr: "الأولى",
        nameEn: "First",
        isInstructional: true,
      },
    ],
    source: { scope: "CLASSROOM", id: "classroom-1" },
  };
}

function entry(): TimetableEntry {
  return {
    id: "entry-1",
    termId: "term-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
    dayKey: "sun",
    periodIndex: 1,
    subjectId: "subject-1",
    teacherId: "teacher-1",
    roomId: "room-1",
  };
}

function publication(
  overrides: Partial<PublicationResponse> = {},
): PublicationResponse {
  return {
    timetableConfigId: "config-1",
    status: "draft",
    canPublish: true,
    blockingReasons: [],
    publishedAt: null,
    ...overrides,
  };
}

function step(
  progress: TimetableCreationProgress,
  id: "scope" | "configuration" | "periods" | "schedule" | "validation" | "publish",
) {
  return progress.steps.find((currentStep) => currentStep.id === id);
}
