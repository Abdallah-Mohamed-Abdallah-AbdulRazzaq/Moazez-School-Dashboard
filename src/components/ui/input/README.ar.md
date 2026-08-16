# مكونات الإدخال (Input Components)

مكونات إدخال قابلة لإعادة الاستخدام مع دعم RTL والتحقق من البيانات وميزات قابلة للتخصيص.

## المكونات

- **Input** - حقل إدخال نصي
- **TextArea** - حقل إدخال متعدد الأسطر
- **Select** - قائمة منسدلة
- **DatePicker** - اختيار التاريخ مع التقويم للاختيار

## المميزات

- ✅ دعم RTL كامل (العربية/الإنجليزية)
- ✅ أحجام متعددة (sm, md, lg)
- ✅ أنماط متعددة (default, filled, outlined)
- ✅ معالجة الأخطاء مع التحقق
- ✅ دعم النص المساعد
- ✅ دعم الأيقونات (يسار/يمين)
- ✅ حالة التعطيل
- ✅ مؤشر الحقل المطلوب
- ✅ دعم TypeScript
- ✅ سهولة الوصول (ARIA labels)

## مكون Input

### الاستخدام الأساسي

```tsx
import { Input } from "@/components/ui/input";

<Input
  label="البريد الإلكتروني"
  type="email"
  placeholder="example@email.com"
  required
/>;
```

### مع الأيقونات

```tsx
import { Mail } from "lucide-react";

<Input
  label="البريد الإلكتروني"
  type="email"
  placeholder="example@email.com"
  leftIcon={<Mail className="w-4 h-4" />}
/>;
```

### مع التحقق

```tsx
const [email, setEmail] = useState("");
const [error, setError] = useState("");

<Input
  label="البريد الإلكتروني"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  helperText="أدخل بريد إلكتروني صحيح"
/>;
```

### الخصائص

| الخاصية      | النوع                                 | القيمة الافتراضية | الوصف               |
| ------------ | ------------------------------------- | ----------------- | ------------------- |
| `label`      | `string`                              | -                 | تسمية الحقل         |
| `error`      | `string`                              | -                 | رسالة الخطأ         |
| `helperText` | `string`                              | -                 | نص مساعد أسفل الحقل |
| `leftIcon`   | `ReactNode`                           | -                 | أيقونة على اليسار   |
| `rightIcon`  | `ReactNode`                           | -                 | أيقونة على اليمين   |
| `fullWidth`  | `boolean`                             | `true`            | عرض كامل            |
| `variant`    | `"default" \| "filled" \| "outlined"` | `"default"`       | نمط الحقل           |
| `inputSize`  | `"sm" \| "md" \| "lg"`                | `"md"`            | حجم الحقل           |
| `required`   | `boolean`                             | `false`           | حقل مطلوب           |
| `disabled`   | `boolean`                             | `false`           | حالة التعطيل        |

بالإضافة إلى جميع خصائص HTML input القياسية.

## مكون TextArea

### الاستخدام الأساسي

```tsx
import { TextArea } from "@/components/ui/input";

<TextArea label="السيرة الذاتية" placeholder="أخبرنا عن نفسك..." rows={4} />;
```

### مع عداد الأحرف

```tsx
const [bio, setBio] = useState("");

<TextArea
  label="السيرة الذاتية"
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  helperText={`${bio.length}/500 حرف`}
  rows={4}
/>;
```

### الخصائص

| الخاصية      | النوع                                            | القيمة الافتراضية | الوصف            |
| ------------ | ------------------------------------------------ | ----------------- | ---------------- |
| `label`      | `string`                                         | -                 | تسمية الحقل      |
| `error`      | `string`                                         | -                 | رسالة الخطأ      |
| `helperText` | `string`                                         | -                 | نص مساعد         |
| `fullWidth`  | `boolean`                                        | `true`            | عرض كامل         |
| `variant`    | `"default" \| "filled" \| "outlined"`            | `"default"`       | النمط            |
| `resize`     | `"none" \| "vertical" \| "horizontal" \| "both"` | `"vertical"`      | سلوك تغيير الحجم |
| `rows`       | `number`                                         | `3`               | عدد الأسطر       |

بالإضافة إلى جميع خصائص HTML textarea القياسية.

## مكون Select

مكون قائمة منسدلة قابل للتخصيص مع دعم RTL والتحقق من الصحة ومتغيرات متعددة. تم بناؤه باستخدام قائمة منسدلة مخصصة للحصول على تحكم وتصميم أفضل.

### الاستخدام الأساسي

```tsx
import { Select } from "@/components/ui/input";

const [country, setCountry] = useState("");

<Select
  label="الدولة"
  placeholder="اختر دولة"
  options={[
    { value: "sa", label: "السعودية" },
    { value: "ae", label: "الإمارات" },
  ]}
  value={country}
  onChange={(value) => setCountry(value)}
/>;
```

### مع التحقق من الصحة

```tsx
const [country, setCountry] = useState("");
const [error, setError] = useState("");

<Select
  label="الدولة"
  placeholder="اختر دولة"
  options={countryOptions}
  value={country}
  onChange={(value) => {
    setCountry(value);
    setError(value ? "" : "الدولة مطلوبة");
  }}
  error={error}
  required
/>;
```

### الخصائص

| الخاصية       | النوع                                 | القيمة الافتراضية | الوصف                 |
| ------------- | ------------------------------------- | ----------------- | --------------------- |
| `label`       | `string`                              | -                 | تسمية القائمة         |
| `error`       | `string`                              | -                 | رسالة الخطأ           |
| `helperText`  | `string`                              | -                 | نص مساعد              |
| `options`     | `SelectOption[]`                      | `[]`              | مصفوفة الخيارات       |
| `placeholder` | `string`                              | `"اختر خياراً"`   | نص توضيحي             |
| `fullWidth`   | `boolean`                             | `true`            | عرض كامل              |
| `variant`     | `"default" \| "filled" \| "outlined"` | `"default"`       | النمط                 |
| `selectSize`  | `"sm" \| "md" \| "lg"`                | `"md"`            | الحجم                 |
| `value`       | `string`                              | -                 | القيمة المتحكم بها    |
| `onChange`    | `(value: string) => void`             | -                 | دالة عند تغيير القيمة |
| `name`        | `string`                              | -                 | الاسم لإرسال النموذج  |
| `disabled`    | `boolean`                             | `false`           | حالة التعطيل          |
| `required`    | `boolean`                             | `false`           | حقل مطلوب             |
| `className`   | `string`                              | `""`              | فئات CSS إضافية       |

### واجهة SelectOption

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## مكون DatePicker

مكون اختيار التاريخ قابل للتخصيص مع دعم RTL والتحقق من الصحة وتكامل MUI DatePicker.

### الاستخدام الأساسي

```tsx
import { DatePicker } from "@/components/ui/input";

const [date, setDate] = useState<Date | null>(null);

<DatePicker
  label="تاريخ الميلاد"
  placeholder="اختر التاريخ"
  value={date}
  onChange={(date) => setDate(date)}
/>;
```

### مع التحقق من الصحة

```tsx
const [date, setDate] = useState<Date | null>(null);
const [error, setError] = useState("");

<DatePicker
  label="تاريخ الميلاد"
  placeholder="اختر التاريخ"
  value={date}
  onChange={(date) => {
    setDate(date);
    setError(date ? "" : "التاريخ مطلوب");
  }}
  error={error}
  required
/>;
```

### ميزات متقدمة

```tsx
// تعطيل التواريخ الماضية
<DatePicker
  label="تاريخ مستقبلي"
  disablePast
/>

// تعطيل التواريخ المستقبلية
<DatePicker
  label="تاريخ ماضي"
  disableFuture
/>

// تحديد نطاق التواريخ
<DatePicker
  label="نطاق التاريخ"
  minDate={new Date('2024-01-01')}
  maxDate={new Date('2024-12-31')}
/>

// تنسيق مخصص
<DatePicker
  label="تنسيق مخصص"
  format="DD-MM-YYYY"
/>
```

### الخصائص

| الخاصية         | النوع                                 | القيمة الافتراضية                          | الوصف                     |
| --------------- | ------------------------------------- | ------------------------------------------ | ------------------------- |
| `label`         | `string`                              | -                                          | تسمية منتقي التاريخ       |
| `error`         | `string`                              | -                                          | رسالة الخطأ               |
| `helperText`    | `string`                              | -                                          | نص مساعد                  |
| `placeholder`   | `string`                              | -                                          | نص توضيحي                 |
| `fullWidth`     | `boolean`                             | `true`                                     | عرض كامل                  |
| `variant`       | `"default" \| "filled" \| "outlined"` | `"default"`                                | النمط                     |
| `inputSize`     | `"sm" \| "md" \| "lg"`                | `"md"`                                     | الحجم                     |
| `value`         | `Date \| null`                        | -                                          | القيمة المتحكم بها        |
| `onChange`      | `(date: Date \| null) => void`        | -                                          | دالة عند تغيير التاريخ    |
| `name`          | `string`                              | -                                          | الاسم لإرسال النموذج      |
| `disabled`      | `boolean`                             | `false`                                    | حالة التعطيل              |
| `required`      | `boolean`                             | `false`                                    | حقل مطلوب                 |
| `minDate`       | `Date`                                | -                                          | أقل تاريخ قابل للاختيار   |
| `maxDate`       | `Date`                                | -                                          | أقصى تاريخ قابل للاختيار  |
| `disablePast`   | `boolean`                             | `false`                                    | تعطيل التواريخ الماضية    |
| `disableFuture` | `boolean`                             | `false`                                    | تعطيل التواريخ المستقبلية |
| `format`        | `string`                              | `"DD/MM/YYYY"` (ar) أو `"MM/DD/YYYY"` (en) | تنسيق التاريخ             |
| `className`     | `string`                              | `""`                                       | فئات CSS إضافية           |

## الأحجام

جميع المكونات تدعم ثلاثة أحجام:

- `sm`: صغير (مضغوط)
- `md`: متوسط (افتراضي)
- `lg`: كبير

```tsx
<Input inputSize="sm" />
<Input inputSize="md" />
<Input inputSize="lg" />
```

## الأنماط

جميع المكونات تدعم ثلاثة أنماط:

- `default`: خلفية بيضاء مع حدود
- `filled`: خلفية رمادية
- `outlined`: شفاف مع حدود سميكة

```tsx
<Input variant="default" />
<Input variant="filled" />
<Input variant="outlined" />
```

## دعم RTL

المكونات تكتشف تلقائياً اللغة وتطبق تخطيط RTL:

```tsx
// يتعامل تلقائياً مع RTL بناءً على اللغة
const locale = useLocale();
const isRTL = locale === "ar";
```

## مثال نموذج

```tsx
import { Input, TextArea, Select } from "@/components/ui/input";
import { Mail, User, Phone } from "lucide-react";

function MyForm() {
  return (
    <form className="space-y-4">
      <Input
        label="الاسم الكامل"
        placeholder="أدخل الاسم"
        leftIcon={<User className="w-4 h-4" />}
        required
      />

      <Input
        label="البريد الإلكتروني"
        type="email"
        placeholder="example@email.com"
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />

      <Input
        label="الهاتف"
        type="tel"
        placeholder="+966 XX XXX XXXX"
        leftIcon={<Phone className="w-4 h-4" />}
        required
      />

      <Select
        label="الصف"
        placeholder="اختر الصف"
        options={[
          { value: "1", label: "الصف الأول" },
          { value: "2", label: "الصف الثاني" },
        ]}
        required
      />

      <TextArea label="ملاحظات" placeholder="معلومات إضافية..." rows={4} />

      <button type="submit">إرسال</button>
    </form>
  );
}
```

## مثال التحقق

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
  if (!email) return "البريد الإلكتروني مطلوب";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "صيغة البريد الإلكتروني غير صحيحة";
  }
  return "";
};

const validatePassword = (password: string) => {
  if (!password) return "كلمة المرور مطلوبة";
  if (password.length < 8) {
    return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }
  return "";
};

<Input
  label="البريد الإلكتروني"
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

## سهولة الوصول

- ربط صحيح للتسميات
- إعلانات الأخطاء
- التنقل بلوحة المفاتيح
- إدارة التركيز
- خصائص ARIA

## أفضل الممارسات

1. قدم دائماً تسميات لسهولة الوصول
2. استخدم أنواع الإدخال المناسبة (email, tel, password, إلخ)
3. قدم رسائل خطأ مفيدة
4. استخدم النص المساعد للإرشاد الإضافي
5. وضح الحقول المطلوبة بوضوح
6. تحقق عند فقدان التركيز أو الإرسال، وليس عند كل ضغطة مفتاح
7. استخدم الأيقونات لتحسين سهولة الاستخدام
8. اجعل النص التوضيحي موجزاً
