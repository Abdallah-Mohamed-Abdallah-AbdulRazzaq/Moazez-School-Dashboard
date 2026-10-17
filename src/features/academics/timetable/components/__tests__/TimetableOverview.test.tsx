import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiWithToken } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
  PublicationResponse,
  TimetableDashboardAllResponseDto,
} from "../../services/timetableApiTypes";
import TimetableOverview from "../TimetableOverview";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams("year=year-1&term=term-1"),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));
vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiWithToken: vi.fn() }));
vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const messages = (await import("@/messages/en.json")).default;
  return {
    ...actual,
    useLocale: () => "en",
    useTranslations: (namespace: string) =>
      actual.createTranslator({ locale: "en", messages, namespace }),
  };
});

const termConfig: BackendTimetableConfigDto = {
  id: "term-config",
  name: "School timetable",
  academicYearId: "year-1",
  termId: "term-1",
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  status: "draft",
  activeDays: [0, 1, 2, 3, 4],
  weekStartDay: 0,
  createdAt: "2026-10-16",
  updatedAt: "2026-10-16",
};
const tree = {
  stages: [{ id: "stage-1", nameAr: "الابتدائية", nameEn: "Primary" }],
  grades: [
    { id: "grade-1", stageId: "stage-1", nameAr: "الأول", nameEn: "Grade 1" },
  ],
  sections: [
    { id: "section-1", gradeId: "grade-1", nameAr: "أ", nameEn: "Section A" },
  ],
  classrooms: ["1A", "1B"].map((name, index) => ({
    id: `class-${index + 1}`,
    sectionId: "section-1",
    nameAr: name,
    nameEn: name,
  })),
};
const dashboard: TimetableDashboardAllResponseDto = {
  termId: "term-1",
  academicYearId: "year-1",
  isPublished: false,
  publishedAt: null,
  items: tree.classrooms.map((classroom) => ({
    classroomId: classroom.id,
    classroom,
    gradeId: "grade-1",
    grade: tree.grades[0],
    effectiveConfig: termConfig,
    configs: [termConfig],
    periods: [],
    entries: [],
  })),
};
const publication: PublicationResponse = {
  timetableConfigId: "term-config",
  status: "draft",
  canPublish: false,
  blockingReasons: [],
  publishedAt: null,
};
const page = (readOnly = false) => (
  <TimetableOverview
    academicYearId="year-1"
    termId="term-1"
    contextName="2026/2027 · First term"
    readOnly={readOnly}
  />
);

describe("TimetableOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiWithToken).mockResolvedValue({ data: tree });
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? dashboard
        : url.endsWith("/publication")
          ? publication
          : termConfig,
    );
  });

  it("deduplicates shared configurations and opens their explicit scope", async () => {
    const user = userEvent.setup();
    render(page());
    expect(await screen.findByText("Configurations (1)")).toBeInTheDocument();
    expect(
      screen.getByText("2 classrooms in scope · currently used by 2"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open timetable" }));
    const query = new URLSearchParams(
      navigation.push.mock.calls[0][0].slice(1),
    );
    expect(Object.fromEntries(query)).toEqual({
      year: "year-1",
      term: "term-1",
      workspace: "1",
      configurationScope: "TERM",
      configuration: "term-config",
    });
  });

  it("combines classroom search with scope and status filters and clears them", async () => {
    const user = userEvent.setup();
    const classroomConfig = {
      ...termConfig,
      id: "class-config",
      name: "Specific timetable",
      scopeType: "classroom",
      scopeKey: "classroom:class-1",
      classroomId: "class-1",
      status: "archived",
    };
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? {
            ...dashboard,
            items: dashboard.items.map((item) => ({
              ...item,
              configs: [termConfig, classroomConfig],
            })),
          }
        : url.endsWith("/publication")
          ? publication
          : termConfig,
    );
    render(page());
    const search = await screen.findByRole("searchbox", {
      name: "Find a timetable",
    });
    await user.type(search, "1B");
    expect(screen.queryByText("Specific timetable")).not.toBeInTheDocument();
    expect(screen.getByText("School timetable")).toBeInTheDocument();
    await user.clear(search);
    await user.click(
      screen.getByRole("button", { name: "Scope", exact: true }),
    );
    await user.click(
      screen.getByRole("button", { name: "Classroom", exact: true }),
    );
    expect(screen.getByText("Specific timetable")).toBeInTheDocument();
    expect(screen.queryByText("School timetable")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Status", exact: true }),
    );
    await user.click(
      screen.getByRole("button", { name: "Draft", exact: true }),
    );
    expect(
      screen.getByText("No configurations match your filters"),
    ).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Clear filters" })[0],
    );
    expect(screen.getByText("Specific timetable")).toBeInTheDocument();
    expect(screen.getByText("School timetable")).toBeInTheDocument();
  });

  it("opens an overridden classroom using its effective configuration scope", async () => {
    const user = userEvent.setup();
    const gradeConfig = {
      ...termConfig,
      id: "grade-config",
      name: "Grade timetable",
      scopeType: "grade",
      scopeKey: "grade:grade-1",
      gradeId: "grade-1",
    };
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? {
            ...dashboard,
            items: dashboard.items.map((item, index) => ({
              ...item,
              effectiveConfig: index === 0 ? gradeConfig : termConfig,
              configs: [termConfig, gradeConfig],
            })),
          }
        : url.endsWith("/publication")
          ? publication
          : termConfig,
    );
    render(page());
    await user.click(
      await screen.findByRole("button", { name: "More specific timetable: 1" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Primary › Grade 1 › Section A › 1A"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/1B/)).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Open timetable" }),
    );
    const query = new URLSearchParams(
      navigation.push.mock.calls[0][0].slice(1),
    );
    expect(query.get("configuration")).toBe("grade-config");
    expect(query.get("configurationScope")).toBe("GRADE");
    expect(query.get("scopeId")).toBe("grade-1");
    expect(query.get("classroom")).toBe("class-1");
    expect(query.has("configure")).toBe(false);
  });

  it.each([false, true])(
    "opens the classroom's saved draft without creating a duplicate (read-only: %s)",
    async (readOnly) => {
      const user = userEvent.setup();
      const draft = {
        ...termConfig,
        id: "class-draft",
        name: "Classroom draft",
        scopeType: "classroom",
        scopeKey: "classroom:class-1",
        classroomId: "class-1",
      };
      const savedLesson: BackendTimetableEntryDto = {
        id: "saved-draft-lesson",
        timetableConfigId: draft.id,
        periodId: "period-1",
        dayOfWeek: 0,
        period: {
          id: "period-1",
          index: 1,
          label: "First lesson",
          startTime: "08:00",
          endTime: "08:45",
        },
        classroom: tree.classrooms[0],
        subject: { id: "subject-1", nameAr: "Math", nameEn: "Math" },
        teacher: null,
        room: null,
        teacherSubjectAllocationId: "allocation-1",
        notes: null,
        status: "draft",
        createdAt: "2026-10-16",
        updatedAt: "2026-10-16",
      };
      vi.mocked(apiGet).mockImplementation(async (url) =>
        url.endsWith("/all")
          ? {
              ...dashboard,
              items: dashboard.items.map((item, index) => ({
                ...item,
                effectiveConfig: index === 0 ? null : termConfig,
                configs: [termConfig, draft],
                entries:
                  index === 0
                    ? [
                        savedLesson,
                        {
                          ...savedLesson,
                          id: "parent-lesson",
                          timetableConfigId: termConfig.id,
                        },
                        {
                          ...savedLesson,
                          id: "cancelled-draft-lesson",
                          status: "cancelled",
                        },
                      ]
                    : [],
              })),
            }
          : url.endsWith("/publication")
            ? publication
            : termConfig,
      );
      render(page(readOnly));
      await user.click(
        await screen.findByRole("button", { name: "View classrooms" }),
      );
      const dialog = screen.getByRole("dialog");
      expect(
        screen.getByText(
          "1 classroom is not covered by a published timetable. Saved draft lessons may already exist.",
        ),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          "No published timetable applies to this classroom.",
        ),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText("Draft configuration: Classroom draft"),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText("Saved lessons in this classroom: 1"),
      ).toBeInTheDocument();
      const openDraft = within(dialog).getByRole("button", {
        name: "Open draft timetable",
      });
      expect(openDraft).toBeEnabled();
      await user.click(openDraft);
      const query = new URLSearchParams(
        navigation.push.mock.calls[0][0].slice(1),
      );
      expect(query.get("configuration")).toBe("class-draft");
      expect(query.get("configurationScope")).toBe("CLASSROOM");
      expect(query.get("classroom")).toBe("class-1");
      expect(query.has("configure")).toBe(false);
    },
  );

  it("keeps uncovered classroom creation disabled for read-only users", async () => {
    const user = userEvent.setup();
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? {
            ...dashboard,
            items: dashboard.items.map((item) => ({
              ...item,
              effectiveConfig: null,
            })),
          }
        : url.endsWith("/publication")
          ? publication
          : termConfig,
    );
    render(page(true));
    await user.click(
      await screen.findByRole("button", { name: "View classrooms" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getAllByRole("button", { name: "Configure classroom" }),
    ).toHaveLength(2);
    within(dialog)
      .getAllByRole("button", { name: "Configure classroom" })
      .forEach((button) => expect(button).toBeDisabled());
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it.each([
    ["section", "section-1", "Primary \u203a Grade 1 \u203a Section A"],
    ["grade", "grade-1", "Primary \u203a Grade 1"],
    ["stage", "stage-1", "Primary"],
  ])(
    "opens the nearest configured %s ancestor even when intermediate scopes are missing",
    async (scopeType, scopeId, parentLabel) => {
      const user = userEvent.setup();
      const parent = {
        ...termConfig,
        id: "parent-config",
        scopeType,
        scopeKey: `${scopeType}:${scopeId}`,
        stageId: scopeType === "stage" ? scopeId : null,
      };
      const classroomConfig = {
        ...termConfig,
        id: "class-config",
        name: "Classroom settings",
        scopeType: "classroom",
        scopeKey: "classroom:class-1",
        classroomId: "class-1",
      };
      const sibling = {
        ...parent,
        id: "sibling-config",
        scopeKey: `${scopeType}:unrelated`,
        stageId: scopeType === "stage" ? "unrelated" : null,
      };
      vi.mocked(apiGet).mockImplementation(async (url) =>
        url.endsWith("/all")
          ? {
              ...dashboard,
              items: dashboard.items.map((item) => ({
                ...item,
                configs: [termConfig, sibling, parent, classroomConfig],
              })),
            }
          : url.endsWith("/publication")
            ? publication
            : termConfig,
      );
      render(page());
      const row = await screen.findByRole("article", {
        name: "Primary \u203a Grade 1 \u203a Section A \u203a 1A",
      });
      await user.click(
        within(row).getByRole("button", {
          name: `Parent configuration: ${parentLabel}`,
        }),
      );
      const query = new URLSearchParams(
        navigation.push.mock.calls[0][0].slice(1),
      );
      expect(query.get("configuration")).toBe("parent-config");
      expect(query.get("configurationScope")).toBe(scopeType.toUpperCase());
      expect(query.get("scopeId")).toBe(scopeId);
    },
  );

  it.each([
    {
      activeDays: [],
      instructionalPeriodsCount: 0,
      completed: 0,
      next: "Choose timetable days",
    },
    {
      activeDays: [0, 1],
      instructionalPeriodsCount: 0,
      completed: 1,
      next: "Add instructional periods",
    },
    {
      activeDays: [0, 1],
      instructionalPeriodsCount: 1,
      completed: 2,
      next: "Add lessons",
    },
  ])(
    "continues the explicit scope when the next setup step is $next",
    async ({ activeDays, instructionalPeriodsCount, completed, next }) => {
      const user = userEvent.setup();
      vi.mocked(apiGet).mockImplementation(async (url) =>
        url.endsWith("/all")
          ? dashboard
          : url.endsWith("/publication")
            ? {
                ...publication,
                summary: {
                  periodsCount: 2,
                  instructionalPeriodsCount,
                  entriesCount: 0,
                  conflictsCount: 0,
                  activeDays,
                  scopeType: "term",
                  academicYearId: "year-1",
                  termId: "term-1",
                },
              }
            : termConfig,
      );
      render(page());
      expect(await screen.findByText(next)).toBeInTheDocument();
      expect(
        screen.getByRole("progressbar", {
          name: `Setup checkpoints: ${completed}/3`,
        }),
      ).toHaveAttribute("value", String(completed));
      await user.click(
        screen.getByRole("button", { name: "Needs attention", exact: true }),
      );
      await user.click(
        screen.getByRole("button", { name: "Setup incomplete", exact: true }),
      );
      expect(screen.getByText("School timetable")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Continue timetable" }),
      );
      const query = new URLSearchParams(
        navigation.push.mock.calls[0][0].slice(1),
      );
      expect(query.get("configuration")).toBe("term-config");
      expect(query.get("configurationScope")).toBe("TERM");
      expect(
        vi
          .mocked(apiGet)
          .mock.calls.filter(([url]) => url.endsWith("/publication")),
      ).toHaveLength(1);
    },
  );

  it("filters reported review issues without treating missing progress as incomplete", async () => {
    const user = userEvent.setup();
    const gradeConfig = {
      ...termConfig,
      id: "grade-config",
      name: "Grade needs review",
      scopeType: "grade",
      scopeKey: "grade:grade-1",
    };
    vi.mocked(apiGet).mockImplementation(async (url, options) =>
      url.endsWith("/all")
        ? {
            ...dashboard,
            items: dashboard.items.map((item) => ({
              ...item,
              configs: [termConfig, gradeConfig],
            })),
          }
        : url.endsWith("/publication")
          ? options?.params?.timetableConfigId === "grade-config"
            ? {
                ...publication,
                timetableConfigId: "grade-config",
                blockingReasons: [
                  {
                    code: "teacher_conflict",
                    message: "Teacher is double booked",
                  },
                ],
                summary: {
                  periodsCount: 1,
                  instructionalPeriodsCount: 1,
                  entriesCount: 5,
                  conflictsCount: 1,
                  activeDays: [0],
                  scopeType: "grade",
                  academicYearId: "year-1",
                  termId: "term-1",
                },
              }
            : publication
          : termConfig,
    );
    render(page());
    expect(
      await screen.findByText(
        "Review the reported issues in the timetable workspace.",
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Needs attention", exact: true }),
    );
    await user.click(
      screen.getByRole("button", { name: "Review issues", exact: true }),
    );
    expect(screen.getByText("Grade needs review")).toBeInTheDocument();
    expect(screen.queryByText("School timetable")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Needs attention", exact: true }),
    );
    await user.click(
      screen.getByRole("button", { name: "Setup incomplete", exact: true }),
    );
    expect(
      screen.getByText("No configurations match your filters"),
    ).toBeInTheDocument();
  });

  it("opens the existing school-wide configuration from the creation dialog", async () => {
    const user = userEvent.setup();
    render(page());
    await user.click(
      await screen.findByRole("button", { name: "Create timetable" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Open existing configuration" }),
    );
    const query = new URLSearchParams(
      navigation.push.mock.calls[0][0].slice(1),
    );
    expect(query.get("configuration")).toBe("term-config");
    expect(query.get("configurationScope")).toBe("TERM");
    expect(query.has("configure")).toBe(false);
  });

  it("keeps configurations visible for scopes that do not have classrooms yet", async () => {
    vi.mocked(apiWithToken).mockResolvedValue({
      data: { ...tree, classrooms: [] },
    });
    const stageConfig = {
      ...termConfig,
      id: "empty-stage-config",
      name: "Upcoming stage timetable",
      scopeType: "stage",
      scopeKey: "stage:stage-1",
      stageId: "stage-1",
    };
    vi.mocked(apiGet).mockImplementation(async (url, options) => {
      if (url.endsWith("/all")) return { ...dashboard, items: [] };
      if (url.endsWith("/publication")) return publication;
      if (options?.params?.scopeType === "TERM") return termConfig;
      if (options?.params?.scopeType === "STAGE") return stageConfig;
      throw new ApiError(
        "Missing configuration",
        404,
        "academics.timetable.config_not_found",
      );
    });
    render(page());
    expect(await screen.findByText("Configurations (2)")).toBeInTheDocument();
    expect(screen.getByText("Upcoming stage timetable")).toBeInTheDocument();
    expect(
      screen.getAllByText("0 classrooms in scope · currently used by 0"),
    ).toHaveLength(2);
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Find a timetable" }),
      "\u0627\u0644\u0627\u0628\u062a\u062f\u0627\u0626\u064a\u0629",
    );
    expect(screen.getByText("Upcoming stage timetable")).toBeInTheDocument();
    expect(screen.queryByText("School timetable")).not.toBeInTheDocument();
  });

  it("previews a custom scope and its inheritance before opening configuration", async () => {
    const user = userEvent.setup();
    render(page());
    await user.click(
      await screen.findByRole("button", { name: "Create timetable" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("radio", { name: /Custom configuration/ }),
    );
    expect(
      within(dialog).getByRole("button", { name: "Continue to configuration" }),
    ).toBeDisabled();
    await user.click(within(dialog).getByLabelText("Apply to"));
    await user.click(await screen.findByRole("button", { name: "Primary" }));
    expect(
      within(dialog).getByText("2 classrooms in this scope"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Primary › Grade 1 › Section A › 1B"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Current configuration sources: School timetable/,
      ),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Continue to configuration" }),
    );
    const query = new URLSearchParams(
      navigation.push.mock.calls[0][0].slice(1),
    );
    expect(query.get("configurationScope")).toBe("STAGE");
    expect(query.get("scopeId")).toBe("stage-1");
    expect(query.has("configuration")).toBe(false);
  });

  it("routes a missing school-wide default to setup with the selected academic context", async () => {
    vi.mocked(apiGet).mockImplementation(async (url) => {
      if (url.endsWith("/all")) return { ...dashboard, items: [] };
      throw new ApiError(
        "Missing configuration",
        404,
        "academics.timetable.config_not_found",
      );
    });
    const user = userEvent.setup();
    render(page());
    await screen.findByText("Start with a timetable configuration");
    await user.click(
      screen.getAllByRole("button", { name: "Create timetable" })[0],
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to configuration" }),
    );
    const destination = new URL(
      navigation.push.mock.calls[0][0],
      "https://school.test",
    );
    expect(destination.pathname).toBe("/academics/timetable/setup");
    expect(destination.searchParams.get("year")).toBe("year-1");
    expect(destination.searchParams.get("term")).toBe("term-1");
  });

  it("opens an existing custom configuration instead of starting a duplicate", async () => {
    const stageConfig = {
      ...termConfig,
      id: "stage-config",
      scopeType: "stage",
      scopeKey: "stage:stage-1",
      stageId: "stage-1",
    };
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? {
            ...dashboard,
            items: dashboard.items.map((item) => ({
              ...item,
              configs: [termConfig, stageConfig],
            })),
          }
        : url.endsWith("/publication")
          ? publication
          : termConfig,
    );
    const user = userEvent.setup();
    render(page());
    await user.click(
      await screen.findByRole("button", { name: "Create timetable" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("radio", { name: /Custom configuration/ }),
    );
    await user.click(within(dialog).getByLabelText("Apply to"));
    await user.click(await screen.findByRole("button", { name: "Primary" }));
    await user.click(
      within(dialog).getByRole("button", {
        name: "Open existing configuration",
      }),
    );
    const query = new URLSearchParams(
      navigation.push.mock.calls[0][0].slice(1),
    );
    expect(query.get("configuration")).toBe("stage-config");
    expect(query.get("configurationScope")).toBe("STAGE");
    expect(query.has("configure")).toBe(false);
  });

  it("does not duplicate overview requests during development effect replay", async () => {
    render(<StrictMode>{page()}</StrictMode>);
    await screen.findByText("School timetable");
    expect(
      vi.mocked(apiGet).mock.calls.filter(([url]) => url.endsWith("/all")),
    ).toHaveLength(1);
    expect(vi.mocked(apiWithToken).mock.calls).toHaveLength(1);
  });

  it("opens configurations before slow publication checks finish", async () => {
    let finishPublication!: (response: PublicationResponse) => void;
    const pendingPublication = new Promise<PublicationResponse>((resolve) => {
      finishPublication = resolve;
    });
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? dashboard
        : url.endsWith("/publication")
          ? pendingPublication
          : termConfig,
    );
    render(page());
    expect(await screen.findByText("School timetable")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open timetable" }),
    ).toBeEnabled();
    expect(screen.getByText("Checking status…")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    await act(async () => {
      finishPublication(publication);
    });
    expect(await screen.findByText("Draft")).toBeInTheDocument();
  });

  it("shows pending filter results until setup checks finish", async () => {
    const user = userEvent.setup();
    let finish!: (response: PublicationResponse) => void;
    const pending = new Promise<PublicationResponse>((resolve) => {
      finish = resolve;
    });
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? dashboard
        : url.endsWith("/publication")
          ? pending
          : termConfig,
    );
    render(page());
    await user.click(
      await screen.findByRole("button", {
        name: "Needs attention",
        exact: true,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Setup incomplete", exact: true }),
    );
    expect(
      screen.getByText("Checking for matching configurations…"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No configurations match your filters"),
    ).not.toBeInTheDocument();
    await act(async () => {
      finish({
        ...publication,
        summary: {
          periodsCount: 0,
          instructionalPeriodsCount: 0,
          entriesCount: 0,
          conflictsCount: 0,
          activeDays: [0],
          scopeType: "term",
          academicYearId: "year-1",
          termId: "term-1",
        },
      });
    });
    expect(
      await screen.findByText("Add instructional periods"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Checking for matching configurations…"),
    ).not.toBeInTheDocument();
  });

  it("keeps configurations available when publication status fails and retries only the failed status", async () => {
    let publicationUnavailable = true;
    vi.mocked(apiGet).mockImplementation(async (url) => {
      if (url.endsWith("/all")) return dashboard;
      if (!url.endsWith("/publication")) return termConfig;
      if (publicationUnavailable) throw new ApiError("Unavailable", 503);
      return publication;
    });
    const user = userEvent.setup();
    render(page());
    expect(await screen.findByText("Status unavailable")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open timetable" }),
    ).toBeEnabled();
    vi.mocked(apiGet).mockClear();
    publicationUnavailable = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Draft")).toBeInTheDocument();
    expect(vi.mocked(apiGet).mock.calls.map(([url]) => url)).toEqual([
      "/academics/timetable/publication",
    ]);
  });

  it("stops queued status checks and ignores old results after changing terms", async () => {
    const finishChecks: Array<(response: PublicationResponse) => void> = [];
    const configurations = [
      termConfig,
      ...["stage", "grade", "classroom"].map((scopeType) => ({
        ...termConfig,
        id: `${scopeType}-config`,
        name: `${scopeType} timetable`,
        scopeType,
        scopeKey: `${scopeType}:${scopeType === "classroom" ? "class-1" : `${scopeType}-1`}`,
        stageId: scopeType === "stage" ? "stage-1" : null,
      })),
    ];
    vi.mocked(apiGet).mockImplementation(async (url, options) => {
      if (url.endsWith("/publication"))
        return new Promise<PublicationResponse>((resolve) =>
          finishChecks.push(resolve),
        );
      if (url.endsWith("/all"))
        return options?.params?.termId === "term-1"
          ? {
              ...dashboard,
              items: dashboard.items.map((item) => ({
                ...item,
                configs: configurations,
              })),
            }
          : { ...dashboard, termId: "term-2", items: [] };
      if (options?.params?.termId === "term-2")
        throw new ApiError(
          "Missing configuration",
          404,
          "academics.timetable.config_not_found",
        );
      return termConfig;
    });
    const { rerender } = render(page());
    await screen.findByText("Configurations (4)");
    expect(finishChecks).toHaveLength(3);
    rerender(
      <TimetableOverview
        academicYearId="year-1"
        termId="term-2"
        contextName="Next term"
        readOnly={false}
      />,
    );
    expect(screen.queryByText("School timetable")).not.toBeInTheDocument();
    await screen.findByText("Start with a timetable configuration");
    await act(async () => {
      finishChecks.forEach((finish) =>
        finish({ ...publication, status: "published" }),
      );
    });
    expect(finishChecks).toHaveLength(3);
    expect(screen.queryByText("Published")).not.toBeInTheDocument();
    expect(
      screen.getByText("Start with a timetable configuration"),
    ).toBeInTheDocument();
  });

  it("shows published status even when the dashboard configuration is a draft", async () => {
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/all")
        ? dashboard
        : url.endsWith("/publication")
          ? {
              ...publication,
              status: "published",
              publishedAt: "2026-10-16T08:00:00Z",
            }
          : termConfig,
    );
    render(page());
    expect(await screen.findByText("Published")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue timetable" }),
    ).not.toBeInTheDocument();
  });

  it.each(["superseded", "archived"])(
    "keeps a draft editable when its previous publication is %s",
    async (status) => {
      vi.mocked(apiGet).mockImplementation(async (url) =>
        url.endsWith("/all")
          ? dashboard
          : url.endsWith("/publication")
            ? {
                ...publication,
                status,
                isPublished: false,
                summary: {
                  periodsCount: 1,
                  instructionalPeriodsCount: 1,
                  entriesCount: 1,
                  conflictsCount: 0,
                  activeDays: [0],
                  scopeType: "term",
                  academicYearId: "year-1",
                  termId: "term-1",
                },
              }
            : termConfig,
      );
      const user = userEvent.setup();
      render(page());
      expect(await screen.findByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Review before publishing")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Continue timetable" }),
      );
      const query = new URLSearchParams(
        navigation.push.mock.calls[0][0].slice(1),
      );
      expect(query.get("configuration")).toBe("term-config");
      expect(query.get("configurationScope")).toBe("TERM");
    },
  );

  it("shows a recoverable load error instead of presenting a failed request as an empty timetable", async () => {
    vi.mocked(apiGet).mockRejectedValueOnce(new ApiError("Unavailable", 503));
    const user = userEvent.setup();
    render(page());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Timetable configurations could not be loaded",
    );
    expect(
      screen.queryByText("Start with a timetable configuration"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("School timetable")).toBeInTheDocument();
  });

  it("keeps viewing available while hiding creation for read-only terms or users", async () => {
    render(page(true));
    expect(
      await screen.findByRole("button", { name: "Open timetable" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Create timetable" }),
    ).not.toBeInTheDocument();
  });
});
