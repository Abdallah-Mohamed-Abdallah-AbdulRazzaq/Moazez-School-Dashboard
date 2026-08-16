# Reinforcement Review Queue Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement simplified Academic Year, Term, Student, Status, Search, and Date Range filters on the Reinforcement Review Queue page. Fetch options directly from the `getReinforcementFilterOptions` endpoint and consolidate all filters into a single grid filter panel.

**Architecture:** Use `useReinforcementUrlFilters` to manage the query state. Query `getReinforcementFilterOptions` on context changes to populate Academic Year, Term, and Student dropdowns. Refetch review list from `listReinforcementReviewQueue` when any filter changes.

**Tech Stack:** React, Next.js, TypeScript, Tailwind CSS, Vitest, React Testing Library.

## Global Constraints
- Write type-safe TypeScript code without using `any` types.
- Follow the CommonMark markdown standard (blank line before/after headers and lists).
- Ensure all tests pass before completing.

---

### Task 1: Refactor Review Queue Page Filters

**Files:**
- Modify: `src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx`

**Interfaces:**
- Consumes: `useReinforcementUrlFilters`, `getReinforcementFilterOptions`, `listReinforcementReviewQueue`, `Select`, `Input`.
- Produces: Integrated filter UI and fetching logic inside `ReinforcementReviewQueuePage`.

- [ ] **Step 1: Update imports, helper functions and states**

Refactor [ReinforcementReviewQueuePage.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx) to remove `ReinforcementAcademicContextFilter` and `ReinforcementFilterToolbar`. Set up options loading via `getReinforcementFilterOptions` and parameters mapping.

```typescript
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  approveReinforcementSubmission,
  listReinforcementReviewQueue,
  rejectReinforcementSubmission,
} from "../services/reinforcementReviewsService";
import type {
  ReinforcementReviewItem,
  ReinforcementReviewStatus,
} from "../types";
```

Define helper mappers inside the file:

```typescript
const getLocalizedValue = (
  record: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) {
      return val;
    }
  }
  return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

function mapGenericOption(
  record: unknown,
  locale: string,
): SelectOption | null {
  const rec = toRecord(record);
  if (!rec) return null;

  const id = getLocalizedValue(rec, ["id", "value"]);
  if (!id) return null;

  const nameEn = getLocalizedValue(rec, ["nameEn", "fullNameEn", "full_name_en", "name", "label"]) ?? id;
  const nameAr = getLocalizedValue(rec, ["nameAr", "fullNameAr", "full_name_ar", "name", "label"]) ?? nameEn;
  return {
    value: id,
    label: locale === "ar" ? nameAr : nameEn,
  };
}

function mapStudentOption(
  record: unknown,
  locale: string,
): SelectOption | null {
  const rec = toRecord(record);
  if (!rec) return null;

  const id = getLocalizedValue(rec, ["studentId", "id", "student_id"]);
  if (!id) return null;

  const nameEn = getLocalizedValue(rec, ["nameEn", "fullNameEn", "full_name_en", "name"]) ?? id;
  const nameAr = getLocalizedValue(rec, ["nameAr", "fullNameAr", "full_name_ar", "name"]) ?? nameEn;
  return {
    value: id,
    label: locale === "ar" ? nameAr : nameEn,
    searchText: `${nameEn} ${nameAr} ${id}`,
  };
}
```

Replace `ReinforcementReviewQueuePage` state and filters integration:

```typescript
export default function ReinforcementReviewQueuePage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  const {
    values,
    setValue,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useReinforcementUrlFilters({
    paramKeys: [
      "academicYearId",
      "termId",
      "studentId",
      "status",
      "search",
      "submittedFrom",
      "submittedTo",
    ],
    defaults: {},
  });

  const [items, setItems] = useState<ReinforcementReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);

  // Dropdown options states
  const [yearsOptions, setYearsOptions] = useState<SelectOption[]>([]);
  const [termsOptions, setTermsOptions] = useState<SelectOption[]>([]);
  const [studentsOptions, setStudentsOptions] = useState<SelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const canView = hasPermission("reinforcement.reviews.view");
  const canManage = hasPermission("reinforcement.reviews.manage");

  // Load filter options
  useEffect(() => {
    if (!canView) return;
    
    let active = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const opts = await getReinforcementFilterOptions({
          academicYearId: values.academicYearId || undefined,
          termId: values.termId || undefined,
        });
        if (!active) return;
        
        if (opts.academicYears) {
          setYearsOptions(
            opts.academicYears
              .map((y) => mapGenericOption(y, locale))
              .filter((y): y is SelectOption => y !== null)
          );
        }
        if (opts.terms) {
          setTermsOptions(
            opts.terms
              .map((t) => mapGenericOption(t, locale))
              .filter((t): t is SelectOption => t !== null)
          );
        }
        if (opts.students) {
          setStudentsOptions(
            opts.students
              .map((s) => mapStudentOption(s, locale))
              .filter((s): s is SelectOption => s !== null)
          );
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    void loadOptions();
    return () => {
      active = false;
    };
  }, [canView, locale, values.academicYearId, values.termId]);

  const params = useMemo(
    () => ({
      academicYearId: values.academicYearId || undefined,
      termId: values.termId || undefined,
      studentId: values.studentId || undefined,
      status: values.status || undefined,
      search: values.search || undefined,
      submittedFrom: values.submittedFrom || undefined,
      submittedTo: values.submittedTo || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [
      values.academicYearId,
      values.termId,
      values.studentId,
      values.status,
      values.search,
      values.submittedFrom,
      values.submittedTo,
      page,
      pageSize,
    ],
  );

  const refreshQueue = useCallback(async () => {
    if (!canView) return;

    // Date validation
    if (values.submittedFrom && values.submittedTo && values.submittedFrom > values.submittedTo) {
      setDateValidationError(t("rewardsModule.overview.errors.invalidDates") || "Start date cannot be after end date");
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setDateValidationError(null);
    setLoading(true);
    setError(null);
    
    try {
      const response = await listReinforcementReviewQueue(params);
      setItems(response.items);
      setTotal(response.total ?? response.items.length);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setItems([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t, values.submittedFrom, values.submittedTo]);

  useEffect(() => {
    void Promise.resolve().then(refreshQueue);
  }, [refreshQueue]);

  const handleClearFilters = () => {
    setValue("studentId", "");
    setValue("status", "");
    setValue("search", "");
    setValue("submittedFrom", "");
    setValue("submittedTo", "");
  };
```

- [ ] **Step 2: Render simplified filters on Review Queue page**

Replace the filters markup inside the return statement of [ReinforcementReviewQueuePage.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx) (lines 361-391) with the unified grid layout:

```typescript
      {/* Filters section */}
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {t("rewardsModule.overview.filtersTitle") || "Filters"}
        </h2>
        
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 items-end">
          <Select
            label={t("rewardsModule.catalog.form.academicYear") || "Academic Year"}
            value={values.academicYearId || ""}
            onChange={(val) => {
              setValue("academicYearId", val);
              setValue("termId", "");
              setValue("studentId", "");
            }}
            options={yearsOptions}
            searchable
            placeholder={t("rewardsModule.overview.selectYear") || "Select Year"}
            disabled={optionsLoading}
          />
          
          <Select
            label={t("rewardsModule.catalog.form.term") || "Term"}
            value={values.termId || ""}
            onChange={(val) => {
              setValue("termId", val);
              setValue("studentId", "");
            }}
            options={termsOptions}
            searchable
            placeholder={t("rewardsModule.overview.selectTerm") || "Select Term"}
            disabled={optionsLoading || !values.academicYearId}
          />

          <Select
            label={t("rewardsModule.redemptions.create.student") || "Student"}
            value={values.studentId || ""}
            onChange={(val) => setValue("studentId", val)}
            options={studentsOptions}
            searchable
            placeholder={t("rewardsModule.overview.allStudents") || "All Students"}
            disabled={optionsLoading}
          />

          <Select
            label={t("reviews.table.status") || "Status"}
            value={values.status || ""}
            onChange={(val) => setValue("status", val)}
            options={[
              { value: "", label: t("filters.allStatuses") || "All" },
              { value: "submitted", label: t("reviews.status.submitted") || "Submitted" },
              { value: "approved", label: t("reviews.status.approved") || "Approved" },
              { value: "rejected", label: t("reviews.status.rejected") || "Rejected" },
            ]}
          />

          <Input
            type="date"
            label={t("rewardsModule.overview.dateFrom") || "Date From"}
            value={values.submittedFrom || ""}
            onChange={(e) => setValue("submittedFrom", e.target.value)}
          />

          <Input
            type="date"
            label={t("rewardsModule.overview.dateTo") || "Date To"}
            value={values.submittedTo || ""}
            onChange={(e) => setValue("submittedTo", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 items-center">
          <Input
            type="text"
            label={t("filters.search") || "Search"}
            placeholder={t("filters.searchPlaceholder") || "Search..."}
            value={values.search || ""}
            onChange={(e) => setValue("search", e.target.value)}
          />
          
          {(values.studentId || values.status || values.search || values.submittedFrom || values.submittedTo) ? (
            <div className="flex justify-end h-10 items-end">
              <Button variant="secondary" onClick={handleClearFilters}>
                {t("rewardsModule.overview.clearFilters") || "Clear Filters"}
              </Button>
            </div>
          ) : null}
        </div>

        {dateValidationError ? (
          <p className="text-xs text-red-600 font-medium">{dateValidationError}</p>
        ) : null}
      </section>
```

- [ ] **Step 3: Verify type check**

Run:
```powershell
npm run typecheck
```
Expected: PASS

- [ ] **Step 4: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/ReinforcementReviewQueuePage.tsx
git commit -m "feat: refactor review queue page to use direct selects and option loading"
```

---

### Task 2: Create Test Suite for Review Queue Filters

**Files:**
- Create: `src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx`

**Interfaces:**
- Consumes: Mocks of `getReinforcementFilterOptions`, `listReinforcementReviewQueue`, and `Select`.
- Produces: Test file validating filter loading and parameters syncing.

- [ ] **Step 1: Write test file**

Create [ReinforcementReviewQueuePage.test.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx):

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import ReinforcementReviewQueuePage from "../ReinforcementReviewQueuePage";

const permissionState = vi.hoisted(() => ({
  permissions: [
    "reinforcement.reviews.view",
    "reinforcement.reviews.manage",
  ] as string[],
}));

const reviewsMocks = vi.hoisted(() => ({
  listReinforcementReviewQueue: vi.fn(),
  approveReinforcementSubmission: vi.fn(),
  rejectReinforcementSubmission: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock(
  "@/features/reinforcement/services/reinforcementReviewsService",
  () => reviewsMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

function renderPage() {
  return render(
    <ToastProvider>
      <ReinforcementReviewQueuePage />
    </ToastProvider>,
  );
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  labelName: string,
  optionText: string,
) {
  const trigger = await screen.findByLabelText(labelName);
  await user.click(trigger);
  const option = await screen.findByRole("button", { name: optionText });
  await user.click(option);
}

describe("ReinforcementReviewQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    reviewsMocks.listReinforcementReviewQueue.mockResolvedValue({
      items: [
        {
          id: "submission-1",
          studentId: "student-123",
          status: "submitted",
          submittedAt: "2026-06-30T00:00:00Z",
          task: { titleEn: "Read Book" },
          stage: { titleEn: "Page 10" },
          student: { nameEn: "John Doe" },
        },
      ],
      total: 1,
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      academicYears: [{ id: "year-1", nameEn: "Year 1", nameAr: "Year 1" }],
      terms: [{ id: "term-1", nameEn: "Term 1", nameAr: "Term 1" }],
      students: [{ studentId: "student-123", nameEn: "Student 123", nameAr: "Student 123" }],
    });
  });

  it("calls listReinforcementReviewQueue and getReinforcementFilterOptions on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenCalled();
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled();
    });

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("refetches queue with parameters when filter changes", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "rewardsModule.catalog.form.academicYear", "Year 1");
    await selectOption(user, "rewardsModule.catalog.form.term", "Term 1");
    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-123",
        }),
      );
    });
  });

  it("clears local filters and keeps academic context when Clear Filters is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await selectOption(user, "rewardsModule.catalog.form.academicYear", "Year 1");
    await selectOption(user, "rewardsModule.catalog.form.term", "Term 1");
    await selectOption(user, "rewardsModule.redemptions.create.student", "Student 123");

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          studentId: "student-123",
        }),
      );
    });

    const clearBtn = await screen.findByText("rewardsModule.overview.clearFilters");
    await user.click(clearBtn);

    await waitFor(() => {
      expect(reviewsMocks.listReinforcementReviewQueue).toHaveBeenLastCalledWith(
        expect.objectContaining({
          academicYearId: "year-1",
          termId: "term-1",
          studentId: undefined,
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Run test suite**

Run tests:
```powershell
npx vitest run src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx
```
Expected: PASS

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/__tests__/ReinforcementReviewQueuePage.test.tsx
git commit -m "test: add unit tests for ReinforcementReviewQueuePage filters"
```
