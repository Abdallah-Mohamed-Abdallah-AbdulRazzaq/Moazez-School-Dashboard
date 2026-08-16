# Behavior Overview Pie Chart Design Spec

Replace the circular `GaugeChart` component displaying approval rate in the Behavior Overview dashboard with a comprehensive Recharts `PieChart` and `Pie` component to show the exact breakdown of all review statuses.

## Goal

Transition the "Review Status" KPI card in the Behavior Overview page from a gauge visual to a donut chart layout. This allows displaying the approved, rejected, and pending review counts collectively in a single visual indicator, with a centralized total reviews count.

## User Interface

1. **Donut Chart Layout**:
   A circular donut chart using Recharts `PieChart` with `innerRadius={50}` and `outerRadius={70}`.
   - Slices:
     - **Approved**: colored green (`#16a34a`).
     - **Rejected**: colored red (`#ef4444`).
     - **Pending Review**: colored amber/orange (`#f59e0b`).
   - Slices with 0 records are filtered out dynamically to prevent visual artifacts.
   - A central text inside the donut showing:
     - Total review records count.
     - "Total" label underneath.

2. **Legend Layout**:
   A horizontal 3-column grid displayed below the chart containing:
   - Green indicator: Approved count.
   - Red indicator: Rejected count.
   - Amber indicator: Pending Review count.

## Data Calculation

Metrics are mapped from `data.review` and `data.records` fields:
- `approvedCount = Math.round(review.reviewed * review.approvalRate)`
- `rejectedCount = Math.round(review.reviewed * review.rejectionRate)`
- `pendingCount = review.pendingReview`
- `totalReviewsCount = approvedCount + rejectedCount + pendingCount`

## Verification Plan

### Automated Tests
- Verify that `BehaviorOverviewPage` renders the Recharts `PieChart` and `Pie` elements correctly.
- Verify that legend counts display `approved`, `rejected`, and `pendingReview` values as computed.
