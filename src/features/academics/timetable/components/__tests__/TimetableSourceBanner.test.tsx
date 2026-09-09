import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableSourceBanner from "@/features/academics/timetable/components/TimetableSourceBanner";
import { resolveTimetableWorkspaceState } from "@/features/academics/timetable/services/timetableWorkspaceState";
import type {
  BackendTimetableConfigDto,
  TimetableDashboardConfigSummaryDto,
} from "@/features/academics/timetable/services/timetableApiTypes";

const effectiveConfig = {
  id: "stage-config",
  scopeType: "stage",
} as TimetableDashboardConfigSummaryDto;

const copy = {
  exactTitle: "Scope timetable",
  exactDescription: "Using the timetable configured for this scope.",
  inheritedTitle: "Inherited published timetable",
  inheritedDescription: "This published timetable is inherited and read-only.",
  sourceLabel: "Source",
  lockedLabel: "Inherited timetable is locked",
  createOverride: "Create custom timetable",
  overrideUnavailable: "You cannot create an override for this scope.",
};

describe("TimetableSourceBanner", () => {
  it("identifies an inherited source and creates an override", async () => {
    const user = userEvent.setup();
    const onCreateOverride = vi.fn();
    render(
      <TimetableSourceBanner
        workspaceState={resolveTimetableWorkspaceState({
          exactConfig: null,
          effectiveConfig,
        })}
        sourceName="Stage: Primary"
        canCreateOverride
        onCreateOverride={onCreateOverride}
        copy={copy}
      />,
    );

    expect(screen.getByText(copy.inheritedTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.inheritedDescription)).toBeInTheDocument();
    expect(screen.getByText("Source: Stage: Primary")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: copy.lockedLabel }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.createOverride }),
    );
    expect(onCreateOverride).toHaveBeenCalledOnce();
  });

  it("explains why an inherited override action is disabled", () => {
    render(
      <TimetableSourceBanner
        workspaceState={resolveTimetableWorkspaceState({
          exactConfig: null,
          effectiveConfig,
        })}
        sourceName="Stage: Primary"
        canCreateOverride={false}
        onCreateOverride={vi.fn()}
        copy={copy}
      />,
    );

    expect(
      screen.getByRole("button", { name: copy.createOverride }),
    ).toBeDisabled();
    expect(screen.getByText(copy.overrideUnavailable)).toBeInTheDocument();
  });

  it("shows exact scope state without inherited controls", () => {
    render(
      <TimetableSourceBanner
        workspaceState={resolveTimetableWorkspaceState({
          exactConfig: {
            id: "exact-config",
            timetableConfigId: "exact-config",
            academicYearId: "year-1",
            termId: "term-1",
            name: "Classroom timetable",
            weekStartDay: 0,
            activeDays: [0, 1, 2, 3, 4],
            scopeType: "classroom",
            scopeKey: "classroom-1",
            stageId: null,
            gradeId: null,
            sectionId: null,
            classroomId: "classroom-1",
            status: "draft",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          } satisfies BackendTimetableConfigDto,
          effectiveConfig,
        })}
        sourceName="Classroom: 1A"
        canCreateOverride
        onCreateOverride={vi.fn()}
        copy={copy}
      />,
    );

    expect(screen.getByText(copy.exactTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.createOverride }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: copy.lockedLabel }),
    ).not.toBeInTheDocument();
  });
});
