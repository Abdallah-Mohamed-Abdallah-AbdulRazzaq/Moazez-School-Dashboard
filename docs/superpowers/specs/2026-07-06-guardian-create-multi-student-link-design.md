# Guardian Create Multi-Student Link Design

## Goal

Allow admins to create a guardian and optionally link that new guardian to one or more existing students in the same flow. Also make the guardian edit modal expose every guardian profile field supported by the backend update contract.

## Approach

The backend keeps guardian creation and student linking as separate endpoints, so the frontend will preserve that contract. The create flow will first call `POST /students-guardians/guardians`, then call `POST /students-guardians/students/{studentId}/guardians` once for each selected student.

## Create Guardian Flow

`AddGuardianModal` will support optional multi-student selection using the existing student search service. Each selected student can be marked as primary independently, because primary status belongs to the student-guardian link rather than the guardian profile globally.

Submitting with no selected students creates only the guardian. Submitting with selected students creates the guardian and attempts each link. If one or more links fail after the guardian is created, the modal reports the failed student links without rolling back the created guardian.

## Edit Guardian Flow

The guardian edit modal on the guardians list will include all backend-supported profile fields: `full_name`, `relation`, `phone_primary`, `phone_secondary`, `email`, `national_id`, `job_title`, `workplace`, `is_primary`, `can_pickup`, and `can_receive_notifications`.

## Testing

Add focused component tests for the create modal multi-select behavior and for the guardians list submit flow that creates a guardian and links it to multiple students. Run the students-guardians Vitest subset and TypeScript typecheck.
