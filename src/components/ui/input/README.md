# Input Components

Reusable input components with RTL support, validation, and customizable features.

## Components

- **Input** - Text input field
- **TextArea** - Multi-line text input
- **Select** - Dropdown selection
- **DatePicker** - Date selection with calendar

## Features

- ✅ RTL Support (Arabic/English)
- ✅ Multiple sizes (sm, md, lg)
- ✅ Multiple variants (default, filled, outlined)
- ✅ Error handling with validation
- ✅ Helper text support
- ✅ Icon support (left/right)
- ✅ Disabled state
- ✅ Required field indicator
- ✅ TypeScript support
- ✅ Accessible (ARIA labels)

## Input Component

### Basic Usage

```tsx
import { Input } from "@/components/ui/input";

<Input label="Email" type="email" placeholder="example@email.com" required />;
```

### With Icons

```tsx
import { Mail } from "lucide-react";

<Input
  label="Email"
  type="email"
  placeholder="example@email.com"
  leftIcon={<Mail className="w-4 h-4" />}
/>;
```

### With Validation

```tsx
const [email, setEmail] = useState("");
const [error, setError] = useState("");

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  helperText="Enter a valid email address"
/>;
```

### Props

| Prop         | Type                                  | Default     | Description             |
| ------------ | ------------------------------------- | ----------- | ----------------------- |
| `label`      | `string`                              | -           | Input label             |
| `error`      | `string`                              | -           | Error message           |
| `helperText` | `string`                              | -           | Helper text below input |
| `leftIcon`   | `ReactNode`                           | -           | Icon on the left        |
| `rightIcon`  | `ReactNode`                           | -           | Icon on the right       |
| `fullWidth`  | `boolean`                             | `true`      | Full width input        |
| `variant`    | `"default" \| "filled" \| "outlined"` | `"default"` | Input style             |
| `inputSize`  | `"sm" \| "md" \| "lg"`                | `"md"`      | Input size              |
| `required`   | `boolean`                             | `false`     | Required field          |
| `disabled`   | `boolean`                             | `false`     | Disabled state          |

Plus all standard HTML input attributes.

## TextArea Component

### Basic Usage

```tsx
import { TextArea } from "@/components/ui/input";

<TextArea label="Bio" placeholder="Tell us about yourself..." rows={4} />;
```

### With Character Count

```tsx
const [bio, setBio] = useState("");

<TextArea
  label="Bio"
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  helperText={`${bio.length}/500 characters`}
  rows={4}
/>;
```

### Props

| Prop         | Type                                             | Default      | Description     |
| ------------ | ------------------------------------------------ | ------------ | --------------- |
| `label`      | `string`                                         | -            | TextArea label  |
| `error`      | `string`                                         | -            | Error message   |
| `helperText` | `string`                                         | -            | Helper text     |
| `fullWidth`  | `boolean`                                        | `true`       | Full width      |
| `variant`    | `"default" \| "filled" \| "outlined"`            | `"default"`  | Style           |
| `resize`     | `"none" \| "vertical" \| "horizontal" \| "both"` | `"vertical"` | Resize behavior |
| `rows`       | `number`                                         | `3`          | Number of rows  |

Plus all standard HTML textarea attributes.

## Select Component

A customizable dropdown select component with RTL support, validation, and multiple variants. Built using a custom dropdown menu implementation for better control and styling.

### Basic Usage

```tsx
import { Select } from "@/components/ui/input";

const [country, setCountry] = useState("");

<Select
  label="Country"
  placeholder="Select a country"
  options={[
    { value: "sa", label: "Saudi Arabia" },
    { value: "ae", label: "UAE" },
  ]}
  value={country}
  onChange={(value) => setCountry(value)}
/>;
```

### With Validation

```tsx
const [country, setCountry] = useState("");
const [error, setError] = useState("");

<Select
  label="Country"
  placeholder="Select a country"
  options={countryOptions}
  value={country}
  onChange={(value) => {
    setCountry(value);
    setError(value ? "" : "Country is required");
  }}
  error={error}
  required
/>;
```

### Props

| Prop          | Type                                  | Default              | Description                 |
| ------------- | ------------------------------------- | -------------------- | --------------------------- |
| `label`       | `string`                              | -                    | Select label                |
| `error`       | `string`                              | -                    | Error message               |
| `helperText`  | `string`                              | -                    | Helper text                 |
| `options`     | `SelectOption[]`                      | `[]`                 | Options array               |
| `placeholder` | `string`                              | `"Select an option"` | Placeholder text            |
| `fullWidth`   | `boolean`                             | `true`               | Full width                  |
| `variant`     | `"default" \| "filled" \| "outlined"` | `"default"`          | Style                       |
| `selectSize`  | `"sm" \| "md" \| "lg"`                | `"md"`               | Size                        |
| `value`       | `string`                              | -                    | Controlled value            |
| `onChange`    | `(value: string) => void`             | -                    | Callback when value changes |
| `name`        | `string`                              | -                    | Name for form submission    |
| `disabled`    | `boolean`                             | `false`              | Disabled state              |
| `required`    | `boolean`                             | `false`              | Required field              |
| `className`   | `string`                              | `""`                 | Additional CSS classes      |

### SelectOption Interface

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## DatePicker Component

A customizable date picker component with RTL support, validation, and MUI DatePicker integration.

### Basic Usage

```tsx
import { DatePicker } from "@/components/ui/input";

const [date, setDate] = useState<Date | null>(null);

<DatePicker
  label="Birth Date"
  placeholder="Select date"
  value={date}
  onChange={(date) => setDate(date)}
/>;
```

### With Validation

```tsx
const [date, setDate] = useState<Date | null>(null);
const [error, setError] = useState("");

<DatePicker
  label="Birth Date"
  placeholder="Select date"
  value={date}
  onChange={(date) => {
    setDate(date);
    setError(date ? "" : "Date is required");
  }}
  error={error}
  required
/>;
```

### Advanced Features

```tsx
// Disable past dates
<DatePicker
  label="Future Date"
  disablePast
/>

// Disable future dates
<DatePicker
  label="Past Date"
  disableFuture
/>

// Set min/max dates
<DatePicker
  label="Date Range"
  minDate={new Date('2024-01-01')}
  maxDate={new Date('2024-12-31')}
/>

// Custom format
<DatePicker
  label="Custom Format"
  format="DD-MM-YYYY"
/>
```

### Props

| Prop            | Type                                  | Default                                    | Description                |
| --------------- | ------------------------------------- | ------------------------------------------ | -------------------------- |
| `label`         | `string`                              | -                                          | DatePicker label           |
| `error`         | `string`                              | -                                          | Error message              |
| `helperText`    | `string`                              | -                                          | Helper text                |
| `placeholder`   | `string`                              | -                                          | Placeholder text           |
| `fullWidth`     | `boolean`                             | `true`                                     | Full width                 |
| `variant`       | `"default" \| "filled" \| "outlined"` | `"default"`                                | Style                      |
| `inputSize`     | `"sm" \| "md" \| "lg"`                | `"md"`                                     | Size                       |
| `value`         | `Date \| null`                        | -                                          | Controlled value           |
| `onChange`      | `(date: Date \| null) => void`        | -                                          | Callback when date changes |
| `name`          | `string`                              | -                                          | Name for form submission   |
| `disabled`      | `boolean`                             | `false`                                    | Disabled state             |
| `required`      | `boolean`                             | `false`                                    | Required field             |
| `minDate`       | `Date`                                | -                                          | Minimum selectable date    |
| `maxDate`       | `Date`                                | -                                          | Maximum selectable date    |
| `disablePast`   | `boolean`                             | `false`                                    | Disable past dates         |
| `disableFuture` | `boolean`                             | `false`                                    | Disable future dates       |
| `format`        | `string`                              | `"MM/DD/YYYY"` (en) or `"DD/MM/YYYY"` (ar) | Date format                |
| `className`     | `string`                              | `""`                                       | Additional CSS classes     |

## Sizes

All components support three sizes:

- `sm`: Small (compact)
- `md`: Medium (default)
- `lg`: Large

```tsx
<Input inputSize="sm" />
<Input inputSize="md" />
<Input inputSize="lg" />
```

## Variants

All components support three variants:

- `default`: White background with border
- `filled`: Gray background
- `outlined`: Transparent with thick border

```tsx
<Input variant="default" />
<Input variant="filled" />
<Input variant="outlined" />
```

## RTL Support

Components automatically detect locale and apply RTL layout:

```tsx
// Automatically handles RTL based on locale
const locale = useLocale();
const isRTL = locale === "ar";
```

## Form Example

```tsx
import { Input, TextArea, Select } from "@/components/ui/input";
import { Mail, User, Phone } from "lucide-react";

function MyForm() {
  return (
    <form className="space-y-4">
      <Input
        label="Full Name"
        placeholder="Enter name"
        leftIcon={<User className="w-4 h-4" />}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="example@email.com"
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />

      <Input
        label="Phone"
        type="tel"
        placeholder="+966 XX XXX XXXX"
        leftIcon={<Phone className="w-4 h-4" />}
        required
      />

      <Select
        label="Grade"
        placeholder="Select grade"
        options={[
          { value: "1", label: "Grade 1" },
          { value: "2", label: "Grade 2" },
        ]}
        required
      />

      <TextArea
        label="Notes"
        placeholder="Additional information..."
        rows={4}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Validation Example

```tsx
const [formData, setFormData] = useState({
  email: "",
  password: "",
});

const [errors, setErrors] = useState({
  email: "",
  password: "",
});

const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email format";
  }
  return "";
};

const validatePassword = (password: string) => {
  if (!password) return "Password is required";
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return "";
};

<Input
  label="Email"
  type="email"
  value={formData.email}
  onChange={(e) => {
    setFormData({ ...formData, email: e.target.value });
    setErrors({ ...errors, email: validateEmail(e.target.value) });
  }}
  error={errors.email}
  required
/>;
```

## Accessibility

- Proper label associations
- Error announcements
- Keyboard navigation
- Focus management
- ARIA attributes

## Best Practices

1. Always provide labels for accessibility
2. Use appropriate input types (email, tel, password, etc.)
3. Provide helpful error messages
4. Use helper text for additional guidance
5. Mark required fields clearly
6. Validate on blur or submit, not on every keystroke
7. Use icons to enhance usability
8. Keep placeholder text concise
