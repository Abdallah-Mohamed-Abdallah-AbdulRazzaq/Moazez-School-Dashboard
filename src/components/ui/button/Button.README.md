# Button Component

A flexible and reusable button component that matches the application's design system.

## Features

- 6 variants: primary, secondary, outline, ghost, danger, success
- 3 sizes: sm, md, lg
- Loading state with spinner
- Icon support (left and right)
- Full width option
- Uses CSS variables for consistent theming
- Fully typed with TypeScript
- Accessible with proper focus states

## Import

```tsx
import Button from "@/components/ui/common/Button";
```

## Basic Usage

```tsx
<Button>Click me</Button>
```

## Variants

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
```

## Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

## With Icons

```tsx
<Button
  leftIcon={
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  }
>
  Add New
</Button>

<Button
  rightIcon={
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  }
>
  Next
</Button>
```

## Loading State

```tsx
<Button loading>Loading...</Button>
<Button loading variant="secondary">Processing</Button>
```

## Disabled State

```tsx
<Button disabled>Disabled</Button>
```

## Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

## Common Patterns

### Form Actions

```tsx
<div className="flex items-center justify-end gap-3">
  <Button variant="secondary" onClick={onCancel}>
    Cancel
  </Button>
  <Button type="submit">Save Changes</Button>
</div>
```

### Modal Actions

```tsx
<div className="flex items-center justify-end gap-3 pt-4">
  <Button variant="secondary" onClick={onClose}>
    {t("cancel")}
  </Button>
  <Button onClick={onSubmit}>{t("submit")}</Button>
</div>
```

### Action Buttons

```tsx
<div className="flex gap-2">
  <Button size="sm" variant="outline" onClick={onEdit}>
    Edit
  </Button>
  <Button size="sm" variant="ghost" onClick={onView}>
    View
  </Button>
  <Button size="sm" variant="danger" onClick={onDelete}>
    Delete
  </Button>
</div>
```

### With Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button
  loading={isLoading}
  onClick={async () => {
    setIsLoading(true);
    await saveData();
    setIsLoading(false);
  }}
>
  Save
</Button>;
```

## Props

| Prop        | Type                                                                        | Default     | Description                  |
| ----------- | --------------------------------------------------------------------------- | ----------- | ---------------------------- |
| `variant`   | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger" \| "success"` | `"primary"` | Button style variant         |
| `size`      | `"sm" \| "md" \| "lg"`                                                      | `"md"`      | Button size                  |
| `fullWidth` | `boolean`                                                                   | `false`     | Makes button full width      |
| `loading`   | `boolean`                                                                   | `false`     | Shows loading spinner        |
| `leftIcon`  | `React.ReactNode`                                                           | -           | Icon to display on the left  |
| `rightIcon` | `React.ReactNode`                                                           | -           | Icon to display on the right |
| `disabled`  | `boolean`                                                                   | `false`     | Disables the button          |
| `children`  | `React.ReactNode`                                                           | -           | Button content (required)    |
| `className` | `string`                                                                    | -           | Additional CSS classes       |
| `onClick`   | `() => void`                                                                | -           | Click handler                |
| `type`      | `"button" \| "submit" \| "reset"`                                           | `"button"`  | Button type                  |

All standard HTML button attributes are also supported.

## Styling

The button uses CSS variables from `globals.css`:

- `--primary-color`: Primary button background
- `--hover-color`: Primary button hover state
- `--border-color`: Border color for secondary buttons

## Accessibility

- Proper focus states with ring
- Disabled state with reduced opacity
- Loading state disables interaction
- Semantic HTML button element
