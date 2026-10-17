import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import TimetableConflictDialog from "../TimetableConflictDialog";
import type {
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  TimetableDashboardAllResponseDto,
} from "../../services/timetableApiTypes";
import type { TimetableConflictDisplay } from "../../services/timetableConflictNormalization";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

const lessonA: BackendTimetableEntryDto = {
  id: "lesson-a",
  timetableConfigId: "config-a",
  periodId: "period-a",
  dayOfWeek: 1,
  period: {
    id: "period-a",
    index: 2,
    label: "Period A",
    startTime: "09:00",
    endTime: "09:45",
  },
  classroom: { id: "class-a", nameAr: "الفصل أ", nameEn: "Class A" },
  subject: { id: "math", nameAr: "الرياضيات", nameEn: "Mathematics" },
  teacher: { userId: "teacher-1", fullName: "Ms. Noor" },
  room: null,
  teacherSubjectAllocationId: "allocation-a",
  notes: null,
  status: "draft",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};
const lessonB: BackendTimetableEntryDto = {
  ...lessonA,
  id: "lesson-b",
  timetableConfigId: "config-b",
  periodId: "period-b",
  period: {
    id: "period-b",
    index: 4,
    label: "Period B",
    startTime: "09:15",
    endTime: "10:00",
  },
  classroom: { id: "class-b", nameAr: "الفصل ب", nameEn: "Class B" },
  subject: { id: "science", nameAr: "العلوم", nameEn: "Science" },
};
const conflict: TimetableConflictDisplay = {
  type: "TEACHER",
  message: "Teacher lessons overlap.",
  severity: "blocking",
  dayOfWeek: 1,
  dayKey: "mon",
  periodId: "period-a",
  periodIndex: 2,
  entryIds: [lessonA.id, lessonB.id],
  proposedIndexes: [],
  resourceId: "teacher-1",
};

function dashboardFor(
  lesson: BackendTimetableEntryDto,
): TimetableDashboardAllResponseDto {
  const config = {
    id: lesson.timetableConfigId,
    name: `Schedule ${lesson.classroom.nameEn}`,
    scopeType: "CLASSROOM",
    scopeKey: `CLASSROOM:${lesson.classroom.id}`,
    stageId: null,
    status: "draft",
    activeDays: [1, 2],
  };
  const otherConfig = {
    ...config,
    id: "other-config",
    name: "Another published configuration",
    status: "active",
  };
  const period: BackendTimetablePeriodDto = {
    ...lesson.period,
    id: lesson.periodId,
    timetableConfigId: config.id,
    type: "class",
    isInstructional: true,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
  return {
    termId: "term-1",
    academicYearId: "year-1",
    publishedAt: null,
    isPublished: false,
    items: [
      {
        classroomId: lesson.classroom.id,
        classroom: lesson.classroom,
        gradeId: "grade-1",
        grade: { id: "grade-1", nameAr: "الصف الأول", nameEn: "Grade 1" },
        effectiveConfig: otherConfig,
        configs: [otherConfig, config],
        periods: [period],
        entries: [lesson],
      },
    ],
  };
}

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof TimetableConflictDialog>> = {},
) {
  return render(
    <TimetableConflictDialog
      conflict={conflict}
      academicYearId="year-1"
      termId="term-1"
      hasUnsavedLessons={false}
      onFocusCurrent={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

function fixtureResponse(
  url: string,
  config?: { params?: Record<string, unknown> },
) {
  if (url.endsWith(`/entries/${lessonA.id}`)) return lessonA;
  if (url.endsWith(`/entries/${lessonB.id}`)) return lessonB;
  if (url.endsWith("/all"))
    return dashboardFor(
      config?.params?.classroomId === "class-b" ? lessonB : lessonA,
    );
  throw new Error(`Unexpected request: ${url}`);
}

describe("TimetableConflictDialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(apiGet).mockImplementation(async (url, config) =>
      fixtureResponse(url, config),
    );
  });

  it("opens either classroom using the linked configuration and its own overlapping period", async () => {
    const user = userEvent.setup();
    renderDialog();

    const classB = await screen.findByRole("article", { name: "Class B" });
    expect(within(classB).getByText("9:15 AM - 10:00 AM")).toBeInTheDocument();
    expect(within(classB).getByText("scopes.classroom")).toBeInTheDocument();
    const newTab = within(classB).getByRole("link", { name: "openNewTab" });
    expect(newTab).toHaveAttribute("target", "_blank");
    expect(newTab).toHaveAttribute("rel", "noopener noreferrer");
    expect(newTab).toHaveAttribute(
      "href",
      "/en/academics/timetable?year=year-1&term=term-1&classroom=class-b&configuration=config-b&entry=lesson-b&configurationScope=CLASSROOM&scopeId=class-b",
    );
    await user.click(
      within(classB).getByRole("button", { name: "openClassroom" }),
    );
    const preview = await screen.findByRole("region", {
      name: "classroomTimetable",
    });
    await within(preview).findByText("Schedule Class B");
    expect(
      within(preview).getByRole("cell", { current: true }),
    ).toHaveTextContent("Science");
    expect(
      within(preview).getByRole("row", { name: /Period B/ }),
    ).toBeInTheDocument();
    expect(within(preview).queryByText("Period A")).not.toBeInTheDocument();
    expect(
      within(within(preview).getByRole("cell", { current: true })).getByRole(
        "button",
      ),
    ).toBeDisabled();
    expect(
      screen.queryByText("Another published configuration"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "back" }));
    await user.click(
      within(screen.getByRole("article", { name: "Class A" })).getByRole(
        "button",
        { name: "openClassroom" },
      ),
    );
    await screen.findByText("Schedule Class A");
    expect(screen.getByRole("cell", { current: true })).toHaveTextContent(
      "Mathematics",
    );
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("keeps accessible lessons available when another linked entry cannot be loaded", async () => {
    vi.mocked(apiGet).mockRejectedValueOnce(new Error("Forbidden"));
    renderDialog();
    expect(await screen.findByRole("alert")).toHaveTextContent("unavailable");
    expect(
      screen.getByRole("article", { name: "Class B" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "Class A" }),
    ).not.toBeInTheDocument();
  });

  it("offers a retry without showing the previous timetable when its classroom read fails", async () => {
    const user = userEvent.setup();
    let classroomReads = 0;
    vi.mocked(apiGet).mockImplementation(async (url, config) => {
      if (
        url.endsWith("/all") &&
        config?.params?.classroomId === "class-a" &&
        ++classroomReads === 2
      )
        throw new Error("Network unavailable");
      return fixtureResponse(url, config);
    });
    renderDialog();
    await user.click(
      within(await screen.findByRole("article", { name: "Class A" })).getByRole(
        "button",
        { name: "openClassroom" },
      ),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "timetableUnavailable",
    );
    await user.click(screen.getByRole("button", { name: "retry" }));
    expect(await screen.findByText("Schedule Class A")).toBeInTheDocument();
  });

  it("does not substitute an effective timetable when the referenced configuration is missing", async () => {
    const user = userEvent.setup();
    const dashboard = dashboardFor(lessonB);
    dashboard.items[0].configs = [dashboard.items[0].effectiveConfig!];
    vi.mocked(apiGet).mockImplementation(async (url, config) =>
      url.endsWith("/all") && config?.params?.classroomId === "class-b"
        ? dashboard
        : fixtureResponse(url, config),
    );
    renderDialog();
    await user.click(
      within(await screen.findByRole("article", { name: "Class B" })).getByRole(
        "button",
        { name: "openClassroom" },
      ),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "timetableUnavailable",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("highlights the latest saved period if the lesson moved after the conflict was checked", async () => {
    const user = userEvent.setup();
    const moved = {
      ...lessonB,
      periodId: "new-period",
      dayOfWeek: 2,
      period: {
        ...lessonB.period,
        id: "new-period",
        index: 6,
        label: "Updated period",
        startTime: "11:00",
        endTime: "11:45",
      },
    };
    vi.mocked(apiGet).mockImplementation(async (url, config) =>
      url.endsWith("/all") && config?.params?.classroomId === "class-b"
        ? dashboardFor(moved)
        : fixtureResponse(url, config),
    );
    renderDialog();
    await user.click(
      within(await screen.findByRole("article", { name: "Class B" })).getByRole(
        "button",
        { name: "openClassroom" },
      ),
    );
    await screen.findByText("Schedule Class B");
    expect(screen.getByRole("cell", { current: true })).toHaveTextContent(
      "Science",
    );
    expect(
      screen.getByRole("row", { name: /Updated period/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Period B")).not.toBeInTheDocument();
  });

  it("returns to an unsaved workspace lesson without saving it", async () => {
    const user = userEvent.setup();
    const onFocusCurrent = vi.fn();
    renderDialog({
      conflict: { ...conflict, entryIds: [], proposedIndexes: [0] },
      hasUnsavedLessons: true,
      onFocusCurrent,
    });
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "showUnsaved" }));
    expect(onFocusCurrent).toHaveBeenCalledOnce();
    expect(apiPost).not.toHaveBeenCalled();
  });
  it.each(["TERM", "STAGE", "GRADE", "SECTION", "CLASSROOM"])(
    "shows the linked %s configuration scope instead of the effective configuration",
    async (scopeType) => {
      const dashboard = dashboardFor(lessonB);
      dashboard.items[0].configs[1].scopeType = scopeType.toLowerCase();
      dashboard.items[0].configs[1].scopeKey = `${scopeType}:scope-b`;
      vi.mocked(apiGet).mockImplementation(async (url, config) =>
        url.endsWith("/all") && config?.params?.classroomId === "class-b"
          ? dashboard
          : fixtureResponse(url, config),
      );
      renderDialog();
      const classroom = await screen.findByRole("article", { name: "Class B" });
      expect(
        within(classroom).getByText(`scopes.${scopeType.toLowerCase()}`),
      ).toBeInTheDocument();
      expect(
        within(classroom).getByText("Schedule Class B"),
      ).toBeInTheDocument();
      const href = within(classroom)
        .getByRole("link", { name: "openNewTab" })
        .getAttribute("href")!;
      const url = new URL(href, "https://dashboard.example");
      expect(url.pathname).toBe("/en/academics/timetable");
      expect(url.searchParams.get("configurationScope")).toBe(scopeType);
      expect(url.searchParams.get("scopeId")).toBe("scope-b");
      expect(
        within(classroom).queryByText("Another published configuration"),
      ).not.toBeInTheDocument();
    },
  );

  it("keeps the lesson and new-tab action available when scope metadata fails", async () => {
    vi.mocked(apiGet).mockImplementation(async (url, config) => {
      if (url.endsWith("/all")) throw new Error("Network unavailable");
      return fixtureResponse(url, config);
    });
    renderDialog();
    const classroom = await screen.findByRole("article", { name: "Class B" });
    expect(within(classroom).getByText("scopeUnavailable")).toBeInTheDocument();
    expect(
      within(classroom).getByRole("link", { name: "openNewTab" }),
    ).toBeInTheDocument();
  });
});
