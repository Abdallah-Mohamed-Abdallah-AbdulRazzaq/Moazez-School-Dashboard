import type { AcademicsOverviewResponse } from "./overviewApiAdapter";

export interface ChecklistItem {
  id: string;
  status: "done" | "warning" | "error";
  titleKey: string;
  descriptionKey: string;
  link: string;
}

export function generateChecklist(
  response: AcademicsOverviewResponse,
  lang: string,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const { setupIndicators } = response;

  items.push({
    id: "academicYear",
    status: setupIndicators.hasAcademicYear ? "done" : "error",
    titleKey: "academics.overview.checklist.academicYear.title",
    descriptionKey: "academics.overview.checklist.academicYear.description",
    link: `/${lang}/academics/structure`,
  });

  items.push({
    id: "term",
    status: setupIndicators.hasTerm ? "done" : "error",
    titleKey: "academics.overview.checklist.term.title",
    descriptionKey: "academics.overview.checklist.term.description",
    link: `/${lang}/academics/structure`,
  });

  items.push({
    id: "structure",
    status: setupIndicators.hasStructure ? "done" : "warning",
    titleKey: "academics.overview.checklist.structure.title",
    descriptionKey: "academics.overview.checklist.structure.description",
    link: `/${lang}/academics/structure`,
  });

  items.push({
    id: "subjects",
    status: setupIndicators.hasSubjects ? "done" : "warning",
    titleKey: "academics.overview.checklist.subjects.title",
    descriptionKey: "academics.overview.checklist.subjects.description",
    link: `/${lang}/academics/subjects`,
  });

  items.push({
    id: "rooms",
    status: setupIndicators.hasRooms ? "done" : "warning",
    titleKey: "academics.overview.checklist.rooms.title",
    descriptionKey: "academics.overview.checklist.rooms.description",
    link: `/${lang}/academics/rooms`,
  });

  items.push({
    id: "teachers",
    status: setupIndicators.hasTeacherAllocations ? "done" : "warning",
    titleKey: "academics.overview.checklist.teachers.title",
    descriptionKey: "academics.overview.checklist.teachers.description",
    link: `/${lang}/academics/teacher-allocation`,
  });

  items.push({
    id: "curriculum",
    status: setupIndicators.hasCurriculum ? "done" : "warning",
    titleKey: "academics.overview.checklist.curriculum.title",
    descriptionKey: "academics.overview.checklist.curriculum.description",
    link: `/${lang}/academics/curriculum`,
  });

  items.push({
    id: "lessonPlans",
    status: setupIndicators.hasLessonPlans ? "done" : "warning",
    titleKey: "academics.overview.checklist.lessonPlans.title",
    descriptionKey: "academics.overview.checklist.lessonPlans.description",
    link: `/${lang}/academics/lesson-plans`,
  });

  items.push({
    id: "timetable",
    status: setupIndicators.hasTimetable ? "done" : "warning",
    titleKey: "academics.overview.checklist.timetable.title",
    descriptionKey: "academics.overview.checklist.timetable.description",
    link: `/${lang}/academics/timetable`,
  });

  items.push({
    id: "calendar",
    status: setupIndicators.hasCalendarEvents ? "done" : "warning",
    titleKey: "academics.overview.checklist.calendar.title",
    descriptionKey: "academics.overview.checklist.calendar.description",
    link: `/${lang}/academics/calendar`,
  });

  return items;
}

