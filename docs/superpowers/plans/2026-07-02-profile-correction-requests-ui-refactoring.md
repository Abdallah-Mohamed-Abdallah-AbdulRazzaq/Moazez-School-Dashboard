# Profile Correction Requests UI Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the profile correction requests UI pages to use standard project components like `Input`, `Select`, `Button`, and `DataTable`.

**Architecture:** Integrate UI primitive components into `ProfileCorrectionRequestsQueuePage` and `ProfileCorrectionRequestDetailPage`, removing custom HTML forms, dropdowns, and tables to align with standard project aesthetics and accessibility.

**Tech Stack:** React, TypeScript, Next.js, next-intl, Tailwind CSS, Lucide icons, `@/components/ui`.

## Global Constraints
- Do not introduce syntax or TS errors to page components.
- Maintain existing API routing parameters and state variables.
- Match existing text labels exactly.

---

### Task 1: Refactor ProfileCorrectionRequestsQueuePage
Refactor the queue list page to utilize `Input`, `Select`, and `DataTable` UI primitives.

**Files:**
- Modify: `src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestsQueuePage.tsx`

**Interfaces:**
- Consumes: `@/components/ui` components (`Input`, `Select`, `DataTable`, `Button`, `EmptyState`)
- Produces: Refactored `ProfileCorrectionRequestsQueuePage` JSX layout

- [ ] **Step 1: Update imports in ProfileCorrectionRequestsQueuePage.tsx**

Replace imports to include the UI components:
```typescript
import { Input, Select, Button, EmptyState } from "@/components/ui";
import { DataTable, type Column } from "@/components/ui/data-table/DataTable";
```

- [ ] **Step 2: Replace filters layout in ProfileCorrectionRequestsQueuePage.tsx**

Replace the status select and studentId input with:
```typescript
<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
  <Select
    label="Status"
    value={status}
    onChange={(val) => setStatus(val as ProfileCorrectionRequestStatus | "all")}
    options={[
      { value: "PENDING", label: "Pending" },
      { value: "APPROVED", label: "Approved" },
      { value: "REJECTED", label: "Rejected" },
      { value: "CANCELLED", label: "Cancelled" },
      { value: "all", label: "All" },
    ]}
  />
  <Input
    label="Student ID"
    value={studentId}
    onChange={(event) => setStudentId(event.target.value)}
    placeholder="Optional"
  />
</div>
```

- [ ] **Step 3: Define DataTable columns and replace table**

Define the columns array:
```typescript
const columns: Column<ProfileCorrectionRequestListItem>[] = [
  {
    key: "student",
    label: "Student",
    render: (_, request) => (
      <div>
        <div className="font-medium text-gray-900">
          {request.studentName || request.studentId}
        </div>
        <div className="text-xs text-gray-500">
          {request.studentId}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (_, request) => (
      <span className="capitalize">{request.status.toLowerCase()}</span>
    ),
  },
  {
    key: "changeCount",
    label: "Changes",
  },
  {
    key: "requestedAt",
    label: "Requested",
  },
  {
    key: "actions",
    label: "Action",
    render: (_, request) => (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/${lang}/students-guardians/profile-correction-requests/${request.id}`);
        }}
      >
        Open
      </Button>
    ),
  },
];
```

And replace the custom `<table>` structure with:
```typescript
<DataTable
  columns={columns}
  data={requests}
  isLoading={isLoading}
  onRowClick={(request) =>
    router.push(
      `/${lang}/students-guardians/profile-correction-requests/${request.id}`,
    )
  }
  emptyTitle="No requests found"
  emptyDescription="No profile correction requests found."
/>
```

- [ ] **Step 4: Verify typecheck compiles**

Run: `npm run typecheck`
Expected: Passes typecheck for all files except pre-existing DocumentsTab compile errors.

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/features/students-guardians/profile-correction-requests`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestsQueuePage.tsx
git commit -m "refactor: use UI primitives on ProfileCorrectionRequestsQueuePage"
```

---

### Task 2: Refactor ProfileCorrectionRequestDetailPage
Refactor the detail page to utilize `Button`, `TextArea`, and standard layout elements.

**Files:**
- Modify: `src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestDetailPage.tsx`

**Interfaces:**
- Consumes: `@/components/ui` components (`Button`, `TextArea`)
- Produces: Refactored `ProfileCorrectionRequestDetailPage` JSX layout

- [ ] **Step 1: Update imports in ProfileCorrectionRequestDetailPage.tsx**

Replace imports to include the UI components and ChevronLeft icon:
```typescript
import { Button, TextArea } from "@/components/ui";
import { ChevronLeft } from "lucide-react";
```

- [ ] **Step 2: Replace Back to queue link with a Ghost Button**

Replace button at line 97:
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() =>
    router.push(`/${lang}/students-guardians/profile-correction-requests`)
  }
  leftIcon={<ChevronLeft className="h-4 w-4" />}
  className="w-fit"
>
  Back to queue
</Button>
```

- [ ] **Step 3: Replace Reviewer Note textarea with TextArea component**

Replace the reviewer note label and textarea with:
```typescript
<TextArea
  label="Reviewer note"
  rows={3}
  value={reviewerNote}
  onChange={(event) => setReviewerNote(event.target.value)}
/>
```

- [ ] **Step 4: Replace Approve and Reject buttons**

Replace the standard button tags with UI buttons:
```typescript
<div className="mt-4 flex flex-wrap gap-3">
  <Button
    variant="success"
    disabled={!canReviewProfileCorrectionRequests || isReviewing}
    loading={isReviewing}
    onClick={() => void handleReview("approve")}
  >
    Approve
  </Button>
  <Button
    variant="danger"
    disabled={!canReviewProfileCorrectionRequests || isReviewing}
    loading={isReviewing}
    onClick={() => void handleReview("reject")}
  >
    Reject
  </Button>
</div>
```

- [ ] **Step 5: Verify typecheck compiles**

Run: `npm run typecheck`
Expected: Passes typecheck for all files except pre-existing DocumentsTab compile errors.

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/features/students-guardians/profile-correction-requests`
Expected: PASS

- [ ] **Step 7: Commit changes**

```bash
git add src/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestDetailPage.tsx
git commit -m "refactor: use UI primitives on ProfileCorrectionRequestDetailPage"
```
