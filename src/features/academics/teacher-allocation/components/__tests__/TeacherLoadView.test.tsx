import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherLoadView from "@/features/academics/teacher-allocation/components/TeacherLoadView";
import {
  fetchTeacherLoads,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TeacherLoadViewModel } from "@/features/academics/teacher-allocation/services/teacherAllocationMappers";

const navigation = vi.hoisted(() => ({ query: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherLoads: vi.fn(),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showToast: vi.fn(),
  }),
}));

vi.mock("next-intl", () => {
  const translations: Record<string, string> = {
    "academics.teacherAllocation.load.kpi.teachers": "Teachers",
    "academics.teacherAllocation.load.kpi.allocations": "Allocations",
    "academics.teacherAllocation.load.kpi.weeklyHours": "Weekly hours",
    "academics.teacherAllocation.load.kpi.warnings": "Warnings",
    "academics.teacherAllocation.load.filters.teacher": "Teacher",
    "academics.teacherAllocation.load.filters.allTeachers": "All teachers",
    "academics.teacherAllocation.load.teacherSummary.allocations": "{count} allocations",
    "academics.teacherAllocation.load.teacherSummary.weeklyHours": "{count} weekly hours",
    "academics.teacherAllocation.load.teacherSummary.classrooms": "{count} classrooms",
    "academics.teacherAllocation.load.teacherSummary.subjects": "{count} subjects",
    "academics.teacherAllocation.load.teacherSummary.warnings": "{count} warnings",
    "academics.teacherAllocation.load.loadingTeacherLoads": "Loading teacher loads...",
    "academics.teacherAllocation.load.empty": "No teacher loads returned.",
    "academics.teacherAllocation.load.noAssignments": "No assignments returned.",
    "academics.teacherAllocation.load.title": "Teacher Workload",
    "academics.teacherAllocation.load.metrics.allocationCount": "Allocation count",
    "academics.teacherAllocation.load.metrics.totalWeeklyHours": "Total weekly hours",
    "academics.teacherAllocation.load.metrics.classroomsCount": "Classrooms count",
    "academics.teacherAllocation.load.metrics.subjectsCount": "Subjects count",
    "academics.teacherAllocation.load.metrics.weeklyHours": "Weekly hours",
    "academics.teacherAllocation.load.metrics.warnings": "Warnings",
    "academics.teacherAllocation.load.breakdown.grade": "Grade",
    "academics.teacherAllocation.load.breakdown.classroom": "Classroom",
    "academics.teacherAllocation.load.breakdown.subject": "Subject",
    "academics.export.button": "Export",
    "academics.export.title": "Export",
  };

  return {
    useLocale: () => "en",
    useTranslations: (namespace: string) => (
      key: string,
      values?: Record<string, string | number>,
    ) => {
      const message = translations[`${namespace}.${key}`] ?? key;
      return Object.entries(values ?? {}).reduce(
        (currentMessage, [valueKey, value]) =>
          currentMessage.replace(`{${valueKey}}`, String(value)),
        message,
      );
    },
  };
});

const mockedFetchTeacherLoads = vi.mocked(fetchTeacherLoads);

const teachers: Teacher[] = [
  {
    id: "teacher-user-1",
    nameAr: "Teacher One AR",
    nameEn: "Teacher One",
    isActive: true,
  },
];

function workloads(count: number): TeacherLoadViewModel[] {
  return Array.from({ length: count }, (_, index) => ({
    teacherId: `teacher-${index + 1}`,
    teacherName: `Teacher ${index + 1}`,
    totalWeeklyPeriods: 0,
    assignmentCount: 0,
    classroomsCount: 0,
    subjectsCount: 0,
    warningsCount: 0,
    warnings: [],
    assignments: [],
  }));
}

describe("TeacherLoadView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.query = "";
  });

  it("shows a workload skeleton until the request completes", async () => {
    mockedFetchTeacherLoads.mockResolvedValueOnce([]);
    render(<TeacherLoadView termId="term-1" teachers={teachers} />);

    expect(screen.getByRole("status", { name: "Loading teacher loads..." })).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByText("No teacher loads returned.")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading teacher loads..." })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "next_page" })).not.toBeInTheDocument();
  });

  it.each([1, 10])("disables navigation when %i teachers fit on one page", async (count) => {
    mockedFetchTeacherLoads.mockResolvedValueOnce(workloads(count));
    render(<TeacherLoadView termId="term-1" teachers={teachers} />);
    await screen.findByRole("heading", { name: "Teacher 1" });
    expect(screen.getByRole("button", { name: "previous_page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "next_page" })).toBeDisabled();
  });

  it("navigates partial pages and resets the page when increasing page size", async () => {
    mockedFetchTeacherLoads.mockResolvedValueOnce(workloads(21));
    render(<TeacherLoadView termId="term-1" teachers={teachers} />);
    await screen.findByRole("heading", { name: "Teacher 1" });

    expect(screen.getAllByRole("heading", { name: /Teacher \d+/ })).toHaveLength(10);
    expect(screen.getByText("Teachers").parentElement).toHaveTextContent("21");
    fireEvent.click(screen.getByRole("button", { name: "next_page" }));
    expect(screen.getByRole("heading", { name: "Teacher 11" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Teacher 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "next_page" }));
    expect(screen.getAllByRole("heading", { name: /Teacher \d+/ })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Teacher 21" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "next_page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "previous_page" }));
    expect(screen.getByRole("heading", { name: "Teacher 11" })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("show"));
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    expect(screen.getAllByRole("heading", { name: /Teacher \d+/ })).toHaveLength(21);
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("returns to the first page when the teacher filter results change", async () => {
    mockedFetchTeacherLoads.mockResolvedValue(workloads(11));
    const { rerender } = render(<TeacherLoadView termId="term-1" teachers={teachers} />);
    await screen.findByRole("heading", { name: "Teacher 1" });
    fireEvent.click(screen.getByRole("button", { name: "next_page" }));
    expect(screen.getByRole("heading", { name: "Teacher 11" })).toBeInTheDocument();

    navigation.query = "loadTeacher=teacher-1";
    rerender(<TeacherLoadView termId="term-1" teachers={teachers} />);

    expect(await screen.findByRole("heading", { name: "Teacher 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "previous_page" })).toBeDisabled();
  });

  it("loads teacher loads from the backend endpoint service", async () => {
    mockedFetchTeacherLoads.mockResolvedValueOnce([
      {
        teacherId: "teacher-user-1",
        teacherName: "Teacher One",
        totalWeeklyPeriods: 5,
        assignmentCount: 1,
        classroomsCount: 1,
        subjectsCount: 1,
        warningsCount: 0,
        warnings: [],
        assignments: [
          {
            allocationId: "allocation-1",
            gradeId: "grade-1",
            gradeNameAr: "Grade 1 AR",
            gradeNameEn: "Grade 1",
            classroomId: "classroom-1",
            classroomNameAr: "Classroom A AR",
            classroomNameEn: "Classroom A",
            subjectId: "subject-1",
            subjectNameAr: "Math AR",
            subjectNameEn: "Math",
            weeklyHours: 5,
          },
        ],
      },
    ]);

    render(<TeacherLoadView termId="term-1" teachers={teachers} />);

    await waitFor(() => {
      expect(mockedFetchTeacherLoads).toHaveBeenCalledWith({
        termId: "term-1",
      });
    });
    expect(await screen.findByRole("heading", { name: "Teacher One" })).toBeInTheDocument();
    expect(screen.getByText("1 allocations")).toBeInTheDocument();
    expect(screen.getByText("5 weekly hours")).toBeInTheDocument();
  });
});
