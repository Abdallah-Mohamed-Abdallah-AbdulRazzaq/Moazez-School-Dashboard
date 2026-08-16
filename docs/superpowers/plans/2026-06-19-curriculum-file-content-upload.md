# Curriculum File Content Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable validated FILE lesson-content uploads and downloads in the curriculum learning-content panel.

**Architecture:** A curriculum-local file service owns multipart upload and download URLs. Pure helpers validate selected files and construct type-safe lesson-content payloads; the panel coordinates upload-before-create/update and permission-aware UI.

**Tech Stack:** React 19, TypeScript, Axios, Material UI, Vitest.

---

### Task 1: File upload boundary

**Files:**
- Create: `src/features/academics/curriculum/services/filesService.ts`
- Test: `src/features/academics/curriculum/services/__tests__/filesService.test.ts`

- [ ] Write a failing test asserting `uploadFile` posts a `FormData` containing field `file` to `/files` without a JSON content-type override.
- [ ] Run the focused test and confirm it fails because the module is missing.
- [ ] Implement `FileUploadResponse`, `uploadFile`, and `getFileDownloadUrl`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Validation and payload rules

**Files:**
- Create: `src/features/academics/curriculum/components/learningContentFile.ts`
- Test: `src/features/academics/curriculum/components/__tests__/learningContentFile.test.ts`

- [ ] Write failing tests for missing, oversized, unsupported files; FILE payload shape; and omission of `fileId` from non-FILE payloads.
- [ ] Run the focused test and confirm the expected failures.
- [ ] Implement MIME/size validation and payload construction with a 10 MB limit.
- [ ] Run the focused test and confirm it passes.

### Task 3: Permission-aware panel workflow

**Files:**
- Modify: `src/hooks/usePermissions.ts`
- Modify: `src/features/academics/curriculum/components/LearningContentPanel.tsx`
- Modify: `src/features/academics/curriculum/services/curriculumErrors.ts`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Test: `src/features/academics/curriculum/components/__tests__/LearningContentPanel.test.tsx`

- [ ] Write failing panel tests proving read-only/permission gating, upload-before-create, and client validation.
- [ ] Run the focused test and confirm the expected failures.
- [ ] Add `files.uploads.manage`, file input/edit replacement behavior, metadata display, download action, and upload error messages.
- [ ] Run focused service/component tests, typecheck, and curriculum regression tests.

