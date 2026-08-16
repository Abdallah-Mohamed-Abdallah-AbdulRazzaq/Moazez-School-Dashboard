# GaugeChart Component

A beautiful gauge chart component for displaying percentage-based metrics with a semi-circular design.

## Features

- Semi-circular gauge design (240-degree arc)
- Customizable colors for both segments
- Adjustable size and thickness
- Legend with percentage labels
- Smooth SVG rendering
- RTL support
- Works perfectly inside ChartCard

## Usage

```tsx
import { ChartCard, GaugeChart } from "@/components/ui/chart-card";

export default function AttendanceCard() {
  return (
    <ChartCard
      title="الحضور"
      description="نسبة حضور الطلاب اليوم"
      showPeriodFilter={false}
      bgColor="#e0f2f5"
    >
      <GaugeChart
        value={75}
        presentLabel="حاضر"
        absentLabel="غائب"
        presentColor="#036b80"
        absentColor="#14b8a6"
      />
    </ChartCard>
  );
}
```

## Props

| Prop           | Type      | Default     | Description                            |
| -------------- | --------- | ----------- | -------------------------------------- |
| `value`        | `number`  | Required    | The percentage value (0-100)           |
| `presentLabel` | `string`  | `"حاضر"`    | Label for the present/positive segment |
| `absentLabel`  | `string`  | `"غائب"`    | Label for the absent/negative segment  |
| `presentColor` | `string`  | `"#036b80"` | Color for the present segment          |
| `absentColor`  | `string`  | `"#14b8a6"` | Color for the absent segment           |
| `size`         | `number`  | `200`       | Size of the gauge in pixels            |
| `thickness`    | `number`  | `40`        | Thickness of the gauge arc             |
| `showTooltip`  | `boolean` | `true`      | Show tooltip on hover                  |

## Examples

### Attendance Gauge

```tsx
<GaugeChart
  value={75}
  presentLabel="حاضر"
  absentLabel="غائب"
  presentColor="#036b80"
  absentColor="#14b8a6"
/>
```

### Academic Performance

```tsx
<GaugeChart
  value={92}
  presentLabel="ناجح"
  absentLabel="راسب"
  presentColor="#3b82f6"
  absentColor="#ef4444"
/>
```

### Task Completion

```tsx
<GaugeChart
  value={68}
  presentLabel="مكتمل"
  absentLabel="متبقي"
  presentColor="#10b981"
  absentColor="#f59e0b"
  size={250}
  thickness={50}
/>
```

## Design Notes

- The gauge uses a 240-degree arc (from -120° to 120°)
- The value is displayed in the center
- Legend shows both percentages with colored dots
- Smooth rounded caps on the arc ends
- Responsive and scales with the size prop
