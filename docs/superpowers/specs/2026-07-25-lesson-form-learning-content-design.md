# Design Spec: Lesson Form Learning Content Integration

## Goal
Replace the right-drawer learning content display with an in-place view switcher in the center lesson form panel (`CurriculumEditor.tsx`). A new button in the lesson form opens the learning content directly inside the center panel, and a back button allows returning to the lesson form.

## Proposed Changes

### 1. `CurriculumEditor.tsx`
- Add state `viewMode: "form" | "learningContent"` (defaulting to `"form"`).
- Reset `viewMode` to `"form"` in `useLayoutEffect` whenever `selectedNode` changes.
- When `selectedNode` is a lesson (`selectedNode.type === "lesson"`) and is an existing saved lesson (`!isNew`):
  - In `"form"` view mode:
    - Include a secondary button in the form action buttons row labeled `t("learning_content")` ("Learning Content" / "المحتوى التعليمي") with `<BookOpen />` icon.
    - Clicking this button sets `viewMode = "learningContent"`.
  - In `"learningContent"` view mode:
    - Display a top header with a back button labeled `t("back_to_form")` ("Back to Lesson Form" / "العودة لنموذج الدرس").
    - Render `<LearningContentPanel>` passing `curriculumId={curriculum.id}`, `unitId={lesson.unitId}`, `lessonId={selectedNode.id}`, `isReadOnly={isReadOnly}`, and `onClose={() => setViewMode("form")}`.

### 2. `CurriculumRightPanel.tsx` & `CurriculumPageContent.tsx`
- Remove the logic that switches `CurriculumRightPanel` to `LearningContentPanel` when a lesson is selected.
- `CurriculumRightPanel` will consistently display `CurriculumDetailsPanel` regardless of node selection.
- Update `curriculumRightPanelProps` in `CurriculumPageContent.tsx` to omit `learningContent` or simplify the props.

### 3. Translations (`en.json` & `ar.json`)
- Add `academics.curriculum.editor.back_to_form`:
  - En: `"Back to Lesson Form"`
  - Ar: `"العودة لنموذج الدرس"`

## Verification Plan
1. Manual UI testing in browser:
   - Navigate to `/ar/academics/curriculum/[curriculumId]`.
   - Select a lesson in the curriculum outline.
   - Verify right panel shows curriculum details instead of learning content.
   - Click "Learning Content" button in the lesson form.
   - Verify center pane switches to Learning Content manager.
   - Click "Back to Lesson Form" button.
   - Verify center pane returns to the lesson edit form.
2. Automated test suite execution:
   - Run `npm test` or existing component tests for `CurriculumEditor.test.tsx` and `LearningContentPanel.test.tsx`.
