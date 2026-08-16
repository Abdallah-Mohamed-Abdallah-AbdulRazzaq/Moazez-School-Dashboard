import { apiGet } from "@/lib/api";

export interface AcademicsOverviewResponse {
  generatedAt: string;
  academicContext: {
    academicYear: {
      id: string;
      nameAr: string | null;
      nameEn: string | null;
      startDate: string;
      endDate: string;
      isActive: boolean;
    } | null;
    term: {
      id: string;
      academicYearId: string;
      nameAr: string | null;
      nameEn: string | null;
      startDate: string;
      endDate: string;
      isActive: boolean;
    } | null;
  };
  structure: {
    stagesCount: number;
    gradesCount: number;
    sectionsCount: number;
    classroomsCount: number;
  };
  subjects: {
    subjectsCount: number;
    activeSubjectsCount: number;
  };
  rooms: {
    roomsCount: number;
  };
  teacherAllocation: {
    allocationsCount: number;
    allocatedTeachersCount: number;
    allocatedSubjectsCount: number;
  };
  curriculum: {
    curriculaCount: number;
    activeCurriculaCount: number;
    unitsCount: number;
    lessonsCount: number;
  };
  lessonPlans: {
    lessonPlansCount: number;
    plannedItemsCount: number;
  };
  timetable: {
    entriesCount: number;
    activeEntriesCount: number;
  };
  calendar: {
    eventsCount: number;
    upcomingEventsCount: number;
  };
  upcomingEvents: Array<{
    id: string;
    academicYearId: string | null;
    termId: string | null;
    title: string;
    type: string;
    scope: {
      type: string;
      id: string | null;
    };
    allDay: boolean;
    startDate: string;
    endDate: string;
  }>;
  setupIndicators: {
    hasAcademicYear: boolean;
    hasTerm: boolean;
    hasStructure: boolean;
    hasSubjects: boolean;
    hasRooms: boolean;
    hasTeacherAllocations: boolean;
    hasCurriculum: boolean;
    hasLessonPlans: boolean;
    hasTimetable: boolean;
    hasCalendarEvents: boolean;
    readyForScheduling: boolean;
    readyForLearningFlow: boolean;
  };
  deferred: {
    advancedAnalytics: boolean;
    alertsLifecycle: boolean;
    appFacingOverview: boolean;
  };
}

const buildOverviewQuery = (params?: { academicYearId?: string; termId?: string }) => {
  const search = new URLSearchParams();
  if (params?.academicYearId) search.set("academicYearId", params.academicYearId);
  if (params?.termId) search.set("termId", params.termId);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export async function fetchAcademicsOverview(params?: {
  academicYearId?: string;
  termId?: string;
}): Promise<AcademicsOverviewResponse> {
  return apiGet<AcademicsOverviewResponse>(
    `/academics/overview${buildOverviewQuery(params)}`
  );
}
