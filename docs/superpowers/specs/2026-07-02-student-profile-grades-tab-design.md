# Spec: Wire Student Profile Grades Tab to Real Backend

Wire the **Grades** tab in the student profile to the real backend snapshot API endpoint (`GET /grades/students/:studentId/snapshot?academicYearId=...&termId=...`), replacing mock data and mapping the backend response format to the frontend UI dashboard components.

## Goal
Connect the student profile `GradesTab` component to live backend data by passing active academic year and term context parameters, transforming the backend payload structure to the UI snapshot format, and handling missing context, empty snapshots, and error states gracefully.

---

## Proposed Changes

### 1. Type Definitions
- **Location**: `src/features/grades/shared/types.ts`
- **Changes**:
  - Add `BackendStudentGradeSnapshotAssessment`, `BackendStudentGradeSnapshotSubject`, and `BackendStudentGradeSnapshot` interfaces representing the raw API payload.
  - Include the `rule` object in `BackendStudentGradeSnapshot`:
    ```typescript
    rule: {
      source: string;
      ruleId: string | null;
      passMark: number;
      rounding: string;
      gradingScale: string;
    };
    ```
  - Retain existing `StudentGradesSnapshot` and `StudentSubjectGradeSummary` interfaces used by UI components.

### 2. Snapshot Mapper Utility
- **Location**: `src/features/grades/overview/utils/studentGradesSnapshotMapper.ts`
- **Changes**:
  - Create `mapBackendStudentGradeSnapshot(snapshot: BackendStudentGradeSnapshot): StudentGradesSnapshot`.
  - Extract valid numeric `finalPercent` values directly from `snapshot.subjects` to compute `highestAverage`, `lowestAverage`, and `currentAverage`.
  - Calculate `totalAssessments` from `snapshot.assessments.length`.
  - Build `performanceTrend` array for the line chart from assessment percentages and labels.
  - Map individual subjects into `subjectRows` with score movement `trend` (`"up" | "down" | "stable"`).

### 3. Service Layer Update
- **Location**: `src/features/grades/overview/services/gradesOverviewService.ts`
- **Changes**:
  - Update `fetchStudentGradesSnapshot` to require `options: { academicYearId: string; termId: string }`.
  - Extend existing import from `../../shared/types` to include `BackendStudentGradeSnapshot`.
  - Pass params to `apiGet<BackendStudentGradeSnapshot>` and transform via `mapBackendStudentGradeSnapshot`.

### 4. Component & Page Updates
- **Locations**:
  - `src/features/students-guardians/students/pages/StudentProfilePage.tsx`
  - `src/features/students-guardians/students/components/StudentTabLoader.tsx`
  - `src/features/students-guardians/students/components/tabs/GradesTab.tsx`
- **Changes**:
  - Read `yearId` and `termId` from `useStudentsGuardiansYearTermContext()` in `StudentProfilePage` and `StudentTabLoader`.
  - Pass `academicYearId={yearId}` and `termId={termId}` down into `GradesTab`.
  - Replace `ComingSoonTab label="Grades"` in `StudentTabLoader` with real `<GradesTab>`.
  - In `GradesTab`, block fetching if `!academicYearId || !termId` and render a clear context prompt.
  - Catch enrollment or loading errors and map missing enrollment/snapshot to `no_snapshot_available` or general loading error to `loading_error`.

### 5. Translations
- **Locations**: `src/messages/en.json` & `src/messages/ar.json`
- **Changes**:
  - Add `missing_term_context`, `no_snapshot_available`, and `loading_error` under student profile grades translations.

---

## Verification Plan

### Automated Tests
- Create unit test `src/features/grades/overview/utils/__tests__/studentGradesSnapshotMapper.test.ts` to test mapper logic against realistic backend payloads (using backend-accurate rule properties like `rounding: "decimal_2"`, `gradingScale: "percentage"` and statuses like `entered`, `passing`, `incomplete`, `missing`).
- Run `npx vitest run src/features/grades` and `npx vitest run src/features/students-guardians`.
- Run `npm run typecheck`.

### Manual Verification
- Navigate to a student profile's Grades tab with a selected academic year and term.
- Confirm real grades, averages, trends, and line chart points render accurately.
- Verify clear prompt appears when no academic year or term is selected in the header.
