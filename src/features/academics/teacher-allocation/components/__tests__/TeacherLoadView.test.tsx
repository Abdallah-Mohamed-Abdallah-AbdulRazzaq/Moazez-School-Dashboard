import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherLoadView from "@/features/academics/teacher-allocation/components/TeacherLoadView";
import {
  fetchTeacherLoads,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

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

describe("TeacherLoadView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        teacherUserId: undefined,
      });
    });
    expect(await screen.findByRole("heading", { name: "Teacher One" })).toBeInTheDocument();
    expect(screen.getByText("1 allocations")).toBeInTheDocument();
    expect(screen.getByText("5 weekly hours")).toBeInTheDocument();
  });
});
