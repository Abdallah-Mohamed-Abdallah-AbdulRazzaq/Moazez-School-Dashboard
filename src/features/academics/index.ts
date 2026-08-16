// FILE: src/features/academics/index.ts
// Main exports for academics feature

// ============================================================================
// PAGES
// ============================================================================
export { default as AcademicCalendarPage } from "./calendar/pages/AcademicCalendarPage";
export { default as AcademicStructurePage } from "./academic-structure-tree/pages/AcademicStructurePage";
export { default as AssignmentBuilderPage } from "./curriculum/pages/AssignmentBuilderPage";
export { default as CurriculumPage } from "./curriculum/pages/CurriculumPage";
export { default as CurriculumPageResizable } from "./curriculum/pages/CurriculumPageResizable";
export { default as LessonPlansPage } from "./lesson-plans/pages/LessonPlansPage";
export { default as SubjectsAllocationPage } from "./subjects/pages/SubjectsAllocationPage";
export { default as SubjectsAllocationView } from "./subjects/views/SubjectsAllocationView";
export { default as TeacherAllocationPage } from "./teacher-allocation/pages/TeacherAllocationPage";
export { default as TeacherAllocationView } from "./teacher-allocation/views/TeacherAllocationView";
export { default as TimetablePage } from "./timetable/pages/TimetablePage";

// ============================================================================
// CONTAINERS
// ============================================================================
export { default as SubjectsAllocationContainer } from "./subjects/container/SubjectsAllocationContainer";
export { default as TeacherAllocationContainer } from "./teacher-allocation/container/TeacherAllocationContainer";

// ============================================================================
// UTILITIES
// ============================================================================
// Note: Utilities are not re-exported to avoid naming conflicts
// Import directly from specific utility files when needed
