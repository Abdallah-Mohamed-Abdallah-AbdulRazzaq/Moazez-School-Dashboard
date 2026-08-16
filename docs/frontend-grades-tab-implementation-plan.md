# Frontend Implementation Plan — Wire Student Profile Grades Tab

## Goal

Wire the **Grades** tab in the student profile to the real backend endpoint:

```http
GET /grades/students/:studentId/snapshot?academicYearId=...&termId=...
```

No backend changes are required for this plan.

The frontend already calls:

```ts
fetchStudentGradesSnapshot(student.id)
```

but it does not pass `termId`, while the backend requires `termId`.

---

## 1. Current Problem

### Current frontend call

`GradesTab.tsx` currently does:

```ts
const nextSnapshot = await fetchStudentGradesSnapshot(student.id);
```

### Backend requirement

The backend endpoint requires:

```ts
termId!: string;
```

and optionally accepts:

```ts
academicYearId?: string;
yearId?: string;
subjectId?: string;
```

### Current frontend expected shape

The frontend `StudentGradesSnapshot` expects:

```ts
{
  studentId: string;
  academicYearId?: string;
  termId?: string;
  subjectRows: StudentSubjectGradeSummary[];
  currentAverage: number;
  highestAverage: number;
  lowestAverage: number;
  totalAssessments: number;
  performanceTrend: Array<{
    label: string;
    average: number;
  }>;
}
```

### Backend response shape

The backend returns:

```ts
{
  studentId: string;
  enrollmentId: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  subjectId: string | null;
  rule: {...};
  finalPercent: number | null;
  completedWeight: number;
  status: string;
  subjects: [...];
  assessments: [...];
}
```

So the frontend needs:

1. `termId` passed into the service call.
2. A mapper from backend response shape to dashboard UI shape.

---

## 2. Files to Update

### Update existing files

```text
src/features/students-guardians/students/pages/StudentProfilePage.tsx
src/features/students-guardians/students/components/tabs/GradesTab.tsx
src/features/grades/overview/services/gradesOverviewService.ts
src/features/grades/shared/types.ts
```

### Add new file

```text
src/features/grades/overview/utils/studentGradesSnapshotMapper.ts
```

### Optional test file

```text
src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts
```

---

## 3. Pass Academic Context into Grades Tab

`StudentProfilePage.tsx` currently renders:

```tsx
grades: <StudentGradesTab student={profileStudent} />
```

Update it to read the current Students/Guardians academic year and term context.

### Add import

```ts
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
```

### Inside `StudentProfilePage`

```ts
const {
  yearId,
  termId,
  isLoading: isContextLoading,
  error: contextError,
} = useStudentsGuardiansYearTermContext();
```

### Update tab rendering

```tsx
grades: (
  <StudentGradesTab
    student={profileStudent}
    academicYearId={yearId}
    termId={termId}
  />
),
```

### Update loading condition

```tsx
if (isLoading || isContextLoading) {
  return <MainLoader />;
}
```

If `contextError` exists, either:

- show a non-blocking warning in the Grades tab, or
- pass it into `StudentGradesTab` and render an empty/error state there.

Recommended: keep the student profile page usable and let only the Grades tab show the context error.

---

## 4. Update `GradesTab` Props

Current props:

```ts
interface GradesTabProps {
  student: Student;
}
```

Update to:

```ts
interface GradesTabProps {
  student: Student;
  academicYearId: string | null;
  termId: string | null;
}
```

Update component signature:

```ts
export default function GradesTab({
  student,
  academicYearId,
  termId,
}: GradesTabProps) {
  ...
}
```

---

## 5. Update `GradesTab` Fetch Logic

Current effect:

```ts
useEffect(() => {
  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const nextSnapshot = await fetchStudentGradesSnapshot(student.id);
      setSnapshot(nextSnapshot);
    } finally {
      setIsLoading(false);
    }
  };

  void loadSnapshot();
}, [student.id]);
```

Replace with:

```ts
useEffect(() => {
  let isCancelled = false;

  const loadSnapshot = async () => {
    if (!termId) {
      setSnapshot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextSnapshot = await fetchStudentGradesSnapshot(student.id, {
        academicYearId: academicYearId ?? undefined,
        termId,
      });

      if (!isCancelled) {
        setSnapshot(nextSnapshot);
      }
    } catch (loadError) {
      if (!isCancelled) {
        setSnapshot(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("loading_error"),
        );
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
```

Add error state:

```ts
const [error, setError] = useState<string | null>(null);
```

---

## 6. Add Backend Response Types

In:

```text
src/features/grades/shared/types.ts
```

Add backend-specific types separately from UI types:

```ts
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
  finalPercent: number | null;
  completedWeight: number;
  status: string;
  subjects: BackendStudentGradeSnapshotSubject[];
  assessments: BackendStudentGradeSnapshotAssessment[];
}
```

Keep the existing UI-facing type:

```ts
export interface StudentGradesSnapshot {
  studentId: string;
  academicYearId?: string;
  termId?: string;
  subjectRows: StudentSubjectGradeSummary[];
  currentAverage: number;
  highestAverage: number;
  lowestAverage: number;
  totalAssessments: number;
  performanceTrend: Array<{
    label: string;
    average: number;
  }>;
}
```

---

## 7. Add Mapper

Create:

```text
src/features/grades/overview/utils/studentGradesSnapshotMapper.ts
```

Suggested mapper:

```ts
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

  const averages = subjectRows
    .map((row) => row.average)
    .filter((value) => Number.isFinite(value));

  return {
    studentId: snapshot.studentId,
    academicYearId: snapshot.academicYearId,
    termId: snapshot.termId,
    subjectRows,
    currentAverage: snapshot.finalPercent ?? average(averages),
    highestAverage: averages.length > 0 ? Math.max(...averages) : 0,
    lowestAverage: averages.length > 0 ? Math.min(...averages) : 0,
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

---

## 8. Update Grades Service

In:

```text
src/features/grades/overview/services/gradesOverviewService.ts
```

Current service:

```ts
export async function fetchStudentGradesSnapshot(
  studentId: string,
  options?: { academicYearId?: string; termId?: string }
): Promise<StudentGradesSnapshot> {
  return apiGet<StudentGradesSnapshot>(
    `/grades/students/${studentId}/snapshot`,
    {
      params: options ?? {},
    }
  );
}
```

Replace with:

```ts
import type {
  BackendStudentGradeSnapshot,
  StudentGradesSnapshot,
} from "../../shared/types";
import { mapBackendStudentGradeSnapshot } from "../utils/studentGradesSnapshotMapper";

export async function fetchStudentGradesSnapshot(
  studentId: string,
  options: { academicYearId?: string; termId: string },
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

Make `termId` required in the frontend service to match backend reality.

---

## 9. Improve `GradesTab` Empty and Error States

Add:

```ts
const [error, setError] = useState<string | null>(null);
```

Render missing context:

```tsx
if (!termId) {
  return (
    <div
      className="rounded-xl border p-6 text-center text-sm"
      style={{
        borderColor: "var(--border-color)",
        color: "var(--text-secondary)",
        backgroundColor: "var(--surface-color)",
      }}
    >
      {t("missing_term_context")}
    </div>
  );
}
```

Render error:

```tsx
if (error) {
  return (
    <div
      className="rounded-xl border p-6 text-center text-sm"
      style={{
        borderColor: "var(--border-color)",
        color: "var(--error-text)",
        backgroundColor: "var(--surface-color)",
      }}
    >
      {error}
    </div>
  );
}
```

Keep current empty state for:

```ts
!snapshot || subjectRows.length === 0
```

---

## 10. Add Translations

Add to the grades profile translation namespace:

```json
{
  "missing_term_context": "Select an academic year and term to view grades.",
  "loading_error": "Failed to load student grades."
}
```

Arabic:

```json
{
  "missing_term_context": "اختر السنة الدراسية والفصل الدراسي لعرض الدرجات.",
  "loading_error": "تعذر تحميل درجات الطالب."
}
```

---

## 11. Tests

Add mapper tests:

```text
src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts
```

Cover:

1. Maps backend `subjects` to frontend `subjectRows`.
2. Uses `finalPercent` as `currentAverage`.
3. Calculates `highestAverage`.
4. Calculates `lowestAverage`.
5. Counts `assessments.length` as `totalAssessments`.
6. Builds `performanceTrend` from assessment percentages.
7. Handles empty `subjects`.
8. Handles `finalPercent: null`.
9. Handles `subjectNameAr: null`.
10. Ignores assessments with `percent: null`.
11. Calculates `lastAssessmentScore`.
12. Calculates `trend` as `up`, `down`, or `stable`.

Add component/service tests if the project already has patterns for them:

- `GradesTab` does not call API when `termId` is missing.
- `GradesTab` calls API with `{ academicYearId, termId }`.
- Loading state appears.
- Empty state appears when no subject rows exist.
- Error state appears on failed request.

---

## 12. Final Request Flow

Final frontend flow:

```text
StudentProfilePage
  → reads yearId + termId from useStudentsGuardiansYearTermContext
  → passes academicYearId + termId to StudentGradesTab
  → StudentGradesTab calls fetchStudentGradesSnapshot(student.id, { academicYearId, termId })
  → gradesOverviewService calls backend
  → mapper converts backend response to StudentGradesSnapshot
  → GradesTab renders KPIs, trend, and subject table
```

---

## 13. Implementation Order

1. Add backend response types in `grades/shared/types.ts`.
2. Add `studentGradesSnapshotMapper.ts`.
3. Update `fetchStudentGradesSnapshot` to use mapper and require `termId`.
4. Update `GradesTab` props and API call.
5. Update `StudentProfilePage` to pass `academicYearId` and `termId`.
6. Add missing loading/error/empty states.
7. Add translations.
8. Add mapper tests.
9. Manually test with:
   - student with grade entries
   - student with no grade entries
   - missing term context
   - backend validation failure
   - backend empty snapshot

---

## 14. Acceptance Criteria

- Grades tab no longer calls `/grades/students/:studentId/snapshot` without `termId`.
- Grades tab uses current academic year and term context.
- Backend response is mapped to the existing frontend `StudentGradesSnapshot` shape.
- KPIs render real backend data.
- Subject table renders real backend subjects.
- Performance chart renders real backend assessment percentages.
- Empty state appears when there are no grades.
- Error state appears when backend request fails.
- Mapper tests pass.
- No mock grades data is used in the Grades tab.

---

## Final Recommendation

Use the existing backend endpoint.

Do **not** add another frontend mock layer.

The required frontend work is:

```text
pass term context → call real endpoint → map backend shape → render existing UI
```

This keeps the Grades tab consistent with the rest of the dashboard and avoids backend changes.
