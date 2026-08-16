# Grades Assessments Contract Repair Delta

## Purpose

This documentation captures the focused fix introduced by:

```text
commit: d04b871c10eb7c108ecb63e3a764141d9b41e500
message: fix: support question-based grade assessment contracts
```

The fix repairs drift in the Dashboard Grades Assessment contract after question-based assessments became accepted V1 scope.

## Scope Of This Delta

This package documents only what changed in this step:

- Dashboard assessment detail now supports both `SCORE_ONLY` and `QUESTION_BASED`.
- Dashboard assessment list no longer forces score-only by default.
- Dashboard assessment list accepts optional `deliveryMode` filters.
- Draft question-based assessments can be patched through the existing CRUD endpoint when otherwise mutable.
- Draft question-based assessments can be soft-deleted when no grade items and no submissions exist.
- Approved question-based assessments can be locked when otherwise lockable.
- Direct GradeItem entry remains score-only only.
- General score-only creation route remains score-only and rejects question-based creation with a current, actionable message.

## Explicitly Not A Full Feature Rewrite

This is not a rewrite of:

- Homework
- Full Grades module
- Full Assessments module
- Student exams workflow
- Student/Parent grade summaries
- Teacher classroom gradebook
- Question authoring internals

Those were documented in previous packages. This document is a delta supplement.
