# Modal Component

A reusable, accessible modal component with RTL support and customizable features.

## Features

- ✅ RTL Support (Arabic/English)
- ✅ Multiple sizes (sm, md, lg, xl, full)
- ✅ Customizable header and footer
- ✅ Close on overlay click (optional)
- ✅ Close on Escape key (optional)
- ✅ Body scroll lock when open
- ✅ Smooth animations
- ✅ Accessible (keyboard navigation)
- ✅ TypeScript support

## Basic Usage

```tsx
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="My Modal">
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

## Props

| Prop                  | Type                                     | Default  | Description                      |
| --------------------- | ---------------------------------------- | -------- | -------------------------------- |
| `isOpen`              | `boolean`                                | required | Controls modal visibility        |
| `onClose`             | `() => void`                             | required | Callback when modal should close |
| `title`               | `string`                                 | -        | Modal title (optional)           |
| `children`            | `ReactNode`                              | required | Modal content                    |
| `size`                | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"`   | Modal width                      |
| `showCloseButton`     | `boolean`                                | `true`   | Show X button in header          |
| `closeOnOverlayClick` | `boolean`                                | `true`   | Close when clicking outside      |
| `closeOnEscape`       | `boolean`                                | `true`   | Close when pressing Escape       |
| `footer`              | `ReactNode`                              | -        | Footer content (buttons, etc.)   |
| `className`           | `string`                                 | `""`     | Additional CSS classes           |

## Examples

### Confirmation Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="sm"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Form Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Student"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>Save</Button>
    </>
  }
>
  <form>
    <input type="text" placeholder="Name" />
    <input type="email" placeholder="Email" />
  </form>
</Modal>
```

### Large Content Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Details"
  size="xl"
>
  <div className="space-y-4">{/* Long content that will scroll */}</div>
</Modal>
```

### Restricted Closing

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Important"
  closeOnOverlayClick={false}
  closeOnEscape={false}
  footer={<Button onClick={() => setIsOpen(false)}>I Understand</Button>}
>
  <p>You must acknowledge this message.</p>
</Modal>
```

## Sizes

- `sm`: 384px (24rem)
- `md`: 448px (28rem) - Default
- `lg`: 512px (32rem)
- `xl`: 576px (36rem)
- `full`: Full width with 16px margin

## RTL Support

The modal automatically detects the current locale and applies RTL layout for Arabic:

```tsx
// Automatically handles RTL based on locale
const locale = useLocale();
const isRTL = locale === "ar";
```

## Accessibility

- Escape key closes modal (unless disabled)
- Focus trap within modal
- Body scroll lock when open
- Proper ARIA labels
- Keyboard navigation support

## Styling

The modal uses Tailwind CSS classes and can be customized:

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  className="custom-modal-class"
>
  {/* content */}
</Modal>
```

## Animation

The modal includes a smooth fade-in animation:

- Opacity: 0 → 1
- Scale: 0.95 → 1
- TranslateY: -10px → 0
- Duration: 200ms

## Best Practices

1. Always provide an `onClose` handler
2. Use appropriate size for content
3. Include footer buttons for actions
4. Use `closeOnOverlayClick={false}` for critical actions
5. Provide clear titles
6. Keep content concise and scannable
7. Use proper button variants (outline for cancel, primary for confirm)

## Common Patterns

### Delete Confirmation

```tsx
<Modal
  isOpen={deleteModal}
  onClose={() => setDeleteModal(false)}
  title="Confirm Deletion"
  size="sm"
  footer={
    <>
      <Button variant="outline" onClick={() => setDeleteModal(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <div className="flex items-start gap-4">
    <AlertTriangle className="w-6 h-6 text-red-600" />
    <p>This action cannot be undone.</p>
  </div>
</Modal>
```

### Success Message

```tsx
<Modal
  isOpen={successModal}
  onClose={() => setSuccessModal(false)}
  title="Success"
  size="sm"
  footer={<Button onClick={() => setSuccessModal(false)}>Close</Button>}
>
  <div className="flex items-center gap-4">
    <CheckCircle className="w-6 h-6 text-green-600" />
    <p>Operation completed successfully!</p>
  </div>
</Modal>
```
