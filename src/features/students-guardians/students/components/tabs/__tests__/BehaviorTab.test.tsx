import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BehaviorTab from "../BehaviorTab";
import * as behaviorApi from "@/features/behavior/services/behaviorApiService";
import type { BehaviorSummary } from "@/features/behavior/services/behaviorApiService";
import type { Student } from "@/features/students-guardians/students/types";

const permissionState = vi.hoisted(() => ({
  granted: [
    "behavior.records.view",
    "behavior.records.create",
    "behavior.categories.view",
  ],
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (key: string) => permissionState.granted.includes(key),
    isPermissionsReady: true,
  }),
}));

vi.mock(
  "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext",
  () => ({
    useStudentsGuardiansYearTermContext: () => ({
      yearId: "year-1",
      termId: "term-1",
      terms: [
        {
          id: "term-1",
          yearId: "year-1",
          name: "Term 1",
          status: "open",
          startDate: "2026-01-01",
          endDate: "2026-06-30",
        },
      ],
    }),
  }),
);

vi.mock("@/features/behavior/services/behaviorApiService", () => ({
  fetchStudentBehaviorSummary: vi.fn(),
  fetchBehaviorRecords: vi.fn(),
  fetchBehaviorCategories: vi.fn(),
  createBehaviorRecord: vi.fn(),
  submitBehaviorRecord: vi.fn(),
}));

const student: Student = {
  id: "student-1",
  full_name_ar: "علي حسن",
  full_name_en: "Ali Hassan",
  gender: "Male",
  dateOfBirth: "2015-01-01",
  nationality: "Egyptian",
  gradeRequested: "Grade 5",
  status: "Active",
  submittedDate: "2025-01-01T00:00:00.000Z",
  contact: {},
};
const summary: BehaviorSummary = {
  student: {
    id: "student-1",
    displayName: "Ali Hassan",
    nameAr: null,
    code: null,
    admissionNo: null,
  },
  scope: {
    academicYearId: "year-1",
    termId: "term-1",
    studentId: "student-1",
    classroomId: null,
    occurredFrom: null,
    occurredTo: null,
  },
  records: {
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    positive: 0,
    negative: 0,
  },
  severity: { low: 0, medium: 0, high: 0, critical: 0 },
  points: { totalPoints: 0, positivePoints: 0, negativePoints: 0, awardEntries: 0, penaltyEntries: 0 },
  review: { pendingReview: 0, reviewed: 0, approvalRate: 0, rejectionRate: 0 },
  categoryBreakdown: [],
  timeline: [],
  ledger: [],
};

describe("BehaviorTab", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.granted = [
      "behavior.records.view",
      "behavior.records.create",
      "behavior.categories.view",
    ];
    vi.mocked(behaviorApi.fetchStudentBehaviorSummary).mockResolvedValue(summary);
    vi.mocked(behaviorApi.fetchBehaviorRecords).mockResolvedValue([]);
    vi.mocked(behaviorApi.fetchBehaviorCategories).mockResolvedValue([
      {
        id: "category-1",
        code: "POS",
        nameEn: "Helping",
        nameAr: null,
        descriptionEn: null,
        descriptionAr: null,
        type: "positive",
        defaultSeverity: "low",
        defaultPoints: 5,
        isActive: true,
        sortOrder: 1,
      },
    ]);
  });

  it("loads summary and records for the selected academic context", async () => {
    render(<BehaviorTab student={student} />);

    await waitFor(() => expect(behaviorApi.fetchStudentBehaviorSummary).toHaveBeenCalled());
    expect(behaviorApi.fetchStudentBehaviorSummary).toHaveBeenCalledWith("student-1", {
      academicYearId: "year-1",
      termId: "term-1",
      includeTimeline: false,
      includeCategoryBreakdown: false,
      includeLedger: false,
    });
    expect(behaviorApi.fetchBehaviorRecords).toHaveBeenCalledWith({
      studentId: "student-1",
      academicYearId: "year-1",
      termId: "term-1",
    });
  });

  it("does not read or offer creation without view permission", async () => {
    permissionState.granted = [];
    render(<BehaviorTab student={student} />);

    expect(await screen.findByText("states.accessDenied.title")).toBeInTheDocument();
    expect(behaviorApi.fetchStudentBehaviorSummary).not.toHaveBeenCalled();
    expect(behaviorApi.fetchBehaviorRecords).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "actions.newRecord" })).not.toBeInTheDocument();
  });

  it("hides creation unless records-create and categories-view are both granted", async () => {
    permissionState.granted = ["behavior.records.view", "behavior.records.create"];
    render(<BehaviorTab student={student} />);

    await waitFor(() => expect(behaviorApi.fetchBehaviorRecords).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "actions.newRecord" })).not.toBeInTheDocument();
  });

  it("blocks an occurrence date outside the selected term", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
    render(<BehaviorTab student={student} />);
    fireEvent.click(await screen.findByRole("button", { name: "actions.newRecord" }));

    fireEvent.click(await screen.findByLabelText("table.category *"));
    fireEvent.click(await screen.findByRole("button", { name: "Helping (5 pts)" }));
    fireEvent.change(screen.getByLabelText("record.titleEn"), { target: { value: "Helpful act" } });
    fireEvent.click(screen.getByRole("button", { name: "modal.submitRecord" }));

    expect(await screen.findByText("errors.occurredAtOutsideTerm")).toBeInTheDocument();
    expect(behaviorApi.createBehaviorRecord).not.toHaveBeenCalled();
  });
});
