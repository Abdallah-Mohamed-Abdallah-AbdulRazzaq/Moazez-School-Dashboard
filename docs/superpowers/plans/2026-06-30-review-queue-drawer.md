# Reinforcement Review Queue Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate review details page with an interactive details drawer (`ReinforcementReviewDetailsDrawer`) on the Review Queue page. The drawer should display full details (task info, stage info, student info, proof, and history timeline) and support workflows (approve/reject actions, followed by the XP grant modal on successful approval). Opening the drawer should be triggered by both clicking the "View Details" button and clicking any row in the queue table.

**Architecture:**
- Create `ReinforcementReviewDetailsDrawer` to render the details layout.
- Update `ReinforcementReviewQueuePage` to manage the drawer state, fetch full submission details by ID on open, and handle the approval, rejection, and XP granting workflows.
- Update `ReinforcementReviewQueuePage.test.tsx` to add automated tests for the drawer's interaction, row click opening, and workflow triggers.

---

### Task 1: Create Review Details Drawer Component

**Files:**
- Create: `src/features/reinforcement/components/ReinforcementReviewDetailsDrawer.tsx`

- [ ] **Step 1: Write ReinforcementReviewDetailsDrawer component**

Create [ReinforcementReviewDetailsDrawer.tsx](file:///e:/sis-dashboard/src/features/reinforcement/components/ReinforcementReviewDetailsDrawer.tsx):

```typescript
"use client";

import { AlertCircle, CheckCircle, Clock, FileText, RefreshCw, X, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import type { ReinforcementReviewItem, ReinforcementReviewStatus } from "../types";

interface ReinforcementReviewDetailsDrawerProps {
  isOpen: boolean;
  review: ReinforcementReviewItem | null;
  loading: boolean;
  error: string | null;
  canManage: boolean;
  onClose: () => void;
  onRetry: () => void;
  onAction: (action: "approve" | "reject") => void;
}

const STATUS_STYLES: Record<ReinforcementReviewStatus, string> = {
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="break-words text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function ReinforcementReviewDetailsDrawer({
  isOpen,
  review,
  loading,
  error,
  canManage,
  onClose,
  onRetry,
  onAction,
}: ReinforcementReviewDetailsDrawerProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");

  if (!isOpen) return null;

  const missing = "—";
  const localized = (en?: string | null, ar?: string | null) =>
    (locale === "ar" ? ar || en : en || ar) || missing;

  const formatDate = (date: string | null | undefined) =>
    date
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(date))
      : missing;

  const studentName = review?.student
    ? localized(
        review.student.name || `${review.student.firstName || ""} ${review.student.lastName || ""}`.trim(),
        review.student.nameAr
      )
    : missing;

  return (
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("reviews.detail.title") || "Review Details"}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`absolute inset-y-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl ${
          locale === "ar" ? "left-0" : "right-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-primary">
              {t("reviews.detail.title") || "Review Details"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {review ? localized(review.task?.titleEn, review.task?.titleAr) : "—"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close") || "Close"}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={onRetry}
              >
                {t("common.retry") || "Retry"}
              </Button>
            </div>
          ) : null}

          {!loading && !error && review ? (
            <div className="space-y-5">
              {/* Header card info */}
              <section className="flex flex-col gap-2 rounded-2xl border border-gray-200 p-4">
                <div className="min-w-0 space-y-2">
                  <p className="text-lg font-bold text-gray-900">{studentName}</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[review.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`reviews.status.${review.status}`) || review.status}
                  </span>
                  <p className="text-sm text-gray-500">
                    {t("reviews.detail.source") || "Source"}: {review.task?.source || missing}
                  </p>
                </div>
              </section>

              {/* Task Details */}
              <DetailsSection title={t("reviews.detail.taskInfo") || "Task Information"}>
                <DetailRow
                  label={t("reviews.table.task") || "Task"}
                  value={localized(review.task?.titleEn, review.task?.titleAr)}
                />
                <DetailRow
                  label={t("reviews.detail.source") || "Source"}
                  value={review.task?.source || missing}
                />
                <DetailRow
                  label={t("reviews.detail.dueDate") || "Due Date"}
                  value={formatDate(review.task?.dueDate)}
                />
              </DetailsSection>

              {/* Stage Details */}
              <DetailsSection title={t("reviews.detail.stageInfo") || "Stage Information"}>
                <DetailRow
                  label={t("reviews.table.stage") || "Stage"}
                  value={localized(review.stage?.titleEn, review.stage?.titleAr)}
                />
                <DetailRow
                  label={t("reviews.detail.proofType") || "Proof Type"}
                  value={review.stage?.proofType || missing}
                />
                <DetailRow
                  label={t("reviews.detail.requiresApproval") || "Requires Approval"}
                  value={review.stage?.requiresApproval ? t("common.yes") || "Yes" : t("common.no") || "No"}
                />
              </DetailsSection>

              {/* Student Details */}
              <DetailsSection title={t("reviews.detail.studentInfo") || "Student Information"}>
                <DetailRow
                  label={t("reviews.table.student") || "Student"}
                  value={studentName}
                />
                <DetailRow
                  label={t("reviews.detail.studentCode") || "Student Code"}
                  value={review.student?.code || review.student?.admissionNo || missing}
                />
                <DetailRow
                  label={t("reviews.detail.submittedAt") || "Submitted At"}
                  value={formatDate(review.submittedAt)}
                />
              </DetailsSection>

              {/* Proof Details */}
              <DetailsSection title={t("reviews.detail.proof") || "Proof Submission"}>
                {review.proof?.proofText ? (
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase text-gray-500 mb-1">
                      {t("reviews.detail.proofText") || "Proof Text"}
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {review.proof.proofText}
                    </p>
                  </div>
                ) : null}
                {review.proof?.proofFileId ? (
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase text-gray-500 mb-1">
                      {t("reviews.detail.proofFile") || "Proof File"}
                    </div>
                    <a
                      href={`/api/files/${review.proof.proofFileId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {t("reviews.detail.viewFile") || "View File"}
                    </a>
                  </div>
                ) : null}
                {!review.proof?.proofText && !review.proof?.proofFileId && (
                  <p className="text-sm text-gray-500">
                    {t("reviews.detail.noProof") || "No proof submitted"}
                  </p>
                )}
              </DetailsSection>

              {/* Review History */}
              <DetailsSection title={t("reviews.detail.history") || "Review History"}>
                {review.reviewHistory && review.reviewHistory.length > 0 ? (
                  <div className="space-y-4">
                    {review.reviewHistory.map((entry, index) => {
                      const entryStatus = entry.status || entry.outcome;
                      const isApproved = entryStatus === "approved";
                      const isRejected = entryStatus === "rejected";
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 border-l-2 border-gray-200 pl-4"
                        >
                          <div
                            className={`mt-0.5 rounded-full p-1 ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-600"
                                : isRejected
                                  ? "bg-red-100 text-red-600"
                                  : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : isRejected ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {entryStatus ? t(`reviews.status.${entryStatus}`) || entryStatus : "-"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(entry.reviewedAt)}
                              </span>
                            </div>
                            {entry.note || entry.noteAr ? (
                              <p className="mt-1 text-sm text-gray-600">
                                {locale === "ar"
                                  ? entry.noteAr || entry.note || ""
                                  : entry.note || entry.noteAr || ""}
                              </p>
                            ) : null}
                            {entry.reviewerName ? (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {entry.reviewerName}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("reviews.detail.noHistory") || "No review history"}
                  </p>
                )}
              </DetailsSection>
            </div>
          ) : null}
        </div>

        {review && !loading && !error && review.status === "submitted" && canManage ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<CheckCircle className="h-4 w-4" />}
              onClick={() => onAction("approve")}
            >
              {t("reviews.actions.approve") || "Approve"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => onAction("reject")}
            >
              {t("reviews.actions.reject") || "Reject"}
            </Button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

function DetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">{title}</h3>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}
```

- [ ] **Step 2: Export from reinforcement page or components index**

Verify import/export availability in components module.

---

### Task 2: Integrate Details Drawer into Review Queue Page

**Files:**
- Modify: `src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx`

- [ ] **Step 1: Integrate ReinforcementReviewDetailsDrawer and action handlers**

Modify `ReinforcementReviewQueuePage.tsx` to:
1. Import `ReinforcementReviewDetailsDrawer` from `../components/ReinforcementReviewDetailsDrawer` (new drawer).
2. Import `ReinforcementReviewActionModal` from `../components/ReinforcementReviewActionModal`.
3. Import `Modal` and `Input` components.
4. Import `grantXpForReinforcementReview` service function from `../services/reinforcementXpService`.
5. Import `getReinforcementReviewItem` service function from `../services/reinforcementReviewsService`.
6. Add state hooks for:
   - `selectedSubmissionId: string | null`
   - `drawerOpen: boolean`
   - `drawerLoading: boolean`
   - `drawerError: string | null`
   - `selectedReview: ReinforcementReviewItem | null`
   - `actionModalOpen: boolean`
   - `actionType: "approve" | "reject"`
   - `actionLoading: boolean`
   - `xpModalOpen: boolean`
   - `xpAmount: string`
   - `xpGranting: boolean`
7. Add a `useEffect` hook to fetch full submission details by ID when `selectedSubmissionId` changes:
   ```typescript
   useEffect(() => {
     if (!selectedSubmissionId || !canView) return;
     let active = true;
     const fetchDetails = async () => {
       setDrawerLoading(true);
       setDrawerError(null);
       try {
         const details = await getReinforcementReviewItem(selectedSubmissionId);
         if (active) {
           setSelectedReview(details);
         }
       } catch (err) {
         if (active) {
           setDrawerError(err instanceof Error ? err.message : "Failed to load details");
         }
       } finally {
         if (active) setDrawerLoading(false);
       }
     };
     void fetchDetails();
     return () => {
       active = false;
     };
   }, [selectedSubmissionId, canView]);
   ```
8. Update action callback handlers:
   - Clicking "View Details" button updates state:
     ```typescript
     setSelectedSubmissionId(row.id);
     setDrawerOpen(true);
     ```
   - Approve / Reject action triggered from inside the drawer opens `actionModalOpen` with type `"approve"` or `"reject"`.
   - Submit of the action modal calls `approveReinforcementSubmission` or `rejectReinforcementSubmission`, updates `selectedReview` state to show the updated outcome in the drawer, refreshes the parent queue list, and opens the XP grant modal if approved.
   - XP grant submission calls `grantXpForReinforcementReview` and closes modal.
9. Render the `ReinforcementReviewDetailsDrawer`, `ReinforcementReviewActionModal`, and the XP grant `Modal` at the bottom of the JSX tree.
10. Update the columns config:
    - Replace the `<Link>` element in the `actions` column with a direct `Button` that opens the drawer:
      ```typescript
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSubmissionId(row.id);
          setDrawerOpen(true);
        }}
      >
        {t("reviews.actions.viewDetail")}
      </Button>
      ```
    - Add `onRowClick` to `DataTable`:
      ```typescript
      onRowClick={(row) => {
        setSelectedSubmissionId(row.id);
        setDrawerOpen(true);
      }}
      ```

- [ ] **Step 2: Run type check**

Run:
```powershell
npm run typecheck
```
Expected: PASS

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx src/features/reinforcement/components/ReinforcementReviewDetailsDrawer.tsx
git commit -m "feat: replace separate review details page with details drawer on queue page"
```

---

### Task 3: Write Test Cases for Drawer & Workflow Interactions

**Files:**
- Modify: `src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx`

- [ ] **Step 1: Write test cases**

Update `ReinforcementReviewQueuePage.test.tsx` to verify:
1. Clicking a row or clicking the "View Details" button opens the details drawer.
2. The drawer displays task information and history details.
3. Clicking the Approve action inside the drawer opens the action modal and submits approval, followed by the XP grant modal.

- [ ] **Step 2: Run tests**

Run tests:
```powershell
npx vitest run src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx
```
Expected: PASS

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx
git commit -m "test: add unit tests for Review Queue drawer interaction"
```
