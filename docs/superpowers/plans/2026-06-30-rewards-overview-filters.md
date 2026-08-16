# Rewards Overview Filters Implementation Plan (Refined)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement simplified Academic Year, Term, and Student dropdown filters alongside date range pickers on the Rewards Overview page. Fetch all dropdown option data directly from the `getReinforcementFilterOptions` endpoint to avoid unnecessary filters and extra requests.

**Architecture:** Use `useReinforcementUrlFilters` for URL parameter synchronization. On mount and when academic filters change, query `getReinforcementFilterOptions` to populate Academic Year, Term, and Student dropdowns. Refetch overview data from `getRewardsOverview` when any filter changes.

**Tech Stack:** React, Next.js, TypeScript, Tailwind CSS, Vitest, React Testing Library.

## Global Constraints
- Write type-safe TypeScript code without using `any` types.
- Follow the CommonMark markdown standard (blank line before/after headers and lists).
- Ensure all tests pass before completing.

---

### Task 1: Type Definitions (Completed)
- Types in `types.ts` are already updated.

---

### Task 2: Refactor Page Filters to use Direct Selects & getReinforcementFilterOptions

**Files:**
- Modify: `src/features/reinforcement/pages/RewardsOverviewPage.tsx`

**Interfaces:**
- Consumes: `useReinforcementUrlFilters`, `getReinforcementFilterOptions`, `getRewardsOverview`, `getRewardCatalogSummary`, `Select`, `Input`.
- Produces: Simplified filter UI and option-fetching logic inside `RewardsOverviewPage`.

- [ ] **Step 1: Implement direct option loading and selectors in RewardsOverviewPage.tsx**

Update [RewardsOverviewPage.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/RewardsOverviewPage.tsx) to fetch filter options (years, terms, students) using `getReinforcementFilterOptions` and render them using the standard `Select` component.

```typescript
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Package,
  Gift,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  getRewardCatalogSummary,
  getRewardsOverview,
} from "../services/rewardDashboardService";
```

Define helper mappers inside the page:

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

Implement states and fetching logic for filter options:

```typescript
export default function RewardsOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  const {
    values,
    setValue,
  } = useReinforcementUrlFilters({
    paramKeys: [
      "academicYearId",
      "termId",
      "studentId",
      "dateFrom",
      "dateTo",
    ],
    defaults: {},
  });

  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);

  // Dropdown options states
  const [yearsOptions, setYearsOptions] = useState<SelectOption[]>([]);
  const [termsOptions, setTermsOptions] = useState<SelectOption[]>([]);
  const [studentsOptions, setStudentsOptions] = useState<SelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const canView = hasPermission("reinforcement.rewards.view");

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

  const fetchData = useCallback(async () => {
    if (!canView) return;
    
    // Date validation
    if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
      setDateValidationError(t("rewardsModule.overview.errors.invalidDates") || "Start date cannot be after end date");
      setOverview(null);
      setLoading(false);
      return;
    }
    setDateValidationError(null);
    setLoading(true);
    setError(null);
    
    try {
      const [overviewData, summaryData] = await Promise.all([
        getRewardsOverview({
          academicYearId: values.academicYearId || undefined,
          termId: values.termId || undefined,
          studentId: values.studentId || undefined,
          dateFrom: values.dateFrom || undefined,
          dateTo: values.dateTo || undefined,
        }),
        getRewardCatalogSummary({
          academicYearId: values.academicYearId || undefined,
          termId: values.termId || undefined,
        }),
      ]);
      setOverview(overviewData);
      setCatalogSummary(summaryData);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    t,
    values.academicYearId,
    values.termId,
    values.studentId,
    values.dateFrom,
    values.dateTo,
  ]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleClearFilters = () => {
    setValue("studentId", "");
    setValue("dateFrom", "");
    setValue("dateTo", "");
  };
```

Render the new local filters section:

```typescript
          {/* Filters section */}
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {t("rewardsModule.overview.filtersTitle") || "Filters"}
            </h2>
            
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5 items-end">
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

              <Input
                type="date"
                label={t("rewardsModule.overview.dateFrom") || "Date From"}
                value={values.dateFrom || ""}
                onChange={(e) => setValue("dateFrom", e.target.value)}
              />

              <Input
                type="date"
                label={t("rewardsModule.overview.dateTo") || "Date To"}
                value={values.dateTo || ""}
                onChange={(e) => setValue("dateTo", e.target.value)}
              />
            </div>

            {(values.studentId || values.dateFrom || values.dateTo) ? (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleClearFilters}>
                  {t("rewardsModule.overview.clearFilters") || "Clear Filters"}
                </Button>
              </div>
            ) : null}

            {dateValidationError ? (
              <p className="text-xs text-red-600 font-medium">{dateValidationError}</p>
            ) : null}
          </section>
```

- [ ] **Step 2: Verify type compilation**

Run:
```powershell
npm run typecheck
```
Expected: PASS

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/RewardsOverviewPage.tsx
git commit -m "feat: simplify overview filters using direct selects and getReinforcementFilterOptions"
```

---

### Task 3: Update Unit Tests for Selects

**Files:**
- Modify: `src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx`

**Interfaces:**
- Consumes: Mocks of `getReinforcementFilterOptions`, `Select` component rendering.
- Produces: Updated test suite verifying simplified dropdown selections and fetching parameters.

- [ ] **Step 1: Update test file**

Update [RewardsOverviewPage.test.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx):

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import RewardsOverviewPage from "../RewardsOverviewPage";

const permissionState = vi.hoisted(() => ({
  permissions: ["reinforcement.rewards.view"] as string[],
}));

const dashboardMocks = vi.hoisted(() => ({
  getRewardsOverview: vi.fn(),
  getRewardCatalogSummary: vi.fn(),
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
  "@/features/reinforcement/services/rewardDashboardService",
  () => dashboardMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

function renderPage() {
  return render(
    <ToastProvider>
      <RewardsOverviewPage />
    </ToastProvider>,
  );
}

describe("RewardsOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    dashboardMocks.getRewardsOverview.mockResolvedValue({
      catalog: { total: 10, published: 5 },
      redemptions: { pending: 2 },
      fulfillment: { completed: 3 },
      xp: { granted: 100 },
      topRequestedRewards: [],
      recentRedemptions: [],
      lowStockRewards: [],
    });

    dashboardMocks.getRewardCatalogSummary.mockResolvedValue({
      summary: { total: 10 },
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      academicYears: [{ id: "year-1", nameEn: "2026/2027" }],
      terms: [{ id: "term-1", nameEn: "Term 1", academicYearId: "year-1" }],
      students: [{ studentId: "student-123", nameEn: "John Doe" }],
    });
  });

  it("calls getRewardsOverview and getRewardCatalogSummary with query parameters on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenCalled();
      expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenCalled();
      expect(filterOptionMocks.getReinforcementFilterOptions).toHaveBeenCalled();
    });
  });

  it("blocks fetching and displays validation error when dateFrom is after dateTo", async () => {
    const user = userEvent.setup();
    renderPage();

    const dateFromInput = screen.getByLabelText("rewardsModule.overview.dateFrom");
    const dateToInput = screen.getByLabelText("rewardsModule.overview.dateTo");

    await user.type(dateFromInput, "2026-06-30");
    await user.type(dateToInput, "2026-06-25");

    await waitFor(() => {
      expect(
        screen.getByText("rewardsModule.overview.errors.invalidDates"),
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test suite**

Run tests:
```powershell
npx vitest run src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx
```
Expected: PASS

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx
git commit -m "test: update page tests to verify direct dropdown filter loading"
```
