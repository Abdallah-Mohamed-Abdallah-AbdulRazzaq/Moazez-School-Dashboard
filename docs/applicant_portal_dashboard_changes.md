# Applicant Portal → Dashboard Integration Changes

## Repositories

- Backend: `Abdallah-Mohamed-Abdallah-AbdulRazzaq/Moazez-Backend`
- Frontend: `blackfalc0ns/sis_dashboard`

## هدف الملف

هذا الملف يحدد التعديلات المطلوبة في **Dashboard فقط** بخصوص Applicant Portal.

المطلوب ليس تنفيذ Applicant Portal كامل داخل الداشبورد. المطلوب هو التأكد أن مخرجات Applicant Portal تظهر وتدار بشكل صحيح داخل Admissions Dashboard بعد أن يقوم الـ applicant بعمل submit.

---

## القرار الأساسي

الداشبورد لا يجب أن ينفذ الـ applicant-facing flows التالية:

- إنشاء حساب applicant.
- applicant profile.
- school discovery/public school browser.
- إنشاء draft applicant request.
- رفع/استبدال/حذف مستندات من جهة applicant.
- submit request من applicant side.
- استخدام endpoints الخاصة بـ `/applicant-portal/requests/*` داخل الداشبورد.

هذه كلها تخص Applicant Portal أو mobile/web applicant app، وليست Dashboard.

الداشبورد يتعامل فقط مع الناتج بعد submit من خلال Admissions APIs الحالية.

---

## Backend Contract Summary

### Applicant Portal submit

عند تنفيذ:

```txt
POST /applicant-portal/requests/:requestId/submit
```

الباك يقوم بإنشاء أو ربط Admissions Application school-scoped واحدة.

الداشبورد يقرأ هذه الـ application من:

```txt
GET /admissions/applications
GET /admissions/applications/:id
```

### Applicant documents bridge

المستندات التي يرفعها applicant لا تظهر للمدرسة قبل submit.

بعد submit، الباك يعمل bridge للمستندات إلى Admissions documents، والداشبورد يقرأها من:

```txt
GET /admissions/applications/:applicationId/documents
```

وليس من:

```txt
GET /applicant-portal/requests/:requestId/documents
```

---

## الوضع الحالي في الفرونت

### موجود بالفعل

الفرونت يحتوي على Admissions Dashboard module، وليس Applicant Portal module.

الموجود حاليًا:

- Applications list.
- Application details.
- Documents tab.
- Tests.
- Interviews.
- Decisions.
- Enrollment.

الـ Applications service يستخدم:

```txt
/admissions/applications
/admissions/applications/:id
/admissions/applications/:id/submit
```

والـ Documents service يستخدم:

```txt
/admissions/applications/:applicationId/documents
/admissions/applications/:applicationId/documents/:documentId/accept
/admissions/applications/:applicationId/documents/:documentId/reject
/admissions/applications/:applicationId/documents/:documentId/request-replacement
```

وهذا هو السلوك الصحيح للداشبورد.

### غير موجود، وهذا صحيح للداشبورد

لا يوجد Applicant Portal كامل في الفرونت، وهذا ليس مطلوبًا داخل الداشبورد.

---

## التعديلات المطلوبة في الداشبورد

## 1. عدم إضافة Applicant Portal module داخل dashboard

لا تضف routes مثل:

```txt
/en/applicant-portal
/ar/applicant-portal
/en/apply
/ar/apply
```

ولا تضف services تستخدم:

```txt
/applicant-portal/accounts
/applicant-portal/profile
/applicant-portal/requests
/applicant-portal/requests/:requestId/documents
```

هذه ليست مسؤولية الداشبورد.

---

## 2. تحسين عرض مصدر الطلب في Applications List

### المشكلة الحالية

في `ApplicationsList.tsx` يوجد source labels فقط لـ:

```ts
in_app
referral
walk_in
other
```

وفي الباك، قيم `APPLICATION_SOURCE_API_VALUES` الحالية هي:

```ts
in_app
referral
walk_in
other
```

كما أن Applicant Portal submit حاليًا ينشئ Admissions Application بـ:

```ts
source: AdmissionApplicationSource.IN_APP
```

بالتالي الداشبورد لا يستطيع تمييز الطلب القادم من Applicant Portal عن أي application عادية مصدرها `in_app`.

### المطلوب في الفرونت الآن

- أضف fallback آمن لأي source غير معروف بدل عرض raw value بشكل سيئ.
- لا تعتمد على وجود `applicant_portal` source حاليًا إلا إذا تم تعديل الباك.
- يمكن مؤقتًا عرض `in_app` كـ `In app / Portal` لو المنتج يريد توضيح أن هذه القيمة قد تشمل Applicant Portal.

مثال:

```ts
const sourceLabels: Record<string, string> = {
  in_app: tSource("in_app"),
  referral: tSource("referral"),
  walk_in: tSource("walk_in"),
  other: tSource("other"),
  applicant_portal: tSource("applicant_portal"), // future-proof only
};

function getSourceLabel(source?: string | null) {
  if (!source) return "—";
  return sourceLabels[source] ?? source.replaceAll("_", " ");
}
```

### Backend optional improvement

لو مطلوب business-wise تمييز طلبات Applicant Portal بوضوح، فهذا يحتاج backend change أيضًا:

- إضافة source جديد مثل `applicant_portal` أو حقل origin واضح مثل `createdVia`.
- تحديث submit applicant request ليحفظ هذا المصدر بدل `IN_APP`.
- تحديث API DTOs/mappers/Prisma enum إذا تم اختيار enum source.
- بعد ذلك فقط يضاف source filter حقيقي في dashboard.

---

## 3. لا تضف source filter server-side الآن إلا إذا الباك دعمه

### السبب

Backend `ListApplicationsQueryDto` الحالي يدعم فقط:

```ts
status?: ApplicationStatusApiValue;
```

ولا يدعم `source` في query.

### المطلوب

- لا ترسل `source` إلى `GET /admissions/applications` حاليًا.
- إذا احتجنا source filter في UI الآن، يكون local/client-side فقط على البيانات الراجعة.
- الأفضل تأجيل source filter الحقيقي لحين دعم الباك لـ:

```txt
GET /admissions/applications?source=applicant_portal
```

أو:

```txt
GET /admissions/applications?source=in_app
```

حسب contract النهائي.

---

## 4. تأكيد أن الطلبات القادمة من Applicant Portal تظهر في Applications List

### المطلوب

في `src/features/admissions/applications/pages/ApplicationsList.tsx`:

- استمر في استخدام `fetchApplications` من Admissions API.
- تأكد أن statuses التالية تظهر صح:
  - `submitted`
  - `documents_pending`
  - `under_review`
  - `accepted`
  - `waitlisted`
  - `rejected`
- لا تخفي applications التي مصدرها `in_app` لأن Applicant Portal حاليًا يستخدم `IN_APP` في الباك.
- أضف empty/error states واضحة لو التطبيق لا يظهر بسبب permission أو status filter.

---

## 5. تأكيد أن مستندات Applicant Portal تظهر في Documents tab

### المطلوب

في `src/features/admissions/applications/components/tabs/DocumentsTab.tsx`:

- استمر في استخدام Admissions documents endpoint:

```txt
/admissions/applications/:applicationId/documents
```

- لا تستخدم applicant portal documents endpoints داخل الداشبورد.
- تأكد أن status `pending_review` يظهر بوضوح كالتالي:

```txt
Submitted by applicant and waiting for school review.
```

أو بالعربي:

```txt
تم رفع المستند من المتقدم وينتظر مراجعة المدرسة.
```

- تأكد أن status `missing` يظهر كـ missing/needs action.
- تأكد أن actions الخاصة بالموظف فقط تظهر حسب permissions:
  - view/download مع `admissions.documents.view`.
  - accept/reject/request replacement/delete مع `admissions.documents.manage`.

---

## 6. عدم تنفيذ applicant upload/replace/delete داخل الداشبورد

لا تضف في الداشبورد أي calls مثل:

```txt
POST /applicant-portal/requests/:requestId/documents
POST /applicant-portal/requests/:requestId/documents/:documentId/replacements
DELETE /applicant-portal/requests/:requestId/documents/:documentId
```

هذه تخص applicant-facing app فقط.

الداشبورد يتعامل مع school-side Admissions documents فقط.

---

## 7. تحسين عرض required documents

### الحالي

`DocumentsTab.tsx` يحتوي على hardcoded list:

```ts
Birth Certificate
Passport Copy
Medical Report
Previous School Certificate
National ID
Vaccination Record
Report Card
Transfer Certificate
```

### المطلوب المقترح

- لا تجعل مراجعة applicant documents تعتمد فقط على hardcoded document types.
- لو البيانات متاحة من application context أو settings، استخدم required documents الفعلية الخاصة بالمدرسة.
- يوجد service في settings يقرأ:

```txt
/applicant-portal/schools/:schoolId/admission-required-documents
```

لكن استخدامه داخل dashboard يحتاج توفر `schoolId` أو context صحيح.

### تنفيذ آمن

- المرحلة الأولى: اترك hardcoded list كما هي للـ staff manual upload، لكن اعرض bridged applicant documents كما تأتي من API حتى لو `documentType` مختلف.
- المرحلة الثانية: إذا وفر الباك `requiredDocument` أو `requiredDocumentId` داخل Admissions document response، استخدمها لعرض اسم المستند المطلوب بشكل أدق.

---

## 8. تحسين copy/UX في Applications Dashboard

أضف نصوص أو badges توضح الحالات المهمة:

### في Applications list

- `documents_pending`: يحتاج مستندات.
- `submitted`: تم التقديم.
- `under_review`: تحت المراجعة.

### في Application Details > Documents

- `pending_review`: مستند مرفوع وينتظر مراجعة المدرسة.
- `missing`: مستند ناقص.
- `complete`: مستند مكتمل/مقبول.

---

## 9. Tests المطلوبة

أضف أو حدّث tests تغطي الآتي:

### Applications List

- يعرض application قادمة بـ source `in_app` بدون إخفائها.
- لا يفشل لو source غير معروف.
- يعرض status `documents_pending` بشكل صحيح.
- لا يرسل `source` query param للباك طالما الباك لا يدعمه.

### Documents Tab

- يستخدم Admissions documents endpoint وليس Applicant Portal endpoint.
- يعرض `pending_review` copy صحيح.
- يظهر accept/reject/request replacement فقط مع `admissions.documents.manage`.
- يظهر view/download فقط مع `admissions.documents.view`.
- لا يحاول استخدام applicant document replace/delete endpoints.

### Regression

- Applicant Portal submit result يظهر داخل Applications list طالما API يرجعه.
- Bridged documents تظهر في Documents tab طالما API يرجعها.

---

## Files likely to change

### Frontend

```txt
src/features/admissions/applications/pages/ApplicationsList.tsx
src/features/admissions/applications/components/tabs/DocumentsTab.tsx
src/features/admissions/applications/services/applicationsApiService.ts
src/features/admissions/applications/api/applicationsApi.ts
src/features/admissions/types/admissions.ts
src/messages/en.json أو مكان ترجمات admissions
src/messages/ar.json أو مكان ترجمات admissions
```

`applicationsApiService.ts` و `applicationsApi.ts` لا يحتاجان source filter الآن إلا إذا تم دعم `source` في الباك.

### Backend optional only if product needs source distinction

```txt
src/modules/admissions/applications/domain/application.enums.ts
src/modules/admissions/applications/dto/application.dto.ts
src/modules/applicant-portal/infrastructure/applicant-portal.repository.ts
```

هذا optional وليس مطلوبًا للداشبورد وحده.

---

## Acceptance Criteria

- لا يوجد Applicant Portal module جديد داخل dashboard.
- لا يوجد استخدام لـ applicant-owned request/document endpoints داخل dashboard.
- Applications Dashboard يعرض submitted applicant requests من خلال Admissions applications API.
- Documents tab يعرض bridged applicant documents من خلال Admissions documents API.
- `documents_pending` و `pending_review` ظاهرين بوضوح في UI.
- source labels لا تكسر UI إذا ظهر source غير معروف.
- لا يتم إرسال `source` filter للباك طالما الباك لا يدعمه.
- permissions الخاصة بـ Admissions documents محفوظة.
- existing staff admissions workflow لا يتكسر: tests/interviews/decisions/enrollment.

---

## Codex Prompt

```txt
You are working in the frontend repo blackfalc0ns/sis_dashboard.

Goal:
Implement only the Dashboard-side integration polish for Applicant Portal outputs inside Admissions Dashboard. Do NOT build an applicant-facing portal inside the dashboard.

Important backend contract:
- Applicant Portal submit creates/links a school-scoped Admissions Application.
- Dashboard must read it through /admissions/applications and /admissions/applications/:id.
- Applicant documents are bridged to Admissions documents after submit.
- Dashboard must read them through /admissions/applications/:applicationId/documents.
- Dashboard must not call /applicant-portal/requests/* endpoints.

Tasks:
1. In ApplicationsList.tsx, make source label rendering robust:
   - existing source values: in_app, referral, walk_in, other
   - future-proof applicant_portal label if it appears
   - fallback gracefully for unknown source values
2. Do not add source query param to listApplications unless backend already supports it. Current backend only supports status for ListApplicationsQueryDto.
3. Ensure applications with source in_app are not hidden, because Applicant Portal submit currently creates Admissions Application source as IN_APP.
4. In DocumentsTab.tsx, keep using Admissions documents endpoints only.
5. Improve copy for pending_review/missing/complete statuses so bridged applicant documents are clear to staff.
6. Ensure view/download actions remain gated by admissions.documents.view.
7. Ensure accept/reject/request replacement/delete actions remain gated by admissions.documents.manage.
8. Do not add applicant upload/replace/delete endpoints to the dashboard.
9. Add tests for:
   - unknown source fallback
   - in_app source remains visible
   - no source query param sent unless backend supports it
   - pending_review document copy
   - document actions permission gating
   - no calls to applicant-portal request/document endpoints from dashboard code

Keep existing Admissions staff workflow intact: applications list, details tabs, documents, tests, interviews, decisions, and enrollment.
```
