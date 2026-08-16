# مكون Modal (النافذة المنبثقة)

مكون نافذة منبثقة قابل لإعادة الاستخدام مع دعم RTL وميزات قابلة للتخصيص.

## المميزات

- ✅ دعم RTL (العربية/الإنجليزية)
- ✅ أحجام متعددة (sm, md, lg, xl, full)
- ✅ رأس وتذييل قابلين للتخصيص
- ✅ الإغلاق عند النقر خارج النافذة (اختياري)
- ✅ الإغلاق عند الضغط على Escape (اختياري)
- ✅ قفل التمرير عند فتح النافذة
- ✅ رسوم متحركة سلسة
- ✅ سهولة الوصول (التنقل بلوحة المفاتيح)
- ✅ دعم TypeScript

## الاستخدام الأساسي

```tsx
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>فتح النافذة</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="نافذتي">
        <p>محتوى النافذة هنا</p>
      </Modal>
    </>
  );
}
```

## الخصائص (Props)

| الخاصية               | النوع                                    | القيمة الافتراضية | الوصف                          |
| --------------------- | ---------------------------------------- | ----------------- | ------------------------------ |
| `isOpen`              | `boolean`                                | مطلوب             | التحكم في ظهور النافذة         |
| `onClose`             | `() => void`                             | مطلوب             | دالة تُستدعى عند إغلاق النافذة |
| `title`               | `string`                                 | -                 | عنوان النافذة (اختياري)        |
| `children`            | `ReactNode`                              | مطلوب             | محتوى النافذة                  |
| `size`                | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"`            | عرض النافذة                    |
| `showCloseButton`     | `boolean`                                | `true`            | إظهار زر X في الرأس            |
| `closeOnOverlayClick` | `boolean`                                | `true`            | الإغلاق عند النقر خارج النافذة |
| `closeOnEscape`       | `boolean`                                | `true`            | الإغلاق عند الضغط على Escape   |
| `footer`              | `ReactNode`                              | -                 | محتوى التذييل (أزرار، إلخ)     |
| `className`           | `string`                                 | `""`              | فئات CSS إضافية                |

## أمثلة

### نافذة تأكيد

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="تأكيد الإجراء"
  size="sm"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        إلغاء
      </Button>
      <Button onClick={handleConfirm}>تأكيد</Button>
    </>
  }
>
  <p>هل أنت متأكد من المتابعة؟</p>
</Modal>
```

### نافذة نموذج

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="إضافة طالب"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        إلغاء
      </Button>
      <Button onClick={handleSubmit}>حفظ</Button>
    </>
  }
>
  <form>
    <input type="text" placeholder="الاسم" />
    <input type="email" placeholder="البريد الإلكتروني" />
  </form>
</Modal>
```

### نافذة بمحتوى كبير

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="التفاصيل"
  size="xl"
>
  <div className="space-y-4">{/* محتوى طويل سيتم التمرير فيه */}</div>
</Modal>
```

### إغلاق محدود

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="مهم"
  closeOnOverlayClick={false}
  closeOnEscape={false}
  footer={<Button onClick={() => setIsOpen(false)}>فهمت</Button>}
>
  <p>يجب عليك الإقرار بهذه الرسالة.</p>
</Modal>
```

## الأحجام

- `sm`: 384px (24rem)
- `md`: 448px (28rem) - افتراضي
- `lg`: 512px (32rem)
- `xl`: 576px (36rem)
- `full`: عرض كامل مع هامش 16px

## دعم RTL

تكتشف النافذة تلقائياً اللغة الحالية وتطبق تخطيط RTL للعربية:

```tsx
// يتعامل تلقائياً مع RTL بناءً على اللغة
const locale = useLocale();
const isRTL = locale === "ar";
```

## سهولة الوصول

- مفتاح Escape يغلق النافذة (ما لم يتم تعطيله)
- حبس التركيز داخل النافذة
- قفل التمرير عند الفتح
- تسميات ARIA مناسبة
- دعم التنقل بلوحة المفاتيح

## التنسيق

تستخدم النافذة فئات Tailwind CSS ويمكن تخصيصها:

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  className="custom-modal-class"
>
  {/* المحتوى */}
</Modal>
```

## الرسوم المتحركة

تتضمن النافذة رسوماً متحركة سلسة:

- الشفافية: 0 ← 1
- الحجم: 0.95 ← 1
- الموضع العمودي: -10px ← 0
- المدة: 200ms

## أفضل الممارسات

1. قدم دائماً معالج `onClose`
2. استخدم الحجم المناسب للمحتوى
3. أضف أزرار في التذييل للإجراءات
4. استخدم `closeOnOverlayClick={false}` للإجراءات الحرجة
5. قدم عناوين واضحة
6. اجعل المحتوى موجزاً وسهل القراءة
7. استخدم أنواع الأزرار المناسبة (outline للإلغاء، primary للتأكيد)

## أنماط شائعة

### تأكيد الحذف

```tsx
<Modal
  isOpen={deleteModal}
  onClose={() => setDeleteModal(false)}
  title="تأكيد الحذف"
  size="sm"
  footer={
    <>
      <Button variant="outline" onClick={() => setDeleteModal(false)}>
        إلغاء
      </Button>
      <Button className="bg-red-600" onClick={handleDelete}>
        حذف
      </Button>
    </>
  }
>
  <div className="flex items-start gap-4">
    <AlertTriangle className="w-6 h-6 text-red-600" />
    <p>لا يمكن التراجع عن هذا الإجراء.</p>
  </div>
</Modal>
```

### رسالة نجاح

```tsx
<Modal
  isOpen={successModal}
  onClose={() => setSuccessModal(false)}
  title="نجح"
  size="sm"
  footer={<Button onClick={() => setSuccessModal(false)}>إغلاق</Button>}
>
  <div className="flex items-center gap-4">
    <CheckCircle className="w-6 h-6 text-green-600" />
    <p>تمت العملية بنجاح!</p>
  </div>
</Modal>
```

## الاستخدام مع الترجمة

```tsx
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations("modals");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={t("confirm_title")}
      footer={
        <>
          <Button onClick={() => setIsOpen(false)}>{t("cancel")}</Button>
          <Button onClick={handleConfirm}>{t("confirm")}</Button>
        </>
      }
    >
      <p>{t("confirm_message")}</p>
    </Modal>
  );
}
```
