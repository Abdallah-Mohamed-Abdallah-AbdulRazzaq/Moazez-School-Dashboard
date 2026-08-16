# Chart Card Component

مكون مرن لعرض الرسوم البيانية مع عنوان وعنوان فرعي وأيقونة مساعدة (tooltip) وفلتر للفترة الزمنية.

A flexible chart card component with title, subtitle, help tooltip, and customizable period filter.

## Features

- ✅ Title with optional subtitle
- ✅ Help icon with tooltip for detailed description
- ✅ Customizable period filter dropdown
- ✅ Smooth animations for tooltip
- ✅ Customizable styling
- ✅ TypeScript support
- ✅ Works with any chart library (Recharts, Chart.js, etc.)
- ✅ Optional period filter
- ✅ Callback for period changes
- ✅ Support for custom filter options with translations

## Installation

The component is already set up in `src/components/ui/chart-card/`.

## Basic Usage

```tsx
import { ChartCard } from "@/components/ui/chart-card";

<ChartCard
  title="Revenue Overview"
  subtitle="Total revenue from all sources"
  description="This chart shows the total revenue over time"
  onPeriodChange={(period) => console.log(period)}
>
  {/* Your chart component here */}
  <YourChartComponent />
</ChartCard>;
```

## Props

| Prop               | Type                       | Default         | Description                                         |
| ------------------ | -------------------------- | --------------- | --------------------------------------------------- |
| `title`            | `string`                   | required        | Chart title                                         |
| `subtitle`         | `string`                   | undefined       | Subtitle text below the title                       |
| `description`      | `string`                   | undefined       | Tooltip description (shown on hover over help icon) |
| `children`         | `ReactNode`                | required        | Chart content                                       |
| `className`        | `string`                   | ""              | Additional CSS classes                              |
| `showPeriodFilter` | `boolean`                  | true            | Show/hide period filter dropdown                    |
| `periodOptions`    | `DropdownItem[]`           | default options | Custom period filter options array                  |
| `onPeriodChange`   | `(period: string) => void` | undefined       | Callback when period changes                        |
| `defaultPeriod`    | `string`                   | "30d"           | Default selected period                             |

## Default Period Options

The component includes these default period options:

- `7d` - Last 7 Days
- `30d` - Last 30 Days (default)
- `3m` - Last 3 Months
- `6m` - Last 6 Months
- `1y` - Last Year
- `all` - All Time

## Custom Period Options

You can provide your own custom period options with translations:

```tsx
import { DropdownItem } from "@/components/ui/dropdown";

const customPeriodOptions: DropdownItem[] = [
  { label: t("period.today"), value: "today" },
  { label: t("period.week"), value: "week" },
  { label: t("period.month"), value: "month" },
  { label: t("period.year"), value: "year" },
];

<ChartCard
  title="Custom Periods"
  periodOptions={customPeriodOptions}
  onPeriodChange={(period) => console.log(period)}
  defaultPeriod="week"
>
  <YourChart />
</ChartCard>;
```

## Examples

### 1. Full Featured Chart Card

```tsx
<ChartCard
  title="Sales Overview"
  subtitle="Last 30 days performance"
  description="Total sales across all channels including online and in-store purchases"
  onPeriodChange={(period) => console.log(period)}
>
  <AreaChart data={data}>{/* Chart configuration */}</AreaChart>
</ChartCard>
```

### 2. With Custom Period Options

```tsx
const customOptions: DropdownItem[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

<ChartCard
  title="User Activity"
  subtitle="Real-time tracking"
  description="Monitor user activity in real-time"
  periodOptions={customOptions}
  onPeriodChange={(period) => fetchData(period)}
  defaultPeriod="today"
>
  <LineChart data={userData} />
</ChartCard>;
```

### 3. With Translated Period Options

```tsx
const t = useTranslations("attendance_trend");

const periodOptions: DropdownItem[] = useMemo(
  () => [
    { label: t("period.days_30"), value: "days_30" },
    { label: t("period.week"), value: "week" },
    { label: t("period.term"), value: "term" },
  ],
  [t],
);

<ChartCard
  title={t("title")}
  subtitle={t("subtitle")}
  description={t("description")}
  periodOptions={periodOptions}
  onPeriodChange={handlePeriodChange}
  defaultPeriod="days_30"
>
  <YourChart />
</ChartCard>;
```

### 4. Without Period Filter

```tsx
<ChartCard
  title="Static Distribution"
  subtitle="Current resource allocation"
  description="Current distribution of resources across departments"
  showPeriodFilter={false}
>
  <PieChart data={distributionData} />
</ChartCard>
```

### 5. Without Description (No Tooltip)

```tsx
<ChartCard
  title="Simple Chart"
  subtitle="Basic metrics"
  onPeriodChange={(period) => console.log(period)}
>
  <BarChart data={data} />
</ChartCard>
```

### 6. Title Only (No Subtitle)

```tsx
<ChartCard
  title="Revenue Chart"
  description="Detailed revenue breakdown"
  onPeriodChange={(period) => console.log(period)}
>
  <YourChart />
</ChartCard>
```

### 7. Custom Styling

```tsx
<ChartCard
  title="Custom Styled"
  subtitle="With custom border"
  description="Chart with custom border and shadow"
  className="border-2 border-blue-200 shadow-xl"
>
  <YourChart />
</ChartCard>
```

### 8. With Recharts Example

```tsx
import { ChartCard } from "@/components/ui/chart-card";
import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", value: 400 },
  { month: "Feb", value: 300 },
  { month: "Mar", value: 600 },
];

<ChartCard
  title="Monthly Revenue"
  subtitle="Revenue trend analysis"
  description="Revenue generated each month from all sources"
  onPeriodChange={(period) => fetchRevenueData(period)}
>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <XAxis dataKey="month" />
        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</ChartCard>;
```

## Component Structure

```
┌─────────────────────────────────────────────────┐
│ Title (?)                    [Period Filter ▼] │
│ Subtitle                                        │
├─────────────────────────────────────────────────┤
│                                                 │
│              Chart Content Area                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Tooltip Behavior

- Appears on hover over the help icon (?)
- Can also be toggled by clicking the icon
- Automatically positioned below the icon
- Includes a small arrow pointing to the icon
- Smooth fade-in animation
- Dark background with white text for better readability

## Styling

The component uses:

- Rounded corners (rounded-2xl)
- White background
- Gray border
- Soft shadow
- Responsive padding
- Title: text-lg, font-semibold
- Subtitle: text-sm, text-gray-500

You can override styles using the `className` prop.

## Accessibility

- Help icon is keyboard accessible
- Tooltip can be triggered by click or hover
- Focus states included
- Semantic HTML structure
- Proper heading hierarchy

## Notes

- The component is fully responsive
- Works with any chart library
- Period filter uses the DropdownMenu component
- Tooltip automatically hides when mouse leaves
- All animations are smooth and performant
- Subtitle is optional and appears below the title
- Period options can be fully customized with your own data
- Supports translations through custom period options

## Arabic Support

المكون يدعم اللغة العربية بالكامل ويمكن استخدامه مع المحتوى العربي.

```tsx
const periodOptions: DropdownItem[] = [
  { label: "آخر 7 أيام", value: "7d" },
  { label: "آخر 30 يومًا", value: "30d" },
  { label: "آخر 3 أشهر", value: "3m" },
];

<ChartCard
  title="نظرة عامة على الإيرادات"
  subtitle="آخر 30 يوم"
  description="هذا الرسم البياني يوضح إجمالي الإيرادات من جميع المصادر"
  periodOptions={periodOptions}
  onPeriodChange={(period) => console.log(period)}
>
  <YourChart />
</ChartCard>;
```
