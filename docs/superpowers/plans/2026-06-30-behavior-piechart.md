# Behavior Overview Pie Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy `GaugeChart` component in the "Review Status" card of the Behavior Overview page with a Recharts `PieChart` and `Pie` component.

**Architecture:**
- Destructure review metrics from data response: `pendingReview`, `reviewed`, `approvalRate`, `rejectionRate`.
- Calculate precise counts:
  - Approved: `Math.round(review.reviewed * review.approvalRate)`
  - Rejected: `Math.round(review.reviewed * review.rejectionRate)`
  - Pending Review: `review.pendingReview`
- Import Recharts `PieChart`, `Pie`, `Cell`, `Legend` into [BehaviorOverviewPage.tsx](file:///e:/sis-dashboard/src/features/behavior/overview/pages/BehaviorOverviewPage.tsx) and construct a beautiful, localized donut chart.

---

### Task 1: Replace GaugeChart with Recharts PieChart

**Files:**
- Modify: `src/features/behavior/overview/pages/BehaviorOverviewPage.tsx`

- [ ] **Step 1: Update Recharts imports**

Add `PieChart`, `Pie` to Recharts imports at the top of [BehaviorOverviewPage.tsx](file:///e:/sis-dashboard/src/features/behavior/overview/pages/BehaviorOverviewPage.tsx):

```typescript
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
```

- [ ] **Step 2: Calculate chart data**

Add the chart data mapping in the page logic (around line 365, near `approvalPct`):

```typescript
  const approvedCount = Math.round(review.reviewed * review.approvalRate);
  const rejectedCount = Math.round(review.reviewed * review.rejectionRate);
  const pendingCount = review.pendingReview;

  const reviewPieData = [
    { name: t("approved") || "Approved", value: approvedCount, color: "#16a34a" },
    { name: t("rejected") || "Rejected", value: rejectedCount, color: "#ef4444" },
    { name: t("pendingReview") || "Pending", value: pendingCount, color: "#f59e0b" },
  ].filter((item) => item.value > 0); // Only render slices for non-zero counts

  const totalReviewsCount = approvedCount + rejectedCount + pendingCount;
```

- [ ] **Step 3: Replace GaugeChart in JSX**

In the "Review Status" card (around line 560-600), replace the `GaugeChart` and its legend layout with the Recharts `PieChart`:

```typescript
        {/* Review Status */}
        <div
          className="rounded-2xl border shadow-sm p-6 flex flex-col justify-between"
          style={{ borderColor: "var(--border-color)", minHeight: "360px" }}
        >
          <div>
            <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("reviewStatus")}</div>
            <div className="h-48 relative">
              {totalReviewsCount === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reviewPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {reviewPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface-color)",
                          borderColor: "var(--border-color)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-2xl font-bold text-gray-800">
                      {totalReviewsCount}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {t("totalRecords") || "Total"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Clean Legend */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="text-xs text-gray-500">{t("approved")}</span>
              </div>
              <span className="text-sm font-bold text-gray-800 mt-1">{approvedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500">{t("rejected")}</span>
              </div>
              <span className="text-sm font-bold text-gray-800 mt-1">{rejectedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-500">{t("pendingReview")}</span>
              </div>
              <span className="text-sm font-bold text-gray-800 mt-1">{pendingCount}</span>
            </div>
          </div>
        </div>
```

- [ ] **Step 4: Clean up unused imports**

If `GaugeChart` and `Clock3` / `CheckCircle2` are no longer used anywhere else in the file, remove them from the imports list to maintain a clean imports structure.

- [ ] **Step 5: Verify type check**

Run:
```powershell
npm run typecheck
```
Expected: PASS

- [ ] **Step 6: Run tests**

Verify that all behavior page tests continue to pass.
```powershell
npx vitest run src/features/behavior/overview
```

- [ ] **Step 7: Commit changes**

Run:
```bash
git add src/features/behavior/overview/pages/BehaviorOverviewPage.tsx
git commit -m "feat(behavior): replace GaugeChart with Recharts PieChart on overview page"
```
