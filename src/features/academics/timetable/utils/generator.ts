// Timetable Auto-Generation Algorithm
// Basic heuristic solver - no external dependencies

import { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import { Subject } from "@/features/academics/subjects/services/subjectsService";
import {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import { Room } from "@/features/academics/timetable/types/timetable";
import { ResolvedTimetableConfig, TimetableDay, TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import { RoomDefaultAssignment, resolveDefaultRoomForTarget } from "@/features/academics/rooms/services/roomsService";
import { DEFAULT_SCHOOL_ID } from "@/features/academics/constants/school";

export interface GenerationOptions {
  sectionId: string;
  classroomId?: string;
  gradeId: string;
  termId: string;
  strictMode: boolean; // If true, fail on any conflict
  distributeEvenly: boolean; // Try to distribute subjects across days
  avoidConsecutive: boolean; // Avoid same subject in consecutive periods
  excludeDays: string[]; // Day keys to exclude (holidays, weekends)
}

export interface GenerationResult {
  success: boolean;
  entries: TimetableEntry[];
  unresolved: Array<{
    subjectId: string;
    subjectName: string;
    required: number;
    placed: number;
  }>;
  conflicts: Array<{
    type: "TEACHER" | "ROOM";
    dayKey: string;
    periodIndex: number;
    message: string;
  }>;
  message: string;
}

interface SlotCandidate {
  dayKey: string;
  periodIndex: number;
  score: number; // Higher is better
}

/**
 * Main generation function
 */
export async function generateTimetable(
  options: GenerationOptions,
  subjects: Subject[],
  subjectAllocations: SubjectAllocation[],
  teacherAllocations: TeacherAllocation[],
  teachers: Teacher[],
  rooms: Room[],
  roomDefaults: RoomDefaultAssignment[],
  existingEntries: TimetableEntry[], // All entries in term for conflict checking
  config: ResolvedTimetableConfig // Configuration for days and periods
): Promise<GenerationResult> {
  const {
    sectionId,
    classroomId,
    gradeId,
    termId,
    strictMode,
    distributeEvenly,
    avoidConsecutive,
    excludeDays,
  } = options;

  // Get active days and periods from config
  const activeDays = config.days.filter((d) => d.isActive && !excludeDays.includes(d.key));
  const periods = config.periods.filter(
    (period) => period.isInstructional !== false,
  );

  if (activeDays.length === 0 || periods.length === 0) {
    return {
      success: false,
      entries: [],
      unresolved: [],
      conflicts: [],
      message: "No active days or periods in configuration",
    };
  }

  // Step 1: Build requirements list for missing periods in this classroom only
  const requirements = buildRequirements({
    gradeId,
    sectionId,
    classroomId,
    subjects,
    subjectAllocations,
    existingEntries,
  });
  
  if (requirements.length === 0) {
    return {
      success: true,
      entries: [],
      unresolved: [],
      conflicts: [],
      message: "Selected classroom already meets weekly hours",
    };
  }

  // Step 2: Sort requirements by difficulty (subjects with fewer hours first for better distribution)
  const sortedRequirements = [...requirements].sort((a, b) => a.hours - b.hours);

  // Step 3: Initialize result
  const generatedEntries: TimetableEntry[] = [];
  const unresolved: GenerationResult["unresolved"] = [];
  const conflicts: GenerationResult["conflicts"] = [];

  // Step 4: Try to place each subject
  for (const req of sortedRequirements) {
    const { subjectId, hours } = req;
    
    // Backend timetable entries require a teacher allocation for the exact classroom.
    const teacherAllocation = teacherAllocations.find(
      (allocation) =>
        allocation.sectionId === sectionId &&
        allocation.classroomId === classroomId &&
        allocation.subjectId === subjectId &&
        Boolean(allocation.teacherId),
    );
    const teacherId = teacherAllocation?.teacherId || null;
    if (!teacherId) {
      const subject = subjects.find((item) => item.id === subjectId);
      unresolved.push({
        subjectId,
        subjectName: subject?.nameEn || subjectId,
        required: hours,
        placed: 0,
      });
      continue;
    }

    const roomId = resolvePreferredRoomId({
      subjectId,
      sectionId,
      classroomId,
      subjects,
      rooms,
      roomDefaults,
    });

    let placed = 0;

    // Try to place required hours
    for (let i = 0; i < hours; i++) {
      const slot = findBestSlot({
        subjectId,
        teacherId,
        roomId,
        sectionId,
        classroomId,
        termId,
        generatedEntries,
        existingEntries,
        activeDays,
        periods,
        distributeEvenly,
        avoidConsecutive,
        strictMode,
      });

      if (slot) {
        // Place the entry
        const entry: TimetableEntry = {
          id: `gen-${Date.now()}-${Math.random()}`,
          termId,
          sectionId,
          classroomId,
          dayKey: slot.dayKey,
          periodIndex: slot.periodIndex,
          subjectId,
          teacherId,
          roomId,
          status: "DRAFT",
        };

        generatedEntries.push(entry);
        placed++;
      } else {
        // Could not place this hour
        if (strictMode) {
          // In strict mode, fail immediately
          const subject = subjects.find((s) => s.id === subjectId);
          return {
            success: false,
            entries: [],
            unresolved: [],
            conflicts: [],
            message: `Failed to place all hours for ${subject?.nameEn || subjectId}. Only placed ${placed}/${hours}.`,
          };
        }
        // In relaxed mode, continue
        break;
      }
    }

    // Track unresolved
    if (placed < hours) {
      const subject = subjects.find((s) => s.id === subjectId);
      unresolved.push({
        subjectId,
        subjectName: subject?.nameEn || subjectId,
        required: hours,
        placed,
      });
    }
  }

  // Step 5: Return result
  const success = unresolved.length === 0;
  const message = success
    ? `Successfully generated timetable with ${generatedEntries.length} entries`
    : `Generated ${generatedEntries.length} entries, but ${unresolved.length} subjects have unplaced hours`;

  return {
    success,
    entries: generatedEntries,
    unresolved,
    conflicts,
    message,
  };
}

function resolvePreferredRoomId(params: {
  subjectId: string;
  sectionId: string;
  classroomId?: string;
  subjects: Subject[];
  rooms: Room[];
  roomDefaults: RoomDefaultAssignment[];
}): string | null {
  const explicitDefaultRoom = resolveDefaultRoomForTarget(
    params.rooms,
    params.roomDefaults,
    {
      schoolId: DEFAULT_SCHOOL_ID,
      sectionId: params.sectionId,
      classroomId: params.classroomId,
    }
  );

  if (explicitDefaultRoom?.isActive) {
    return explicitDefaultRoom.id;
  }

  return (
    params.rooms.find((room) => room.isActive)?.id ||
    null
  );
}

/**
 * Build list of subject requirements from allocations
 */
function buildRequirements(
  params: {
    gradeId: string;
    sectionId: string;
    classroomId?: string;
    subjects: Subject[];
    subjectAllocations: SubjectAllocation[];
    existingEntries: TimetableEntry[];
  },
): Array<{ subjectId: string; hours: number }> {
  const requirements: Array<{ subjectId: string; hours: number }> = [];
  const {
    gradeId,
    sectionId,
    classroomId,
    subjects,
    subjectAllocations,
    existingEntries,
  } = params;

  for (const subject of subjects) {
    const allocation = subjectAllocations.find(
      (sa) => sa.gradeId === gradeId && sa.subjectId === subject.id
    );

    if (allocation && allocation.weeklyHours > 0) {
      const scheduledWeeklyHours = existingEntries.filter(
        (entry) =>
          entry.sectionId === sectionId &&
          (entry.classroomId || "") === (classroomId || "") &&
          entry.subjectId === subject.id &&
          entry.slotType !== "BREAK",
      ).length;
      const remainingHours = allocation.weeklyHours - scheduledWeeklyHours;
      if (remainingHours <= 0) {
        continue;
      }

      requirements.push({
        subjectId: subject.id,
        hours: remainingHours,
      });
    }
  }

  return requirements;
}

/**
 * Find the best available slot for a subject
 */
function findBestSlot(params: {
  subjectId: string;
  teacherId: string | null;
  roomId: string | null;
  sectionId: string;
  classroomId?: string;
  termId: string;
  generatedEntries: TimetableEntry[];
  existingEntries: TimetableEntry[];
  activeDays: TimetableDay[];
  periods: TimetablePeriod[];
  distributeEvenly: boolean;
  avoidConsecutive: boolean;
  strictMode: boolean;
}): { dayKey: string; periodIndex: number } | null {
  const {
    subjectId,
    teacherId,
    roomId,
    sectionId,
    classroomId,
    generatedEntries,
    existingEntries,
    activeDays,
    periods,
    distributeEvenly,
    avoidConsecutive,
  } = params;

  const candidates: SlotCandidate[] = [];

  // Check all possible slots
  for (const day of activeDays) {
    for (const period of periods) {
      // Check if slot is available
      if (
        isSlotAvailable(day.key, period.index, sectionId, classroomId, [
          ...generatedEntries,
          ...existingEntries,
        ])
      ) {
        // Check for conflicts
        const hasConflict = checkConflicts(
          day.key,
          period.index,
          teacherId,
          roomId,
          sectionId,
          classroomId,
          [...generatedEntries, ...existingEntries]
        );

        if (hasConflict) continue;

        // Calculate score for this slot
        const score = calculateSlotScore({
          dayKey: day.key,
          periodIndex: period.index,
          subjectId,
          generatedEntries,
          distributeEvenly,
          avoidConsecutive,
          totalPeriods: periods.length,
        });

        candidates.push({ dayKey: day.key, periodIndex: period.index, score });
      }
    }
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);

  // Return best candidate
  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Check if a slot is available (not occupied by this section)
 */
function isSlotAvailable(
  dayKey: string,
  periodIndex: number,
  sectionId: string,
  classroomId: string | undefined,
  entries: TimetableEntry[]
): boolean {
  return !entries.some(
    (e) =>
      e.sectionId === sectionId &&
      (e.classroomId || "") === (classroomId || "") &&
      e.dayKey === dayKey &&
      e.periodIndex === periodIndex
  );
}

/**
 * Check for teacher/room conflicts
 */
function checkConflicts(
  dayKey: string,
  periodIndex: number,
  teacherId: string | null,
  roomId: string | null,
  sectionId: string,
  classroomId: string | undefined,
  allEntries: TimetableEntry[]
): boolean {
  // Check teacher conflict
  if (teacherId) {
    const teacherConflict = allEntries.some(
      (e) =>
        e.dayKey === dayKey &&
        e.periodIndex === periodIndex &&
        e.teacherId === teacherId &&
        (e.sectionId !== sectionId || (e.classroomId || "") !== (classroomId || ""))
    );
    if (teacherConflict) return true;
  }

  // Check room conflict
  if (roomId) {
    const roomConflict = allEntries.some(
      (e) =>
        e.dayKey === dayKey &&
        e.periodIndex === periodIndex &&
        e.roomId === roomId &&
        (e.sectionId !== sectionId || (e.classroomId || "") !== (classroomId || ""))
    );
    if (roomConflict) return true;
  }

  return false;
}

/**
 * Calculate score for a slot (higher is better)
 */
function calculateSlotScore(params: {
  dayKey: string;
  periodIndex: number;
  subjectId: string;
  generatedEntries: TimetableEntry[];
  distributeEvenly: boolean;
  avoidConsecutive: boolean;
  totalPeriods: number;
}): number {
  const { dayKey, periodIndex, subjectId, generatedEntries, distributeEvenly, avoidConsecutive, totalPeriods } = params;

  let score = 100; // Base score

  // Prefer earlier periods (morning)
  score += (totalPeriods - periodIndex) * 2;

  if (distributeEvenly) {
    // Count how many times this subject appears on this day
    const subjectCountOnDay = generatedEntries.filter(
      (e) => e.dayKey === dayKey && e.subjectId === subjectId
    ).length;

    // Penalize if subject already on this day
    score -= subjectCountOnDay * 20;
  }

  if (avoidConsecutive) {
    // Check if same subject in previous period
    const prevPeriod = generatedEntries.find(
      (e) => e.dayKey === dayKey && e.periodIndex === periodIndex - 1 && e.subjectId === subjectId
    );
    if (prevPeriod) score -= 30;

    // Check if same subject in next period
    const nextPeriod = generatedEntries.find(
      (e) => e.dayKey === dayKey && e.periodIndex === periodIndex + 1 && e.subjectId === subjectId
    );
    if (nextPeriod) score -= 30;
  }

  return score;
}
