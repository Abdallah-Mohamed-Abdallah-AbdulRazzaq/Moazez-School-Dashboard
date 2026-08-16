# Lesson Form Learning Content Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Learning Content panel into the center lesson form (`CurriculumEditor.tsx`) with a view switcher button and a back button, while maintaining `CurriculumRightPanel` as the curriculum details view.

**Architecture:** Add a `viewMode: "form" | "learningContent"` state to `CurriculumEditor.tsx`. When a saved lesson is selected, show a "Learning Content" button in the form action bar. Clicking it renders `LearningContentPanel` in the center panel with a top header containing a "Back to Lesson Form" button. Remove the automatic switching to `LearningContentPanel` in `CurriculumRightPanel.tsx` and `CurriculumPageContent.tsx`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, next-intl.

## Global Constraints
- Do not remove or alter existing form validation or save/delete functionality.
- Maintain RTL/LTR support using `next-intl` translations and standard flex/icon layouts.

---

### Task 1: Add Translation Keys

**Files:**
- Modify: `e:\sis-dashboard\src\messages\en.json`
- Modify: `e:\sis-dashboard\src\messages\ar.json`

**Interfaces:**
- Produces: Translation key `academics.curriculum.editor.back_to_form`

- [ ] **Step 1: Add `back_to_form` key to `en.json`**

In `src/messages/en.json` under `academics.curriculum.editor`:
```json
"back_to_form": "Back to Lesson Form"
```

- [ ] **Step 2: Add `back_to_form` key to `ar.json`**

In `src/messages/ar.json` under `academics.curriculum.editor`:
```json
"back_to_form": "العودة لنموذج الدرس"
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat(academics): add back_to_form translation keys for curriculum editor"
```

---

### Task 2: Update `CurriculumRightPanel` and `CurriculumPageContent`

**Files:**
- Modify: `e:\sis-dashboard\src\features\academics\curriculum\components\CurriculumRightPanel.tsx:33-42,200-217`
- Modify: `e:\sis-dashboard\src\features\academics\curriculum\pages\CurriculumPageContent.tsx:1675-1696`

**Interfaces:**
- Consumes: `CurriculumDetailsPanelProps`
- Produces: Simplified `CurriculumRightPanelProps` that only accepts `details`

- [ ] **Step 1: Simplify `CurriculumRightPanel.tsx`**

Remove `LearningContentState` interface and `LearningContentPanel` import, updating `CurriculumRightPanel` to always return `CurriculumDetailsPanel`:

```tsx
export default function CurriculumRightPanel({
  details,
}: {
  details: CurriculumDetailsPanelProps;
}) {
  return <CurriculumDetailsPanel {...details} />;
}
```

- [ ] **Step 2: Update `curriculumRightPanelProps` in `CurriculumPageContent.tsx`**

Update `curriculumRightPanelProps` to pass only `details` without `learningContent`:

```tsx
  const curriculumRightPanelProps = {
    details: {
      curriculum: curriculum!,
      exportRowCount: curriculumExportRows.length,
      availability: {
        canActivate,
        canArchive,
        canDelete: canMutate,
      },
      actions: {
        openExport: () => setShowExportModal(true),
        activate: () => void handleActivateCurriculum(),
        requestArchive: () => setConfirmationAction("archive"),
        requestDelete: () => setConfirmationAction("delete"),
      },
    },
  };
```

- [ ] **Step 3: Verify tests pass**

Run: `npx vitest run src/features/academics/curriculum/components/__tests__/CurriculumRightPanel.test.tsx` (if present) or `npm test`

- [ ] **Step 4: Commit**

```bash
git add src/features/academics/curriculum/components/CurriculumRightPanel.tsx src/features/academics/curriculum/pages/CurriculumPageContent.tsx
git commit -m "refactor(academics): keep right panel exclusively for curriculum details"
```

---

### Task 3: Add View Mode Switcher and Learning Content View in `CurriculumEditor`

**Files:**
- Modify: `e:\sis-dashboard\src\features\academics\curriculum\components\CurriculumEditor.tsx`
- Modify: `e:\sis-dashboard\src\features\academics\curriculum\components\__tests__\CurriculumEditor.test.tsx`

**Interfaces:**
- Consumes: `LearningContentPanel` component, `curriculum`, `selectedNode`
- Produces: `CurriculumEditor` with toggleable `"form"` and `"learningContent"` view modes.

- [ ] **Step 1: Write failing test in `CurriculumEditor.test.tsx`**

Add tests checking that when a saved lesson node is selected:
1. A button with text matching `learning_content` ("Learning Content") is rendered.
2. Clicking it switches to the learning content view displaying the back button ("Back to Lesson Form").
3. Clicking the back button switches back to the lesson form.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`
Expected: FAIL (button or view state not present)

- [ ] **Step 3: Implement view mode state & LearningContentPanel rendering in `CurriculumEditor.tsx`**

1. Import `BookOpen` and `ArrowLeft` / `ArrowRight` from `lucide-react`.
2. Import `LearningContentPanel` from `./LearningContentPanel`.
3. Add state `const [viewMode, setViewMode] = useState<"form" | "learningContent">("form");`.
4. In `useLayoutEffect`, add `setViewMode("form");` so selection changes reset view mode to form.
5. In form view mode, if `selectedNode.type === "lesson"` and `!isNew`:
   Add a button to the actions row:
   ```tsx
   <Button
     type="button"
     onClick={() => setViewMode("learningContent")}
     variant="secondary"
     leftIcon={<BookOpen className="w-4 h-4" />}
   >
     {t("learning_content")}
   </Button>
   ```
6. If `viewMode === "learningContent"` and `selectedNode?.type === "lesson"` and `!isNew`:
   Render:
   ```tsx
   <div className="flex flex-col h-full">
     <div className="p-4 bg-white border-b border-border flex items-center justify-between">
       <Button
         type="button"
         variant="secondary"
         size="sm"
         onClick={() => setViewMode("form")}
         leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
       >
         {t("back_to_form")}
       </Button>
     </div>
     <div className="flex-1 overflow-auto">
       <LearningContentPanel
         curriculumId={curriculum.id}
         unitId={lessons.find(l => l.id === selectedNode.id)?.unitId || ""}
         lessonId={selectedNode.id}
         isReadOnly={isReadOnly}
         onClose={() => setViewMode("form")}
       />
     </div>
   </div>
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/academics/curriculum/components/CurriculumEditor.tsx src/features/academics/curriculum/components/__tests__/CurriculumEditor.test.tsx
git commit -m "feat(academics): integrate learning content panel into lesson form editor with back button"
```
