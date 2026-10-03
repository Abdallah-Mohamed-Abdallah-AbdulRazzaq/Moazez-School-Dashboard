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
  termDefaultTitle: "Term default timetable",
  termDefaultDescription: "This draft applies to all classrooms by default.",
  inheritedTitle: "Inherited published timetable",
  inheritedDescription: "This published timetable is inherited and read-only.",
  unconfiguredTitle: "No setup loaded",
  unconfiguredDescription: "Open the selected scope to check its setup.",
  unconfiguredScopeDescription: "No custom setup exists for this scope.",
  sourceLabel: "Source",
  lockedLabel: "Inherited timetable is locked",
  createOverride: "Create custom timetable",
  customizeScope: "Customize a specific scope",
  openSelectedScope: "Open selected scope",
  returnToTermDefault: "Return to term default",
  overrideUnavailable: "You cannot create an override for this scope.",
  publishedOverridesNote:
    "Published overrides take precedence in their scopes.",
};

describe("TimetableSourceBanner", () => {
  it("opens a selected legacy scope when no term default exists", async () => {
    const user = userEvent.setup();
    const onOpenSelectedScope = vi.fn();
    render(
      <TimetableSourceBanner
        workspaceState={resolveTimetableWorkspaceState({
          exactConfig: null,
          effectiveConfig: null,
        })}
        sourceName="Term timetable"
        configurationScope={{ scopeType: "TERM" }}
        primaryActionEnabled
        onCreateOverride={onOpenSelectedScope}
        onReturnToTermDefault={vi.fn()}
        copy={copy}
      />,
    );

    expect(screen.getByText(copy.unconfiguredTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.unconfiguredDescription)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.openSelectedScope }),
    );
    expect(onOpenSelectedScope).toHaveBeenCalledOnce();
  });

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
        configurationScope={{ scopeType: "STAGE", stageId: "stage-1" }}
        primaryActionEnabled
        onCreateOverride={onCreateOverride}
        onReturnToTermDefault={vi.fn()}
        copy={copy}
      />,
    );

    expect(screen.getByText(copy.inheritedTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.inheritedDescription)).toBeInTheDocument();
    expect(screen.getByText("Source: Stage: Primary")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: copy.lockedLabel }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.createOverride }));
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
        configurationScope={{ scopeType: "STAGE", stageId: "stage-1" }}
        primaryActionEnabled={false}
        onCreateOverride={vi.fn()}
        onReturnToTermDefault={vi.fn()}
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
        configurationScope={{
          scopeType: "CLASSROOM",
          classroomId: "classroom-1",
        }}
        primaryActionEnabled
        onCreateOverride={vi.fn()}
        onReturnToTermDefault={vi.fn()}
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
    expect(
      screen.getByRole("button", { name: copy.returnToTermDefault }),
    ).toBeInTheDocument();
  });

  it("describes the exact term config as the default for all classrooms", async () => {
    const user = userEvent.setup();
    const onCreateOverride = vi.fn();
    render(
      <TimetableSourceBanner
        workspaceState={resolveTimetableWorkspaceState({
          exactConfig: {
            id: "term-config",
            academicYearId: "year-1",
            termId: "term-1",
            name: "Term timetable",
            weekStartDay: 0,
            activeDays: [0, 1, 2, 3, 4],
            scopeType: "term",
            scopeKey: "term-1",
            stageId: null,
            gradeId: null,
            sectionId: null,
            classroomId: null,
            status: "draft",
            createdAt: "2026-10-02T00:00:00.000Z",
            updatedAt: "2026-10-02T00:00:00.000Z",
          },
          effectiveConfig: null,
        })}
        sourceName="Term timetable"
        configurationScope={{ scopeType: "TERM" }}
        primaryActionEnabled
        onCreateOverride={onCreateOverride}
        onReturnToTermDefault={vi.fn()}
        copy={copy}
      />,
    );

    expect(screen.getByText(copy.termDefaultDescription)).toBeInTheDocument();
    expect(screen.getByText(copy.publishedOverridesNote)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.customizeScope }));
    expect(onCreateOverride).toHaveBeenCalledOnce();
  });
});
