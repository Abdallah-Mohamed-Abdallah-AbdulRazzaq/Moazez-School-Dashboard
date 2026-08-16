# Dropdown Menu Component

A flexible, reusable dropdown menu component built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ Customizable trigger button or custom trigger element
- ✅ Support for icons in menu items
- ✅ Disabled items and disabled state
- ✅ Left or right alignment
- ✅ Click outside to close
- ✅ Keyboard accessible
- ✅ Selected state highlighting
- ✅ Custom width options
- ✅ Smooth animations (fade-in menu, staggered item animations, hover effects)
- ✅ TypeScript support
- ✅ Individual item onClick handlers

## Installation

The component is already set up in `src/components/ui/dropdown/`.

## Basic Usage

```tsx
import { DropdownMenu } from "@/components/ui/dropdown";

const items = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
];

<DropdownMenu
  items={items}
  placeholder="Select an option"
  onSelect={(value) => console.log(value)}
/>;
```

## Props

| Prop          | Type                      | Default            | Description                                       |
| ------------- | ------------------------- | ------------------ | ------------------------------------------------- |
| `items`       | `DropdownItem[]`          | required           | Array of menu items                               |
| `trigger`     | `ReactNode`               | undefined          | Custom trigger element (overrides default button) |
| `label`       | `string`                  | undefined          | Label text shown before selected value            |
| `placeholder` | `string`                  | "Select an option" | Placeholder text when nothing is selected         |
| `onSelect`    | `(value: string) => void` | undefined          | Callback when an item is selected                 |
| `className`   | `string`                  | ""                 | Additional CSS classes for container              |
| `align`       | `"left" \| "right"`       | "left"             | Alignment of dropdown menu                        |
| `width`       | `string`                  | "w-48"             | Tailwind width class                              |
| `disabled`    | `boolean`                 | false              | Disable the entire dropdown                       |

## DropdownItem Interface

```typescript
interface DropdownItem {
  label: string; // Display text
  value: string; // Unique identifier
  icon?: ReactNode; // Optional icon element
  disabled?: boolean; // Disable this specific item
  onClick?: () => void; // Individual item click handler
}
```

## Examples

### 1. Simple Dropdown

```tsx
<DropdownMenu
  items={[
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Inactive", value: "inactive" },
  ]}
  placeholder="Select status"
  onSelect={(value) => console.log(value)}
/>
```

### 2. Dropdown with Icons

```tsx
import { User, Settings, LogOut } from "lucide-react";

<DropdownMenu
  items={[
    { label: "Profile", value: "profile", icon: <User className="w-4 h-4" /> },
    {
      label: "Settings",
      value: "settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      label: "Sign Out",
      value: "logout",
      icon: <LogOut className="w-4 h-4" />,
    },
  ]}
  placeholder="Menu"
/>;
```

### 3. Dropdown with Label

```tsx
<DropdownMenu
  label="Status"
  items={[
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ]}
  onSelect={(value) => console.log(value)}
/>
```

### 4. Custom Trigger

```tsx
<DropdownMenu
  trigger={
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
      Custom Button
    </button>
  }
  items={items}
/>
```

### 5. Right-aligned Dropdown

```tsx
<DropdownMenu items={items} align="right" placeholder="Options" />
```

### 6. Disabled Items

```tsx
<DropdownMenu
  items={[
    { label: "Available", value: "1" },
    { label: "Unavailable", value: "2", disabled: true },
    { label: "Coming Soon", value: "3", disabled: true },
  ]}
/>
```

### 7. Individual Item Handlers

```tsx
<DropdownMenu
  items={[
    {
      label: "Delete",
      value: "delete",
      onClick: () => handleDelete(),
    },
    {
      label: "Archive",
      value: "archive",
      onClick: () => handleArchive(),
    },
  ]}
/>
```

### 8. Wide Dropdown

```tsx
<DropdownMenu items={items} width="w-96" placeholder="Select" />
```

## Styling

The component uses Tailwind CSS classes. You can customize:

- **Width**: Pass any Tailwind width class via `width` prop (e.g., `w-48`, `w-64`, `w-96`)
- **Container**: Add classes via `className` prop
- **Colors**: Modify the component file to change color scheme

## Animations

The dropdown includes smooth animations:

- **Menu appearance**: Fade-in with scale effect (0.2s)
- **Menu items**: Staggered slide-in animation (each item delayed by 0.03s)
- **Chevron icon**: Smooth 180° rotation when opening/closing
- **Hover effects**: Items slide right slightly on hover with smooth transition
- **Icon transitions**: Icons have subtle transform effects

All animations use CSS keyframes and are optimized for performance.

## Accessibility

- Click outside to close
- Disabled state support
- Focus states with ring
- Keyboard navigation ready

## Notes

- The dropdown automatically closes when clicking outside
- Selected items are highlighted with blue background
- Disabled items show reduced opacity and are not clickable
- The chevron icon rotates when dropdown is open
- Maximum height of 60 (15rem) with scroll for long lists
