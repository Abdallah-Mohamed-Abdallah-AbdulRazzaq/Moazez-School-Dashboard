# Homework Frontend Contract Safety Design

**Backend authority:** `Moazez-Backend` current Homework Core contract.

## Goal

Make the Homework builder accurately reflect backend failures and recover safely from
the non-atomic question-and-option save workflow.

## Scope

This is a frontend-only change in the Homework API adapter, error handling, and
assignment builder. It does not introduce backend routes, alter permissions, or
change homework lifecycle rules.

## Contract Errors

Question and attachment list requests currently convert every HTTP 404 into an
empty list. The frontend will use the backend error code, not only HTTP status,
to decide whether an empty optional collection is valid.

Only the explicitly supported absent-resource code returns an empty list. A
missing homework assignment, access/ownership denial, invalid request, server
failure, and network failure remain errors and are displayed through the
existing Homework error mapping.

## Question Save Reconciliation

Saving a question can perform several backend mutations: delete stale options,
update the question, create/update/reorder options, and reload the question.
The backend has no atomic replace-question endpoint.

The builder will track when this mutation sequence begins. If a later step
fails, it will reload the assignment, questions, and attachments before showing
an error that some changes may already have been saved. The authoritative reload
replaces the local question state; the frontend never represents an invented
rollback.

## Feedback and Testing

The UI distinguishes unavailable resources from a partial question save. Tests
cover code-specific list fallback and failure after an option mutation. Verify
with the Homework test suite, TypeScript check, lint for touched files, and a
production build.

## Non-goals

- Backend transactions or a replacement endpoint.
- Changes to publish, close, cancel, submissions, reviews, targets, or grade
  sync.
- Changes outside the Homework feature.

