import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { annotateTeacherEligibility } from "../../utils/teacherAllocationHelpers";
import TeacherAllocationView from "../TeacherAllocationView";

const navigation = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navigation.query),
  usePathname: () => "/en/academics/teacher-allocation",
}));
vi.mock("@/lib/api", () => ({ apiGet: vi.fn() }));

const saved = {
  id: "allocation-1",
  termId: "term-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
  teacherId: "inactive-user",
  teacherName: "Saved Teacher",
};
const props: ComponentProps<typeof TeacherAllocationView> = {
  academicYearId: "year-1",
  termId: "term-1",
  academicYears: [],
  terms: [],
  canView: true,
  stages: [
    {
      id: "stage-1",
      name: "Primary",
      nameAr: "Primary",
      nameEn: "Primary",
      order: 1,
    },
  ],
  grades: [
    {
      id: "grade-1",
      stageId: "stage-1",
      name: "Grade 1",
      nameAr: "Grade 1",
      nameEn: "Grade 1",
      order: 1,
    },
  ],
  sections: [
    {
      id: "section-1",
      gradeId: "grade-1",
      name: "A",
      nameAr: "A",
      nameEn: "A",
      order: 1,
    },
  ],
  classrooms: [
    {
      id: "classroom-1",
      sectionId: "section-1",
      name: "Classroom A",
      nameAr: "Classroom A",
      nameEn: "Classroom A",
      order: 1,
    },
  ],
  subjects: [
    {
      id: "subject-1",
      name: "Math",
      nameAr: "Math",
      nameEn: "Math",
      isActive: true,
      code: "MATH",
      color: "#000000",
    },
  ],
  subjectAllocations: [
    {
      id: "hours-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      weeklyHours: 5,
    },
  ],
  teachers: [],
  hasTeacherDirectoryAccess: true,
  teacherAllocations: annotateTeacherEligibility([saved], []),
  isLoading: false,
  apiError: null,
  isSaving: false,
  activeTab: "matrix",
  validationPanelOpen: false,
  isReadOnly: false,
  isTermClosed: false,
  onValidate: vi.fn(),
  onAllocationsChange: vi.fn(),
  onRefresh: vi.fn().mockResolvedValue(undefined),
  onRetry: vi.fn().mockResolvedValue(undefined),
  onTabChange: vi.fn(),
  onCloseValidationPanel: vi.fn(),
};

describe("saved teacher allocation visibility", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    navigation.query = "";
  });

  it("keeps saved names visible and flags reassignment with no eligible candidates", () => {
    render(
      <ToastProvider>
        <TeacherAllocationView {...props} />
      </ToastProvider>,
    );
    expect(
      screen.getByRole("button", { name: "selectTeacher" }),
    ).toHaveTextContent("Saved Teacher");
    expect(screen.getByText("matrix.noEligibleTeachers")).toBeInTheDocument();
    expect(screen.getByText("matrix.needsReassignment")).toBeInTheDocument();
    expect(
      screen.getByText("summaryCards.validationStatus.needsReview"),
    ).toBeInTheDocument();
  });

  it("keeps saved names readable without directory permission and disables selection", () => {
    render(
      <ToastProvider>
        <TeacherAllocationView
          {...props}
          hasTeacherDirectoryAccess={false}
          isReadOnly
          teacherAllocations={[saved]}
        />
      </ToastProvider>,
    );
    expect(
      screen.getByRole("button", { name: "selectTeacher" }),
    ).toHaveTextContent("Saved Teacher");
    expect(
      screen.getByRole("button", { name: "selectTeacher" }),
    ).toBeDisabled();
    expect(
      screen.getByText("matrix.teacherDirectoryAccessRequired"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("matrix.needsReassignment"),
    ).not.toBeInTheDocument();
  });

  it("inspects retained inactive assignees using unfiltered backend loads and local filtering", async () => {
    navigation.query = "loadTeacher=inactive-user";
    vi.mocked(apiGet).mockResolvedValue({
      termId: "term-1",
      academicYearId: "year-1",
      items: [
        {
          teacherUserId: "inactive-user",
          teacher: {
            id: "inactive-user",
            firstName: "Saved",
            lastName: "Teacher",
          },
          allocationCount: 1,
          totalWeeklyHours: 5,
          classroomsCount: 1,
          subjectsCount: 1,
          loads: [],
          warnings: [],
        },
        {
          teacherUserId: "active-user",
          teacher: {
            id: "active-user",
            firstName: "Other",
            lastName: "Teacher",
          },
          allocationCount: 1,
          totalWeeklyHours: 5,
          classroomsCount: 1,
          subjectsCount: 1,
          loads: [],
          warnings: [],
        },
      ],
    });
    render(
      <ToastProvider>
        <TeacherAllocationView {...props} activeTab="load" />
      </ToastProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Saved Teacher" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Other Teacher" }),
    ).not.toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith(
      "/academics/allocations/teacher-loads",
      { params: { termId: "term-1" } },
    );
    await userEvent.click(screen.getByLabelText("filters.teacher"));
    expect(
      screen.getByRole("button", { name: "Other Teacher" }),
    ).toBeInTheDocument();
  });
});
