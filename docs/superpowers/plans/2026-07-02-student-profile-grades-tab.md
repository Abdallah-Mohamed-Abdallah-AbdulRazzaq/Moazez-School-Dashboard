# Student Profile Grades Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the student profile Grades tab to the real backend snapshot API endpoint using active academic year and term context.

**Architecture:** Add raw backend response interfaces (including `rule`), create a robust mapper utility to transform API snapshot responses to the UI format (calculating averages strictly from valid numbers), update `gradesOverviewService.ts` to require both `academicYearId` and `termId` (extending existing type imports), propagate academic context from `StudentProfilePage` / `StudentTabLoader` into `StudentGradesTab`, replace the coming soon tab in `StudentTabLoader`, and handle missing context/snapshot/error states cleanly with distinct i18n support.

**Tech Stack:** React, TypeScript, Vitest, next-intl, `@/features/grades`, `@/features/students-guardians`.

## Global Constraints
- Do not modify backend endpoints.
- Require both `academicYearId` and `termId` in `fetchStudentGradesSnapshot`.
- Check both `!academicYearId || !termId` before making API calls.
- Maintain existing UI dashboard layout (KPIs, trend line chart, subject table).
- Use realistic backend values in mapper tests (`rounding: "decimal_2"`, `gradingScale: "percentage"`, `status: "entered"` / `"passing"`).
- Provide English and Arabic translations for `missing_term_context`, `no_snapshot_available` ("No grade snapshot is available for this student in the selected term."), and `loading_error` ("Failed to load student grades.").

---

### Task 1: Add Backend Snapshot Types & Mapper Utility

**Files:**
- Modify: `src/features/grades/shared/types.ts`
- Create: `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`
- Create: `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`

**Interfaces:**
- Consumes: Raw API payload from `/grades/students/:studentId/snapshot`
- Produces: `mapBackendStudentGradeSnapshot` mapper function and backend interfaces

- [ ] **Step 1: Write failing mapper unit tests with realistic backend values**

Create `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { mapBackendStudentGradeSnapshot } from "../studentGradesSnapshotMapper";
import type { BackendStudentGradeSnapshot } from "@/features/grades/shared/types";

describe("studentGradesSnapshotMapper", () => {
  const sampleBackendSnapshot: BackendStudentGradeSnapshot = {
    studentId: "stu-1",
    enrollmentId: "enr-1",
    academicYearId: "year-2026",
    yearId: "year-2026",
    termId: "term-1",
    subjectId: null,
    rule: {
      source: "DEFAULT",
      ruleId: null,
      passMark: 50,
      rounding: "decimal_2",
      gradingScale: "percentage",
    },
    finalPercent: 88.5,
    completedWeight: 100,
    status: "passing",
    subjects: [
      {
        subjectId: "sub-math",
        subjectName: "Mathematics",
        subjectNameAr: "الرياضيات",
        subjectNameEn: "Mathematics",
        finalPercent: 90,
        completedWeight: 100,
        assessmentCount: 2,
        enteredCount: 2,
        missingCount: 0,
        absentCount: 0,
        status: "passing",
      },
      {
        subjectId: "sub-sci",
        subjectName: "Science",
        subjectNameAr: null,
        subjectNameEn: "Science",
        finalPercent: 80,
        completedWeight: 100,
        assessmentCount: 1,
        enteredCount: 1,
        missingCount: 0,
        absentCount: 0,
        status: "passing",
      },
    ],
    assessments: [
      {
        assessmentId: "asm-1",
        subjectId: "sub-math",
        title: "Quiz 1",
        titleEn: "Quiz 1",
        titleAr: null,
        type: "QUIZ",
        date: "2026-01-10",
        weight: 10,
        maxScore: 100,
        itemId: "item-1",
        score: 85,
        percent: 85,
        weightedContribution: 8.5,
        status: "entered",
        comment: null,
        isVirtualMissing: false,
      },
      {
        assessmentId: "asm-2",
        subjectId: "sub-math",
        title: "Midterm",
        titleEn: "Midterm",
        titleAr: null,
        type: "EXAM",
        date: "2026-02-15",
        weight: 40,
        maxScore: 100,
        itemId: "item-2",
        score: 95,
        percent: 95,
        weightedContribution: 38,
        status: "entered",
        comment: null,
        isVirtualMissing: false,
      },
    ],
  };

  it("correctly maps backend snapshot to frontend UI snapshot format", () => {
    const result = mapBackendStudentGradeSnapshot(sampleBackendSnapshot);

    expect(result.studentId).toBe("stu-1");
    expect(result.currentAverage).toBe(88.5);
    expect(result.highestAverage).toBe(90);
    expect(result.lowestAverage).toBe(80);
    expect(result.totalAssessments).toBe(2);
    expect(result.subjectRows).toHaveLength(2);
    expect(result.subjectRows[0].subjectName).toBe("Mathematics");
    expect(result.subjectRows[0].trend).toBe("up");
    expect(result.performanceTrend).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`
Expected: FAIL with missing module/types.

- [ ] **Step 3: Add backend types to src/features/grades/shared/types.ts**

Append to `src/features/grades/shared/types.ts`:
```typescript
export interface BackendStudentGradeSnapshotSubject {
  subjectId: string;
  subjectName: string;
  subjectNameAr: string | null;
  subjectNameEn: string | null;
  finalPercent: number | null;
  completedWeight: number;
  assessmentCount: number;
  enteredCount: number;
  missingCount: number;
  absentCount: number;
  status: string;
}

export interface BackendStudentGradeSnapshotAssessment {
  assessmentId: string;
  subjectId: string;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  type: string;
  date: string;
  weight: number;
  maxScore: number;
  itemId: string | null;
  score: number | null;
  percent: number | null;
  weightedContribution: number | null;
  status: string;
  comment: string | null;
  isVirtualMissing: boolean;
}

export interface BackendStudentGradeSnapshot {
  studentId: string;
  enrollmentId: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  subjectId: string | null;
  rule: {
    source: string;
    ruleId: string | null;
    passMark: number;
    rounding: string;
    gradingScale: string;
  };
  finalPercent: number | null;
  completedWeight: number;
  status: string;
  subjects: BackendStudentGradeSnapshotSubject[];
  assessments: BackendStudentGradeSnapshotAssessment[];
}
```

- [ ] **Step 4: Implement studentGradesSnapshotMapper.ts with improved average calculation**

Create `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`:
```typescript
import type {
  BackendStudentGradeSnapshot,
  BackendStudentGradeSnapshotAssessment,
  StudentGradesSnapshot,
  StudentSubjectGradeSummary,
} from "@/features/grades/shared/types";

export function mapBackendStudentGradeSnapshot(
  snapshot: BackendStudentGradeSnapshot,
): StudentGradesSnapshot {
  const subjectRows = snapshot.subjects.map((subject) =>
    mapSubjectRow(subject, snapshot.assessments),
  );

  // Extract valid non-null numbers directly from backend subjects
  const validFinalPercents = snapshot.subjects
    .map((subject) => subject.finalPercent)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return {
    studentId: snapshot.studentId,
    academicYearId: snapshot.academicYearId,
    termId: snapshot.termId,
    subjectRows,
    currentAverage: snapshot.finalPercent ?? average(validFinalPercents),
    highestAverage: validFinalPercents.length > 0 ? Math.max(...validFinalPercents) : 0,
    lowestAverage: validFinalPercents.length > 0 ? Math.min(...validFinalPercents) : 0,
    totalAssessments: snapshot.assessments.length,
    performanceTrend: buildPerformanceTrend(snapshot.assessments),
  };
}

function mapSubjectRow(
  subject: BackendStudentGradeSnapshot["subjects"][number],
  assessments: BackendStudentGradeSnapshotAssessment[],
): StudentSubjectGradeSummary {
  const scores = assessments
    .filter((assessment) => assessment.subjectId === subject.subjectId)
    .filter((assessment) => assessment.percent !== null)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment) => assessment.percent as number);

  return {
    subjectId: subject.subjectId,
    subjectName: subject.subjectNameEn || subject.subjectName,
    subjectNameAr: subject.subjectNameAr || subject.subjectName,
    average: subject.finalPercent ?? 0,
    lastAssessmentScore: scores.length > 0 ? scores[scores.length - 1] : null,
    assessmentsCount: subject.assessmentCount,
    trend: getTrend(scores),
  };
}

function buildPerformanceTrend(
  assessments: BackendStudentGradeSnapshotAssessment[],
): StudentGradesSnapshot["performanceTrend"] {
  return assessments
    .filter((assessment) => assessment.percent !== null)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment, index) => ({
      label: assessment.title || assessment.date || `A${index + 1}`,
      average: assessment.percent ?? 0,
    }));
}

function getTrend(scores: number[]): "up" | "down" | "stable" {
  if (scores.length < 2) return "stable";

  const diff = scores[scores.length - 1] - scores[0];

  if (diff > 2) return "up";
  if (diff < -2) return "down";
  return "stable";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add src/features/grades/shared/types.ts src/features/grades/overview/utils/studentGradesSnapshotMapper.ts src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts
git commit -m "feat(grades): add backend grade snapshot types with rule and mapper utility"
```

---

### Task 2: Update Service Layer & Translations

**Files:**
- Modify: `src/features/grades/overview/services/gradesOverviewService.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Consumes: `mapBackendStudentGradeSnapshot`
- Produces: `fetchStudentGradesSnapshot` with required `academicYearId` & `termId`, plus i18n messages

- [ ] **Step 1: Update gradesOverviewService.ts**

Extend existing import in `src/features/grades/overview/services/gradesOverviewService.ts`:
```typescript
import { apiGet } from "@/lib/api";
import type {
  GradesScopeFilters,
  GradebookResponse,
  Assessment,
  ExamScopeType,
  GradeRule,
  StudentGradesSnapshot,
  BackendStudentGradeSnapshot,
} from "../../shared/types";
import { mapBackendStudentGradeSnapshot } from "../utils/studentGradesSnapshotMapper";

export async function fetchStudentGradesSnapshot(
  studentId: string,
  options: { academicYearId: string; termId: string },
): Promise<StudentGradesSnapshot> {
  const response = await apiGet<BackendStudentGradeSnapshot>(
    `/grades/students/${studentId}/snapshot`,
    {
      params: options,
    },
  );

  return mapBackendStudentGradeSnapshot(response);
}
```

- [ ] **Step 2: Add translation keys to en.json & ar.json**

In `src/messages/en.json` under `students_guardians.profile.grades` (or `students_guardians.profile`):
```json
"missing_term_context": "Select an academic year and term to view grades.",
"no_snapshot_available": "No grade snapshot is available for this student in the selected term.",
"loading_error": "Failed to load student grades."
```

In `src/messages/ar.json`:
```json
"missing_term_context": "اختر السنة الدراسية والفصل الدراسي لعرض الدرجات.",
"no_snapshot_available": "لا تتوفر لقطة درجات لهذا الطالب في الفصل الدراسي المحدد.",
"loading_error": "تعذر تحميل درجات الطالب."
```

- [ ] **Step 3: Verify typecheck compiles**

Run: `npm run typecheck`
Expected: Typecheck passes.

- [ ] **Step 4: Commit changes**

```bash
git add src/features/grades/overview/services/gradesOverviewService.ts src/messages/en.json src/messages/ar.json
git commit -m "feat(grades): update fetchStudentGradesSnapshot service and add i18n error messages"
```

---

### Task 3: Pass Academic Context & Update StudentTabLoader & GradesTab Components

**Files:**
- Modify: `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
- Modify: `src/features/students-guardians/students/components/StudentTabLoader.tsx`
- Modify: `src/features/students-guardians/students/components/tabs/GradesTab.tsx`

**Interfaces:**
- Consumes: `useStudentsGuardiansYearTermContext` and `fetchStudentGradesSnapshot`
- Produces: Wired `StudentTabLoader` and `GradesTab` checking both `academicYearId` and `termId` with proper 404 / error mapping

- [ ] **Step 1: Update StudentProfilePage.tsx and StudentTabLoader.tsx**

In `StudentTabLoader.tsx`:
Add imports:
```typescript
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import GradesTab from "@/features/students-guardians/students/components/tabs/GradesTab";
```

Update `renderTab` signature and implementation:
```typescript
function renderTab(
  tab: StudentTabKey,
  student: Student,
  onStudentUpdated: () => void,
  academicYearId?: string | null,
  termId?: string | null,
) {
  switch (tab) {
    ...
    case "grades":
      return (
        <GradesTab
          student={student}
          academicYearId={academicYearId}
          termId={termId}
        />
      );
  }
}
```

In `StudentTabLoader` body:
```typescript
export default function StudentTabLoader({
  studentId,
  tab,
}: StudentTabLoaderProps) {
  const { yearId, termId } = useStudentsGuardiansYearTermContext();
  ...
  return renderTab(tab, student, loadStudent, yearId, termId);
}
```

In `StudentProfilePage.tsx`:
```typescript
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
```
Read `yearId` and `termId` and pass them to `StudentGradesTab`.

- [ ] **Step 2: Update GradesTab.tsx props and fetch logic**

In `src/features/students-guardians/students/components/tabs/GradesTab.tsx`:
```typescript
interface GradesTabProps {
  student: Student;
  academicYearId?: string | null;
  termId?: string | null;
}

export default function GradesTab({
  student,
  academicYearId,
  termId,
}: GradesTabProps) {
  const t = useTranslations("students_guardians.profile.grades");
  const [snapshot, setSnapshot] = useState<StudentGradesSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadSnapshot = async () => {
      // Check BOTH academicYearId and termId
      if (!academicYearId || !termId) {
        setSnapshot(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextSnapshot = await fetchStudentGradesSnapshot(student.id, {
          academicYearId,
          termId,
        });

        if (!isCancelled) {
          setSnapshot(nextSnapshot);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setSnapshot(null);
          const message = loadError instanceof Error ? loadError.message : "";
          // If 404 or enrollment not found, show no_snapshot_available
          if (message.includes("not found") || message.includes("404") || message.includes("enrollment")) {
            setError(t("no_snapshot_available"));
          } else {
            setError(message || t("loading_error"));
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSnapshot();

    return () => {
      isCancelled = true;
    };
  }, [student.id, academicYearId, termId, t]);

  if (!academicYearId || !termId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        {t("missing_term_context")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  ...
}
```

- [ ] **Step 3: Run Vitest tests**

Run: `npx vitest run src/features/students-guardians` and `npx vitest run src/features/grades`
Expected: PASS

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/features/students-guardians/students/pages/StudentProfilePage.tsx src/features/students-guardians/students/components/StudentTabLoader.tsx src/features/students-guardians/students/components/tabs/GradesTab.tsx
git commit -m "feat(students): wire GradesTab in StudentTabLoader and StudentProfilePage with strict year and term context"
```
