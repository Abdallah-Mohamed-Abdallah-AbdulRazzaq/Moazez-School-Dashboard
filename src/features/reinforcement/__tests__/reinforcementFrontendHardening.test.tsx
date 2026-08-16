import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReinforcementTaskTable from "@/features/reinforcement/components/ReinforcementTaskTable";
import ClassroomSummaryPanel from "@/features/reinforcement/components/ClassroomSummaryPanel";
import StudentProgressCard from "@/features/reinforcement/components/StudentProgressCard";
import XpLedgerTable from "@/features/reinforcement/components/XpLedgerTable";
import ReinforcementTemplateTable from "@/features/reinforcement/components/ReinforcementTemplateTable";
import { buildReinforcementTemplatePayload } from "@/features/reinforcement/components/ReinforcementTemplateForm";
import {
  buildReinforcementTaskPayload,
  getDefaultReinforcementDueDate,
} from "@/features/reinforcement/components/ReinforcementTaskForm";
import {
  createEmptyTaskStage,
  mapTaskStagesToPayload,
} from "@/features/reinforcement/components/ReinforcementTaskStagesEditor";
import { makeManualXpDedupeKey } from "@/features/reinforcement/components/ManualXpGrantModal";
import type { ReinforcementTask, ReinforcementTemplate } from "@/features/reinforcement/types";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "teacher-1",
      firstName: "Teacher",
      lastName: "One",
      email: "teacher@example.com",
      activeMembership: { schoolId: "school-1" },
    },
  }),
}));

describe("Sprint 5A reinforcement frontend hardening", () => {
  it("uses a dynamic default due date of today plus seven days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T09:00:00.000Z"));

    expect(getDefaultReinforcementDueDate()).toBe("2026-05-21");

    vi.useRealTimers();
  });

  it("maps template payload fields without inventing backend fields", () => {
    const payload = buildReinforcementTemplatePayload({
      nameEn: "  Helper ",
      nameAr: "",
      descriptionEn: "Lead peers",
      descriptionAr: "",
      source: "teacher",
      rewardType: "xp",
      rewardValue: "10",
      rewardLabelEn: "XP",
      rewardLabelAr: "نقاط",
      stages: [
        {
          titleEn: "",
          titleAr: "مرحلة",
          descriptionEn: "",
          descriptionAr: "وصف",
          proofType: "image",
          requiresApproval: true,
        },
      ],
    });

    expect(payload).toMatchObject({
      nameEn: "Helper",
      nameAr: "Helper",
      source: "teacher",
      reward: {
        type: "xp",
        value: "10",
        labelAr: "نقاط",
      },
    });
    expect(payload.stages).toEqual([
      {
        sortOrder: 1,
        titleEn: "مرحلة",
        titleAr: "مرحلة",
        descriptionAr: "وصف",
        proofType: "image",
        requiresApproval: true,
      },
    ]);
    expect(payload).not.toHaveProperty("rewardCatalogId");
  });

  it("maps task payload targets and stages without fake assignment IDs", () => {
    const payload = buildReinforcementTaskPayload(
      {
        context: {
          academicYearId: "year-1",
          termId: "term-1",
          subjectId: "subject-1",
        },
        titleEn: "Read",
        titleAr: "",
        descriptionEn: "",
        descriptionAr: "",
        source: "teacher",
        rewardType: "xp",
        rewardValue: "5",
        rewardLabelEn: "",
        rewardLabelAr: "",
        dueDate: "2026-05-21",
        targets: [
          {
            scopeType: "student",
            scopeId: "student-1",
            label: "Student One",
            enrollmentId: "enrollment-1",
          },
        ],
        stages: [
          {
            ...createEmptyTaskStage(),
            titleEn: "Submit proof",
            proofType: "document",
          },
        ],
      },
    );

    expect(payload).not.toHaveProperty("yearId");
    expect(payload).not.toHaveProperty("assignedById");
    expect(payload).not.toHaveProperty("assignedByName");
    expect(payload).not.toHaveProperty("classroomId");
    expect(payload).not.toHaveProperty("studentId");
    expect(payload).not.toHaveProperty("stageId");
    expect(payload).not.toHaveProperty("gradeId");
    expect(payload).not.toHaveProperty("sectionId");
    expect(payload).not.toHaveProperty("enrollmentId");
    expect(payload.targets).toEqual([
      { scopeType: "student", scopeId: "student-1" },
    ]);
    expect(payload.stages[0]).toMatchObject({
      sortOrder: 1,
      titleEn: "Submit proof",
      titleAr: "Submit proof",
      proofType: "document",
    });
    expect(payload.targets[0]).not.toHaveProperty("assignmentId");
    expect(payload.rewardValue).toBe(5);
  });

  it("maps task stages with stable sort order", () => {
    expect(
      mapTaskStagesToPayload([
        { ...createEmptyTaskStage(), titleEn: "First" },
        { ...createEmptyTaskStage(), titleAr: "الثانية", requiresApproval: true },
      ]),
    ).toEqual([
      expect.objectContaining({ sortOrder: 1, titleEn: "First", titleAr: "First" }),
      expect.objectContaining({
        sortOrder: 2,
        titleEn: "الثانية",
        titleAr: "الثانية",
        requiresApproval: true,
      }),
    ]);
  });

  it("renders task enums and hides manage actions without permissions", () => {
    const task: ReinforcementTask = {
      id: "task-1",
      titleEn: "Leadership",
      titleAr: "قيادة",
      source: "teacher",
      reward: {
        type: "xp",
        value: 10,
        labelEn: null,
        labelAr: null,
      },
      status: "under_review",
      targets: [],
      stages: [],
    };

    render(
      <ReinforcementTaskTable
        tasks={[task]}
        canManage={false}
        onDuplicate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Leadership")).toBeInTheDocument();
    expect(screen.getByText("source.teacher")).toBeInTheDocument();
    expect(screen.getByText("status.under_review")).toHaveClass("bg-violet-100");
    expect(screen.getByText("rewardType.xp")).toHaveClass("rounded-full");
    expect(
      screen.getAllByText("10").find((element) =>
        element.classList.contains("font-bold"),
      ),
    ).toHaveClass("font-bold");
    expect(screen.queryByText("actions.duplicate")).not.toBeInTheDocument();
  });

  it("does not render cancel for already-cancelled tasks", () => {
    const task: ReinforcementTask = {
      id: "task-1",
      titleEn: "Cancelled task",
      titleAr: "ملغاة",
      source: "teacher",
      reward: {
        type: "xp",
        value: null,
        labelEn: null,
        labelAr: null,
      },
      status: "cancelled",
      targets: [],
      stages: [],
    };

    render(
      <ReinforcementTaskTable
        tasks={[task]}
        canManage
        onDuplicate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Cancelled task")).toBeInTheDocument();
    expect(screen.getByText("status.cancelled")).toBeInTheDocument();
    expect(screen.queryByText("actions.cancel")).not.toBeInTheDocument();
  });

  it("renders the backend student progress response without legacy fields", () => {
    render(
      <StudentProgressCard
        progress={{
          student: {
            id: "student-1",
            firstName: "Student",
            lastName: "One",
            name: "Student One",
            nameAr: null,
            code: null,
            admissionNo: null,
          },
          enrollment: null,
          assignments: {
            total: 2,
            notCompleted: 0,
            inProgress: 0,
            underReview: 1,
            completed: 1,
            cancelled: 0,
            completionRate: 50,
          },
          tasks: [
            {
              taskId: "task-1",
              assignmentId: "assignment-1",
              status: "under_review",
              progress: 50,
              assignedAt: "2026-07-01T00:00:00.000Z",
              startedAt: null,
              completedAt: null,
              cancelledAt: null,
              task: {
                id: "task-1",
                academicYearId: "year-1",
                termId: "term-1",
                subjectId: null,
                titleEn: "Reading task",
                titleAr: "Reading task",
                source: "teacher",
                status: "in_progress",
                dueDate: null,
                assignedById: null,
                assignedByName: null,
                createdAt: "2026-07-01T00:00:00.000Z",
                updatedAt: "2026-07-01T00:00:00.000Z",
              },
            },
          ],
          submissions: {
            submitted: 1,
            approved: 0,
            rejected: 0,
            pendingReview: 1,
          },
          xp: {
            totalXp: 25,
            bySourceType: [],
            recentLedgerEntries: [],
          },
          recentReviews: [],
        }}
      />,
    );

    expect(screen.getByText("Reading task")).toBeInTheDocument();
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);
  });

  it("renders the exact XP ledger presenter shape and occurrence time", () => {
    render(
      <XpLedgerTable
        entries={[
          {
            id: "ledger-1",
            academicYearId: "year-1",
            termId: "term-1",
            studentId: "student-1",
            enrollmentId: "enrollment-1",
            assignmentId: null,
            policyId: "policy-1",
            sourceType: "manual_bonus",
            sourceId: "manual-1",
            amount: 10,
            reason: "Great work",
            reasonAr: null,
            actorUserId: "actor-1",
            occurredAt: "2025-04-29T10:00:00.000Z",
            student: {
              id: "student-1",
              firstName: "Student",
              lastName: "One",
              name: "Student One",
              enrollmentId: "enrollment-1",
              classroomId: "classroom-1",
              classroomName: "Classroom 1",
              sectionId: "section-1",
              sectionName: "Section 1",
              gradeId: "grade-1",
              gradeName: "Grade 1",
              stageId: "stage-1",
              stageName: "Stage 1",
            },
            createdAt: "2026-04-29T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Student One")).toBeInTheDocument();
    expect(screen.getByText("manual_bonus")).toBeInTheDocument();
    expect(screen.getByText("xp.ledger.occurredAt")).toBeInTheDocument();
    expect(screen.getByText(/2025/)).toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it("renders the backend classroom summary response without legacy fields", () => {
    render(
      <ClassroomSummaryPanel
        summary={{
          classroom: {
            classroomId: "classroom-1",
            classroomName: "Class A",
            sectionId: "section-1",
            sectionName: "Section A",
            gradeId: "grade-1",
            gradeName: "Grade 1",
            stageId: "stage-1",
            stageName: "Primary",
          },
          studentsCount: 1,
          assignments: {
            total: 2,
            notCompleted: 0,
            inProgress: 1,
            underReview: 0,
            completed: 1,
            cancelled: 0,
            completionRate: 50,
          },
          reviewQueue: {
            submitted: 0,
            approved: 1,
            rejected: 0,
            pendingReview: 0,
          },
          xp: {
            totalXp: 25,
            studentsWithXp: 1,
            averageXp: 25,
            bySourceType: [],
          },
          topStudents: [],
          students: [
            {
              studentId: "student-1",
              name: "Student One",
              totalXp: 25,
              assignmentsTotal: 2,
              assignmentsCompleted: 1,
              completionRate: 50,
              pendingReviews: 0,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Student One")).toBeInTheDocument();
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);
  });

  it("renders template enum labels and empty state", () => {
    const template: ReinforcementTemplate = {
      id: "template-1",
      nameEn: "Helper",
      nameAr: "مساعد",
      source: "parent",
      reward: { type: "badge" },
      stages: [],
    };

    const { rerender } = render(
      <ReinforcementTemplateTable templates={[template]} />,
    );
    expect(screen.getAllByText("Helper")).not.toHaveLength(0);
    expect(screen.getAllByText("source.parent")).not.toHaveLength(0);
    expect(screen.getAllByText("rewardType.badge / -")).not.toHaveLength(0);

    rerender(<ReinforcementTemplateTable templates={[]} />);
    expect(screen.getByText("emptyStates.templates")).toBeInTheDocument();
  });

  it("renders rich template response fields without unsupported edit or delete actions", () => {
    const template: ReinforcementTemplate = {
      id: "e5aac1a9-c458-4a1f-af73-1c5971e3dbde",
      nameEn: "Template One",
      nameAr: "القالب الاول",
      descriptionEn: "Template One Description",
      descriptionAr: "وصف القالب الاول",
      source: "system",
      reward: {
        type: "xp",
        value: 10,
        labelEn: "Reward",
        labelAr: "مكافأة",
      },
      stages: [
        {
          id: "6e00ff10-421c-4459-9536-e7a1f381fced",
          sortOrder: 1,
          titleEn: "Stage One",
          titleAr: "المرحلة الاولي",
          descriptionEn: "Stage One Description",
          descriptionAr: "وصف المرحلة الاولي",
          proofType: "image",
          requiresApproval: true,
        },
        {
          id: "13c62d2e-9ea6-41a9-91d1-b2d1ef989af8",
          sortOrder: 2,
          titleEn: "Stage Two",
          titleAr: "المرحلة الثانية",
          descriptionEn: "Stage Two Description",
          descriptionAr: "وصف المرحلة الثانية",
          proofType: "video",
          requiresApproval: true,
        },
      ],
      createdAt: "2026-07-10T14:13:37.297Z",
      updatedAt: "2026-07-10T14:13:37.297Z",
    };

    render(<ReinforcementTemplateTable templates={[template]} canManage />);

    expect(screen.getAllByText("Template One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Template One Description").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reward").length).toBeGreaterThan(0);
    expect(screen.getAllByText("rewardType.xp / 10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stage One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stage Two").length).toBeGreaterThan(0);
    expect(screen.getAllByText("proofType.image").length).toBeGreaterThan(0);
    expect(screen.getAllByText("proofType.video").length).toBeGreaterThan(0);
    expect(screen.getAllByText("templates.table.approvalRequired").length).toBeGreaterThan(0);
    expect(screen.getAllByText("templates.table.updatedAt").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("template-stage-summary").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("template-metadata").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "actions.edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "actions.delete" })).not.toBeInTheDocument();
  });

  it("generates manual XP dedupe keys client-side", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T09:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    expect(makeManualXpDedupeKey()).toMatch(/^manual-xp-\d+-[a-z0-9]+$/);

    vi.mocked(Math.random).mockRestore();
    vi.useRealTimers();
  });
});
