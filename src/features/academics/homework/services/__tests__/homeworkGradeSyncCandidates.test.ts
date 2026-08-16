import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import {
  discoverHomeworkGradeSyncCandidates,
  resolveHomeworkGradeSyncScopes,
} from "../homeworkGradeSyncCandidates";

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(),
}));

vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({
  fetchAssessments: vi.fn(),
}));

const homework = {
  id: "homework-1",
  academicYearId: "year-1",
  termId: "term-1",
  subjectId: "subject-1",
  classroomId: "classroom-1",
  classroomSectionId: "section-1",
  classroomGradeId: "grade-1",
  title: "Homework",
  mode: "homework",
  status: "published" as const,
  targetMode: "classroom",
  totalMarks: 10,
  isGraded: true,
  questionCount: 0,
  attachmentCount: 0,
};

const structure = {
  stages: [{ id: "stage-1", name: "Stage", nameAr: "مرحلة", nameEn: "Stage", order: 1 }],
  grades: [{ id: "grade-1", name: "Grade", nameAr: "صف", nameEn: "Grade", stageId: "stage-1", capacity: 30, order: 1 }],
  sections: [{ id: "section-1", name: "Section", nameAr: "شعبة", nameEn: "Section", gradeId: "grade-1", capacity: 30, order: 1 }],
  classrooms: [{ id: "classroom-1", name: "Room", nameAr: "فصل", nameEn: "Room", sectionId: "section-1", capacity: 30, order: 1 }],
};

const assessment = (overrides: Record<string, unknown> = {}) => ({
  id: "assessment-1",
  academicYearId: "year-1",
  termId: "term-1",
  subjectId: "subject-1",
  scopeType: "classroom" as const,
  scopeId: "classroom-1",
  classroomId: "classroom-1",
  title: "Assignment",
  titleAr: "واجب",
  type: "ASSIGNMENT" as const,
  deliveryMode: "SCORE_ONLY" as const,
  date: "2026-01-01",
  weight: 1,
  maxScore: 10,
  isLocked: false,
  approvalStatus: "draft" as const,
  ...overrides,
});

describe("homework grade-sync candidates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves unique school-to-classroom scopes", () => {
    expect(resolveHomeworkGradeSyncScopes(homework, structure)).toEqual([
      { scopeType: "school", scopeId: "" },
      { scopeType: "stage", scopeId: "stage-1" },
      { scopeType: "grade", scopeId: "grade-1" },
      { scopeType: "section", scopeId: "section-1" },
      { scopeType: "classroom", scopeId: "classroom-1" },
    ]);
  });

  it("queries every scope with the same context and includes drafts", async () => {
    vi.mocked(fetchStructureTree).mockResolvedValue(structure);
    vi.mocked(fetchAssessments).mockResolvedValue([]);

    await discoverHomeworkGradeSyncCandidates(homework);

    expect(fetchAssessments).toHaveBeenCalledTimes(5);
    for (const [scopeType, scopeId] of [
      ["school", ""],
      ["stage", "stage-1"],
      ["grade", "grade-1"],
      ["section", "section-1"],
      ["classroom", "classroom-1"],
    ]) {
      expect(fetchAssessments).toHaveBeenCalledWith("year-1", "term-1", {
        scopeType,
        scopeId,
        subjectId: "subject-1",
        includeDrafts: true,
      });
    }
  });

  it("keeps compatible draft and published assignments, rejects mismatches, and deduplicates", async () => {
    vi.mocked(fetchStructureTree).mockResolvedValue(structure);
    vi.mocked(fetchAssessments)
      .mockResolvedValueOnce([
        assessment({ id: "draft-school", scopeType: "school", scopeId: "" }),
        assessment({ id: "wrong-type", type: "QUIZ" }),
      ])
      .mockResolvedValueOnce([
        assessment({ id: "published-stage", scopeType: "stage", scopeId: "stage-1", stageId: "stage-1", approvalStatus: "published" }),
        assessment({ id: "locked", scopeType: "stage", scopeId: "stage-1", isLocked: true }),
      ])
      .mockResolvedValueOnce([
        assessment({ id: "wrong-term", scopeType: "grade", scopeId: "grade-1", termId: "term-2" }),
        assessment({ id: "wrong-subject", scopeType: "grade", scopeId: "grade-1", subjectId: "subject-2" }),
      ])
      .mockResolvedValueOnce([
        assessment({ id: "wrong-placement", scopeType: "section", scopeId: "section-2" }),
      ])
      .mockResolvedValueOnce([
        assessment({ id: "classroom", approvalStatus: "published" }),
        assessment({ id: "classroom", approvalStatus: "published" }),
        assessment({ id: "wrong-year", academicYearId: "year-2" }),
      ]);

    const result = await discoverHomeworkGradeSyncCandidates(homework);

    expect(result.map(({ id }) => id)).toEqual([
      "draft-school",
      "published-stage",
      "classroom",
    ]);
  });
});
