# Design Spec: Enhanced UI/UX for Student Profile Grades Tab & Assessments Table

This specification defines the UI/UX design system and component enhancements for the Student Profile **Grades** tab, accommodating all data fields from the backend snapshot endpoint (`GET /grades/students/:studentId/snapshot`), including incomplete states, missing assessments, subject summaries, and an assessment breakdown table.

## Goal
Provide a data-dense, intuitive, and visually polished Grades tab that cleanly displays overall snapshot KPIs, grading rules, a subjects summary table, and a detailed assessments breakdown table—gracefully handling `null` scores, `incomplete` statuses, and `isVirtualMissing` flags without displaying misleading zero values.

---

## 1. UI/UX Design System (ui-ux-pro-max)

- **Pattern**: Data-Dense + Drill-Down Dashboard
- **Color Palette**:
  - Primary / Background: Neutral light surface (`bg-white` / `bg-gray-50`) with slate typography (`text-gray-900`, `text-gray-600`).
  - Status Badges:
    - `passing` / `entered` / `complete`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
    - `incomplete` / `missing` / `pending`: Amber/Orange (`bg-amber-50 text-amber-700 border-amber-200`)
    - `failing` / `absent`: Rose/Red (`bg-rose-50 text-rose-700 border-rose-200`)
- **Typography**: Inter / System Sans, tabular numbers (`font-mono` / `tabular-nums`) for grades and percentages.
- **Micro-interactions**: Hover row highlighting, subtle badge transitions, empty-state illustrations for charts without score data.

---

## 2. Component Architecture & Data Layout

### A. Snapshot Header & Rule Banner
- **Overall Status**: Status pill (`incomplete`, `passing`, `failing`).
- **Grading Rule Card**:
  - **Pass Mark**: `${rule.passMark}%`
  - **Grading Scale**: `${rule.gradingScale}` (e.g. `Percentage`)
  - **Rounding**: `${rule.rounding}` (e.g. `Decimal 0`)
  - **Rule Source**: `${rule.source}`

### B. Summary KPI Cards (4 Cards)
1. **Current Average**: `snapshot.finalPercent != null ? `${snapshot.finalPercent}%` : "--"`. Subtitle: *"Pending Grade Evaluation"* when null.
2. **Completed Weight**: `completedWeight%` with a progress bar relative to total scheduled assessment weight.
3. **Graded Assessments**: `${enteredCount} / ${totalAssessments} Graded`.
4. **Missing Items**: Count of missing assessments with amber warning badge.

### C. Subjects Summary Table
Renders all entries in `snapshot.subjects`:
- **Subject Name**: Localized (`subjectNameEn` for EN, `subjectNameAr` for AR, fallback to `subjectName`).
- **Final Grade**: `subject.finalPercent != null ? `${subject.finalPercent}%` : "--"`.
- **Completed Weight**: `${subject.completedWeight}%`.
- **Assessments Count**: `${subject.enteredCount} / ${subject.assessmentCount}`.
- **Missing / Absent**: `${subject.missingCount}` missing, `${subject.absentCount}` absent.
- **Status**: Status badge (`incomplete`, `passing`, `failing`).

### D. Assessments Breakdown Table
Renders all entries in `snapshot.assessments`:
- **Title**: Localized (`titleEn` / `titleAr` / `title`). If all are `null`, falls back to `${type} — ${formattedDate}`.
- **Subject**: Associated subject name.
- **Type**: Badge for type (`QUIZ`, `EXAM`, `ASSIGNMENT`, etc.).
- **Date**: Formatted date (e.g., `Sep 01, 2026`).
- **Weight**: `${weight}%`.
- **Max Score**: `${maxScore} pts`.
- **Score / Percent**: `score != null ? `${score}/${maxScore} (${percent}%)` : "--"`.
- **Weighted Contribution**: `weightedContribution != null ? `${weightedContribution}%` : "--"`.
- **Status**: Status badge (`entered`, `missing`, `absent`) + `isVirtualMissing` tag ("Pending").

---

## 3. Types & Mapper Updates

- Update `StudentGradesSnapshot` and `StudentSubjectGradeSummary` types to include:
  - `rule`: Grading rule details.
  - `completedWeight`: Overall completed weight.
  - `status`: Overall snapshot status.
  - `subjects`: Detailed subject list with `enteredCount`, `missingCount`, `absentCount`, `completedWeight`.
  - `assessments`: Raw/mapped assessment list for the assessments table.

---

## 4. Verification Plan

### Automated Tests
- Update `studentGradesSnapshotMapper.test.ts` to test subject columns (`enteredCount`, `missingCount`, `absentCount`, `completedWeight`) and assessment table mapping.
- Update `GradesTab.test.tsx` to verify rendering of both Subjects Table and Assessments Table.
- Run `npm run typecheck` and `npx vitest run src/features/grades src/features/students-guardians`.

### Manual Verification
- View Grades tab with the sample JSON payload (1 subject, 2 missing quizzes).
- Confirm "Incomplete" status badge, `--` current average, 0% completed weight progress bar, subjects table with `0/2` entered, and assessments table with `fvjh` and fallback titled quiz.
