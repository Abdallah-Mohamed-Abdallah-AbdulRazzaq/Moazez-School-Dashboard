# Enhanced Grades Tab & Assessments Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Student Profile **Grades** tab UI/UX to display grading rule metadata, detailed subject statistics (`completedWeight`, `enteredCount`, `missingCount`, `absentCount`, `status`), and a dedicated **Assessments Breakdown Table** with fallback titles, scores, weights, and status badges.

**Architecture:**
1. Update `StudentSubjectGradeSummary` and `StudentGradesSnapshot` types in `src/features/grades/shared/types.ts` to expose rule metadata, subject counts, and assessment items.
2. Update `studentGradesSnapshotMapper.ts` to map rule details, subject counts, and raw/mapped assessment items.
3. Update English and Arabic translations for table headers, assessment types, and status badges.
4. Enhance `GradesTab.tsx` to render rule info banner, updated Subjects Table (with completed weight, entered/missing/absent counts), and a new Assessments Breakdown Table.

**Tech Stack:** React, TypeScript, Vitest, next-intl, `@/components/ui` (`DataTable`), `@/features/grades`.

## Global Constraints
- Do not modify backend endpoints.
- Preserve existing data-dense layout while adding the new Assessments table.
- Gracefully handle `null` values for `finalPercent`, `score`, `percent`, `weightedContribution`, and assessment `title`.
- Use localized names (`titleEn`/`titleAr`, `subjectNameEn`/`subjectNameAr`) with fallback logic.

---

### Task 1: Update UI Types & Snapshot Mapper for Subject & Assessment Details

**Files:**
- Modify: `src/features/grades/shared/types.ts`
- Modify: `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`
- Modify: `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`

- [ ] **Step 1: Write failing mapper unit test for subject counts, rule, and assessment items**

Update `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`:
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
      source: "GRADE",
      ruleId: "rule-1",
      passMark: 50,
      rounding: "decimal_0",
      gradingScale: "percentage",
    },
    finalPercent: null,
    completedWeight: 0,
    status: "incomplete",
    subjects: [
      {
        subjectId: "sub-math",
        subjectName: "Demo Mathematics",
        subjectNameAr: "Demo Mathematics",
        subjectNameEn: "Demo Mathematics",
        finalPercent: null,
        completedWeight: 0,
        assessmentCount: 2,
        enteredCount: 0,
        missingCount: 2,
        absentCount: 0,
        status: "incomplete",
      },
    ],
    assessments: [
      {
        assessmentId: "asm-1",
        subjectId: "sub-math",
        title: "fvjh",
        titleEn: "fvjh",
        titleAr: "opip';k",
        type: "QUIZ",
        date: "2026-09-01",
        weight: 15,
        maxScore: 20,
        itemId: null,
        score: null,
        percent: null,
        weightedContribution: null,
        status: "missing",
        comment: null,
        isVirtualMissing: true,
      },
      {
        assessmentId: "asm-2",
        subjectId: "sub-math",
        title: null,
        titleEn: null,
        titleAr: null,
        type: "QUIZ",
        date: "2026-09-15",
        weight: 15,
        maxScore: 20,
        itemId: null,
        score: null,
        percent: null,
        weightedContribution: null,
        status: "missing",
        comment: null,
        isVirtualMissing: true,
      },
    ],
  };

  it("maps rule metadata, subject counts, and assessment items", () => {
    const result = mapBackendStudentGradeSnapshot(sampleBackendSnapshot);

    expect(result.rule).toBeDefined();
    expect(result.rule?.passMark).toBe(50);
    expect(result.status).toBe("incomplete");
    expect(result.completedWeight).toBe(0);

    expect(result.subjectRows[0].completedWeight).toBe(0);
    expect(result.subjectRows[0].assessmentCount).toBe(2);
    expect(result.subjectRows[0].enteredCount).toBe(0);
    expect(result.subjectRows[0].missingCount).toBe(2);
    expect(result.subjectRows[0].status).toBe("incomplete");

    expect(result.assessments).toHaveLength(2);
    expect(result.assessments[0].title).toBe("fvjh");
    expect(result.assessments[1].title).toBe(null);
    expect(result.assessments[1].isVirtualMissing).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`
Expected: FAIL due to missing fields in mapper.

- [ ] **Step 3: Update StudentSubjectGradeSummary and StudentGradesSnapshot in types.ts**

In `src/features/grades/shared/types.ts`:
```typescript
export interface StudentSubjectGradeSummary {
  subjectId: string;
  subjectName: string;
  subjectNameAr?: string | null;
  subjectNameEn?: string | null;
  average: number | null;
  lastAssessmentScore: number | null;
  assessmentsCount: number;
  enteredCount?: number;
  missingCount?: number;
  absentCount?: number;
  completedWeight?: number;
  status?: string;
  trend: "up" | "down" | "stable";
}

export interface StudentGradesSnapshot {
  studentId: string;
  academicYearId?: string;
  termId?: string;
  rule?: BackendStudentGradeSnapshot["rule"];
  status?: string;
  completedWeight?: number;
  subjectRows: StudentSubjectGradeSummary[];
  assessments?: BackendStudentGradeSnapshotAssessment[];
  currentAverage: number | null;
  highestAverage: number;
  lowestAverage: number;
  totalAssessments: number;
  performanceTrend: Array<{
    label: string;
    average: number;
  }>;
}
```

- [ ] **Step 4: Update studentGradesSnapshotMapper.ts**

In `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`:
```typescript
export function mapBackendStudentGradeSnapshot(
  snapshot: BackendStudentGradeSnapshot,
): StudentGradesSnapshot {
  const subjectRows = snapshot.subjects.map((subject) =>
    mapSubjectRow(subject, snapshot.assessments),
  );

  const validFinalPercents = snapshot.subjects
    .map((subject) => subject.finalPercent)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return {
    studentId: snapshot.studentId,
    academicYearId: snapshot.academicYearId,
    termId: snapshot.termId,
    rule: snapshot.rule,
    status: snapshot.status,
    completedWeight: snapshot.completedWeight,
    subjectRows,
    assessments: snapshot.assessments,
    currentAverage: snapshot.finalPercent ?? (validFinalPercents.length > 0 ? average(validFinalPercents) : null),
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
    subjectNameEn: subject.subjectNameEn || subject.subjectName,
    average: subject.finalPercent,
    lastAssessmentScore: scores.length > 0 ? scores[scores.length - 1] : null,
    assessmentsCount: subject.assessmentCount,
    enteredCount: subject.enteredCount,
    missingCount: subject.missingCount,
    absentCount: subject.absentCount,
    completedWeight: subject.completedWeight,
    status: subject.status,
    trend: getTrend(scores),
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add src/features/grades/shared/types.ts src/features/grades/overview/utils/studentGradesSnapshotMapper.ts src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts
git commit -m "feat(grades): map rule metadata, subject counts, and assessment items in snapshot mapper"
```

---

### Task 2: Add Translations for Assessments & Rule Metadata

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add translation keys to en.json & ar.json**

In `src/messages/en.json` under `students_guardians.profile.grades`:
```json
"rule_info": "Grading Rule",
"pass_mark": "Pass Mark",
"grading_scale": "Grading Scale",
"rounding": "Rounding",
"completed_weight": "Completed Weight",
"assessments_title": "Assessments Breakdown",
"col_subject": "Subject",
"col_completed_weight": "Completed Weight",
"col_entered": "Graded / Total",
"col_missing": "Missing",
"col_absent": "Absent",
"col_max_score": "Max Score",
"col_score": "Score",
"col_weight": "Weight",
"col_contribution": "Contribution",
"status_incomplete": "Incomplete",
"status_passing": "Passing",
"status_failing": "Failing",
"status_entered": "Graded",
"status_missing": "Missing",
"status_absent": "Absent",
"pending_tag": "Pending"
```

In `src/messages/ar.json` under `students_guardians.profile.grades`:
```json
"rule_info": "قاعدة التقييم",
"pass_mark": "درجة النجاح",
"grading_scale": "مقياس الدرجات",
"rounding": "التقريب",
"completed_weight": "الوزن المكتمل",
"assessments_title": "تفاصيل التقييمات",
"col_subject": "المادة",
"col_completed_weight": "الوزن المكتمل",
"col_entered": "المُدخل / الإجمالي",
"col_missing": "مفقود",
"col_absent": "غائب",
"col_max_score": "الدرجة العظمى",
"col_score": "الدرجة",
"col_weight": "الوزن",
"col_contribution": "المساهمة النسبية",
"status_incomplete": "غير مكتمل",
"status_passing": "ناجح",
"status_failing": "راسب",
"status_entered": "مُدخل",
"status_missing": "مفقود",
"status_absent": "غائب",
"pending_tag": "معلق"
```

- [ ] **Step 2: Commit changes**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat(grades): add i18n translations for rule metadata and assessments table"
```

---

### Task 3: Enhance GradesTab UI Component with Rule Banner, Subjects Table & Assessments Table

**Files:**
- Modify: `src/features/students-guardians/students/components/tabs/GradesTab.tsx`
- Modify: `src/features/students-guardians/students/components/tabs/__tests__/GradesTab.test.tsx`

- [ ] **Step 1: Update GradesTab.tsx to render Rule Card, Enhanced Subjects Table & Assessments Table**

In `GradesTab.tsx`:
1. Render **Grading Rule Card & Overall Status Badge** at the top.
2. Render **KPI Cards**:
   - `currentAverage`: Display `--` when `null`.
   - `completedWeight`: Display `${completedWeight}%` progress bar.
3. Enhance **Subjects Table**:
   - Add columns for `completedWeight`, `entered/total`, `missing`, `status`.
4. Add **Assessments Table**:
   - Render `DataTable` with columns: `Title` (with fallback to `${type} — ${date}` if title is `null`), `Subject`, `Type`, `Date`, `Weight`, `Max Score`, `Score`, `Weighted Contribution`, `Status` (with `isVirtualMissing` badge).

- [ ] **Step 2: Update GradesTab.test.tsx**

Update `src/features/students-guardians/students/components/tabs/__tests__/GradesTab.test.tsx` to test rendering with the new snapshot structure.

- [ ] **Step 3: Run Vitest tests and typecheck**

Run: `npx vitest run src/features/students-guardians src/features/grades`
Run: `npm run typecheck`
Expected: ALL PASS

- [ ] **Step 4: Commit changes**

```bash
git add src/features/students-guardians/students/components/tabs/GradesTab.tsx src/features/students-guardians/students/components/tabs/__tests__/GradesTab.test.tsx
git commit -m "feat(students): enhance GradesTab UI with rule card, detailed subject stats, and assessments table"
```
