import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceEntry, AttendanceSession } from "@/features/attendance/roll-call/types";
import type { Classroom, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import type { Incident, IncidentType } from "../types";
import { getThresholdState } from "@/features/attendance/shared/policyThresholds";
import {
  ATTENDANCE_SCOPE_PRIORITY,
  resolveAttendanceHierarchyScope,
  scopeMatchesTarget,
} from "@/features/attendance/shared/attendanceScope";

interface StudentLike {
  id: string;
  studentNumber?: string;
  nameAr?: string;
  nameEn?: string;
  full_name_ar?: string;
  full_name_en?: string;
  student_id?: string;
}

interface DeriveOptions {
  yearId: string;
  termId: string;
  sessions: AttendanceSession[];
  entries: AttendanceEntry[];
  policies: AttendancePolicy[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  studentsById: Map<string, StudentLike>;
}

export interface ResolvedAttendanceScope {
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export function resolveSessionScope(
  session: AttendanceSession,
  gradesById: Map<string, Grade>,
  sectionsById: Map<string, Section>,
  classroomsById: Map<string, Classroom>
): ResolvedAttendanceScope {
  return resolveAttendanceHierarchyScope({
    scopeType: session.scopeType,
    scopeIds: session.scopeIds,
    gradesById: new Map(Array.from(gradesById.entries()).map(([id, grade]) => [id, { stageId: grade.stageId }])),
    sectionsById: new Map(Array.from(sectionsById.entries()).map(([id, section]) => [id, { gradeId: section.gradeId }])),
    classroomsById: new Map(Array.from(classroomsById.entries()).map(([id, classroom]) => [id, { sectionId: classroom.sectionId }])),
  });
}

export function resolveEffectiveAttendancePolicy(
  policies: AttendancePolicy[],
  date: string,
  scope: ResolvedAttendanceScope,
): AttendancePolicy | null {
  const active = policies.filter((policy) => {
    if (!policy.isActive) return false;
    if (policy.effectiveStartDate && date < policy.effectiveStartDate) return false;
    if (policy.effectiveEndDate && date > policy.effectiveEndDate) return false;
    return true;
  });

  for (const scopeType of ATTENDANCE_SCOPE_PRIORITY) {
    const match = active.find(
      (policy) =>
        policy.scopeType === scopeType &&
        scopeMatchesTarget(policy.scopeType, policy.scopeIds, scope)
    );

    if (match) return match;
  }

  return null;
}

function getStudentInfo(student: StudentLike | undefined) {
  return {
    studentNameAr: student?.nameAr || student?.full_name_ar || "",
    studentNameEn: student?.nameEn || student?.full_name_en || "",
    studentNumber: student?.studentNumber || student?.student_id || student?.id || "",
  };
}

function toIncident(
  yearId: string,
  termId: string,
  session: AttendanceSession,
  entry: AttendanceEntry,
  type: IncidentType,
  minutes: number,
  scope: ResolvedAttendanceScope,
  gradesById: Map<string, Grade>,
  sectionsById: Map<string, Section>,
  classroomsById: Map<string, Classroom>,
  policy: AttendancePolicy | null,
  studentsById: Map<string, StudentLike>
): Incident {
  const grade = scope.gradeId ? gradesById.get(scope.gradeId) : undefined;
  const section = scope.sectionId ? sectionsById.get(scope.sectionId) : undefined;
  const classroom = scope.classroomId ? classroomsById.get(scope.classroomId) : undefined;
  const student = studentsById.get(entry.studentId);
  const thresholdState = getThresholdState(type, minutes, policy);

  return {
    id: `${session.id}:${entry.studentId}:${type}`,
    yearId,
    termId,
    date: session.date,
    periodIndex: session.periodIndex || 0,
    periodNameAr: session.periodNameAr,
    periodNameEn: session.periodNameEn,
    sessionId: session.id,
    studentId: entry.studentId,
    ...getStudentInfo(student),
    stageId: scope.stageId,
    gradeId: scope.gradeId,
    sectionId: scope.sectionId,
    classroomId: scope.classroomId,
    gradeNameAr: grade?.nameAr,
    gradeNameEn: grade?.nameEn,
    sectionNameAr: section?.nameAr,
    sectionNameEn: section?.nameEn,
    classroomNameAr: classroom?.nameAr,
    classroomNameEn: classroom?.nameEn,
    type,
    minutes,
    threshold: thresholdState.threshold,
    isViolation: policy ? thresholdState.isReached : null,
    policyScopeSummary: policy ? `${policy.scopeType} - ${policy.nameEn || policy.nameAr}` : "SCHOOL - default",
    policyContext: policy ? "ESTIMATED_CURRENT" : "UNAVAILABLE",
    sessionStatus: session.status,
    updatedAt: entry.updatedAt,
  };
}

export function deriveIncidentsFromSessions(options: DeriveOptions): Incident[] {
  const { yearId, termId, sessions, entries, policies, grades, sections, classrooms, studentsById } = options;
  const gradesById = new Map(grades.map((grade) => [grade.id, grade]));
  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const classroomsById = new Map(classrooms.map((classroom) => [classroom.id, classroom]));

  const entriesBySession = new Map<string, AttendanceEntry[]>();
  for (const entry of entries) {
    const bucket = entriesBySession.get(entry.sessionId) || [];
    bucket.push(entry);
    entriesBySession.set(entry.sessionId, bucket);
  }

  const incidents: Incident[] = [];

  for (const session of sessions) {
    if (session.mode !== "PERIOD" || !session.periodIndex) continue;

    const scope = resolveSessionScope(session, gradesById, sectionsById, classroomsById);
    const policy = resolveEffectiveAttendancePolicy(policies, session.date, scope);
    const sessionEntries = entriesBySession.get(session.id) || [];

    for (const entry of sessionEntries) {
      const isLate = entry.status === "LATE" || (typeof entry.minutesLate === "number" && entry.minutesLate > 0);
      if (isLate) {
        incidents.push(
          toIncident(
            yearId,
            termId,
            session,
            entry,
            "LATE",
            Math.max(0, entry.minutesLate || 0),
            scope,
            gradesById,
            sectionsById,
            classroomsById,
            policy,
            studentsById
          )
        );
      }

      const isEarlyLeave = entry.status === "EARLY_LEAVE" && typeof entry.minutesEarlyLeave === "number";
      if (isEarlyLeave) {
        incidents.push(
          toIncident(
            yearId,
            termId,
            session,
            entry,
            "EARLY_LEAVE",
            Math.max(0, entry.minutesEarlyLeave || 0),
            scope,
            gradesById,
            sectionsById,
            classroomsById,
            policy,
            studentsById
          )
        );
      }
    }
  }

  return incidents;
}

