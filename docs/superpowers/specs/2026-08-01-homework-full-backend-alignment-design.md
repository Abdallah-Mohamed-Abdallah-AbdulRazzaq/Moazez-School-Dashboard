# Homework Full Backend Alignment Design

**Backend authority:** `Moazez-Backend` current Homework Core contract.

## Goal

Align the frontend Homework assignment, submission-review, and grade-sync
workflows with the existing backend contract. This change is frontend-only and
preserves the current backend routes and lifecycle rules.

## Scope

The repair covers:

- assignment request and response semantics;
- create and edit validation;
- question-based and body-only submission review;
- reviewed-submission read-only behavior;
- grade-sync permissions, eligibility, discovery, and status labels;
- question and attachment loading failures; and
- recovery after a partially applied question mutation.

Changes outside the Homework frontend and shared controls directly consumed by
Homework are out of scope. Existing unrelated working-tree changes must remain
untouched.

## Architecture

Use a contract-first repair. The Homework API types and mappers preserve backend
meaning, while pages and panels consume those normalized models. Validation and
workflow predicates encode backend preconditions once and are covered with
focused unit tests.

The design has four boundaries:

1. The contract layer preserves nullability and backend terminology.
2. The assignment layer validates backend limits before sending requests.
3. The review workflow derives editability and finalization from submission and
   answer state.
4. The grade-sync workflow mirrors backend permission and compatibility rules.

## Assignment Contract and Validation

`totalMarks` remains nullable from the backend response through the Homework UI
model and builder state. A null value renders as an empty field rather than zero.
Assignment updates must not turn a backend null into `0`, and optional fields are
omitted unless the user intentionally supplies or clears them.

Create and edit flows share these constraints:

- title is trimmed, required, and at most 180 characters;
- description is optional and at most 4,000 characters;
- due date is required, must be a valid future date-time, and must be later than
  `publishAt` when scheduled publication is present;
- graded homework requires total marks; when supplied, total marks must be at
  least `0.01` with at most two decimal places;
- ungraded homework may keep total marks null; and
- estimated minutes is optional or null, otherwise an integer of at least `1`.

The frontend must block requests that violate these rules and show localized
field feedback. Existing ungraded assignments with nullable marks remain
editable. A graded assignment cannot be saved without marks because the backend
enforces that invariant.

## Submission Review Workflow

Submission status determines editability. `submitted` and `late` submissions
may be reviewed. A `reviewed` submission is read-only, including answer score,
answer feedback, submission note, final mark, and all save actions. Any other
unexpected non-reviewable status is also treated as read-only.

Each answer score is optional or a finite number between zero and the question's
points, inclusive, with at most two decimal places. Answer feedback is optional,
trimmed, and limited to 2,000 characters. Individual and bulk answer save
actions are unavailable while their affected answers are invalid.

The Homework question model preserves the backend `isRequired` field. Required
answer completion is determined from that field and the answer's `reviewedAt`
value; a reviewed answer may still have a null score because the backend permits
clearing awarded points.

For homework with questions:

- the displayed assignment-level mark is the current answer-score rollup;
- the assignment-level mark is read-only;
- final review requires every required answer to have a completed review;
- final review is unavailable while answer changes remain unsaved; and
- the frontend sends the optional review note but treats the backend as the
  authority for the calculated awarded mark.

For graded homework without questions, the assignment-level awarded mark remains
editable. It is optional, non-negative, limited to two decimal places, and must
not exceed the assignment total marks. For ungraded homework without questions,
the awarded mark is read-only and omitted from the review request because the
backend rejects manual marks for ungraded homework.

The final-review action does not depend on the note or mark fields being dirty.
A reviewable body-only submission may be finalized with an empty request, and a
question-based submission may be finalized as soon as its required answer
reviews are complete and saved. A supplied review note is trimmed, non-empty,
and at most 2,000 characters.

After final review succeeds, the returned `reviewed` status immediately locks
the panel. Backend conflicts continue through the existing Homework error
mapping.

## Grade-Sync Workflow

Frontend permission gates exactly match the controller:

- status view requires `homework.assignments.view` and `grades.items.view`;
- assessment linking requires `homework.assignments.manage` and
  `grades.assessments.manage`; and
- assignment or submission sync requires `homework.assignments.manage` and
  `grades.items.manage`.

Per-submission sync is available only for a reviewed submission and only when a
grade assessment is linked. Assessment linking is unavailable for cancelled or
archived homework, matching the backend assignment-state guard. Linking is also
unavailable after an assessment has already been linked because the backend
rejects duplicate or replacement links and exposes no unlink operation. The
linked assessment is displayed as read-only state.

Assessment discovery includes backend-compatible school, stage, grade, section,
and classroom scopes. The assignment mapper retains classroom, section, and
grade identifiers from the Homework response; the existing academic structure
tree supplies the containing stage identifier. The panel issues one assessment
query for each resolvable scope in that hierarchy.

Candidates must match the homework academic year, term, subject, assignment
assessment type, compatible placement, and unlocked requirement. Discovery does
not restrict approval status because the Homework backend link contract does not
require a particular assessment approval state. Results from multiple scope
queries are deduplicated by assessment ID. An existing linked assessment remains
visible even when it is no longer selectable.

The UI preserves backend grade-sync terminology. In particular,
`pendingSyncSubmissions` is represented and labeled as pending, not skipped.
Synced and failed counts retain their backend meanings.

## Question and Attachment Safety

A successful empty child collection is represented by `{ items: [] }`. Missing
homework, ownership or access denial, invalid requests, server failures, and
network failures propagate as errors. The adapter does not convert an HTTP 404
into a successful empty collection without a backend code that explicitly
defines that behavior.

Question editing remains a non-atomic sequence because the backend exposes
separate question, option, and reorder mutations. Once a question mutation has
started, a later failure triggers an authoritative reload of the assignment,
questions, and attachments. The reload replaces local drafts and saved
snapshots before the partial-save warning is shown. If recovery also fails, the
UI reports both the original save failure and the reload failure. The frontend
never invents a rollback.

## Error Handling

Client validation prevents known contract violations. Backend domain errors
remain authoritative for concurrency, ownership, lifecycle, and cross-resource
constraints. Existing Homework error-code translation is reused rather than
introducing component-specific message parsing.

Permission mismatches hide or disable unsupported actions; they are not handled
as expected runtime errors. Unexpected backend failures remain visible through
the established toast messages.

## Testing

Regression coverage includes:

- nullable total marks surviving response mapping and unrelated edits;
- graded-marks requirements and ungraded nullable marks;
- rejection of zero marks, zero duration, overlong text, past or invalid due
  dates, due dates not later than `publishAt`, and excessive decimal precision
  before requests;
- read-only reviewed submissions;
- answer score minimum, maximum, finiteness, and decimal precision;
- answer feedback and final review-note limits;
- preservation of `isRequired` and completion checks based on `reviewedAt`;
- required-answer completion and answer-score rollup before final review;
- finalization without requiring an artificial dirty field;
- manual final marks for graded homework without questions and omission of marks
  for ungraded homework;
- exact per-submission grade-sync permissions and reviewed-state gating;
- cancelled/archived link gating;
- duplicate-link prevention and read-only linked state;
- multi-scope assessment discovery across approval states and deduplication;
- pending grade-sync naming and mapping;
- propagation of question and attachment loading errors; and
- authoritative recovery after partial question mutation failure.

Completion requires fresh successful runs of:

- the Homework Vitest suite and targeted component tests;
- TypeScript checking;
- lint for touched files;
- `git diff --check`; and
- the production build.

## Non-goals

- Backend changes or new endpoints.
- An atomic replace-question endpoint.
- Changes to student, teacher, or parent application Homework APIs.
- New permissions or changed backend authorization rules.
- Broad refactoring outside the Homework integration surface.
