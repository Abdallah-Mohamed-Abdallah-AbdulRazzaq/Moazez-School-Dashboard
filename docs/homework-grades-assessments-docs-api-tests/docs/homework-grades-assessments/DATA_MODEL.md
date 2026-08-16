# Data Model Overview

This document summarizes the implemented model concepts. It is intentionally descriptive and does not replace `prisma/schema.prisma`.

## Grades / Assessments core concepts

### GradeAssessment

Represents an assessment owned by a school and academic scope.

Conceptual relationships:

- school / academic year / term.
- grade / classroom / subject scope where applicable.
- assessment lifecycle status.
- assessment mode / type such as score-only or question-based.
- questions and options for question-based assessments.
- submissions for question-based workflows.
- grade items for final score storage.

### GradeAssessmentQuestion / GradeAssessmentQuestionOption

Represent question-based assessment structure.

Capabilities:

- question CRUD.
- reorder.
- bulk points update.
- option management.
- safe hiding of answer keys/correct answers from student/parent surfaces.

### GradeSubmission / GradeSubmissionAnswer

Represent question-based assessment submission and answers.

Capabilities:

- resolve/create submission.
- save single/bulk answers.
- submit.
- review single/bulk answers.
- finalize review.
- sync reviewed results into GradeItem.

### GradeItem

Represents the final or direct score item for a student/assessment.

Direct GradeItem write is dashboard-only in V1.

Teacher App direct score-only GradeItem writes are absent by accepted decision.

### GradeRule

Represents grading rules and effective grading policy lookup.

## Homework core concepts

### HomeworkAssignment

Represents a homework assignment lifecycle.

Typical lifecycle:

```text
DRAFT -> PUBLISHED -> CLOSED
DRAFT/PUBLISHED -> CANCELLED
```

Capabilities:

- create/update draft.
- publish.
- close.
- cancel.
- target resolution.
- questions/options.
- attachments.
- review and grade sync.

### HomeworkTarget

Represents target rows or resolved audience for a homework assignment.

Targets control which students can see and submit homework.

### HomeworkQuestion / HomeworkQuestionOption

Represent assignment questions and multiple-choice options.

Question/option surfaces are available in dashboard and Teacher App owned-allocation routes.

Student/parent views hide answer keys/correct answers.

### HomeworkAssignmentAttachment

Links uploaded files to a homework assignment.

Responses expose safe file metadata only.

### HomeworkSubmission

Represents a student's homework submission.

Typical lifecycle:

```text
DRAFT/SAVED -> SUBMITTED -> REVIEWED
```

Lifecycle details depend on assignment state and implemented validations.

### HomeworkSubmissionAnswer

Represents a student's answer for a homework question.

Students can save own answers. Dashboard/Teacher review surfaces can review answers where allowed.

### HomeworkSubmissionAttachment

Links uploaded files to a student's homework submission.

Student can manage own submission attachments before lifecycle restrictions apply.

## Cross-feature bridge

Homework-to-Grades sync links HomeworkAssignment/Submission to a compatible GradeAssessment/GradeItem workflow.

Sync operations respect:

- target school.
- assessment compatibility.
- locked assessment protection.
- closed/inactive term protection.
- active enrollment.
- score bounds.
- review state.

## School scope and soft delete

The relevant Homework and Grades models are school-scoped where applicable and protected by the shared Prisma school scope extension.

Models with `deletedAt` participate in soft-delete filtering for reads unless an explicit safe bypass is used internally.
