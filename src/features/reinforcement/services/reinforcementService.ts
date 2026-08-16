
import { getStructureTreeSnapshot } from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  CreateReinforcementStagePayload,
  CreateReinforcementTaskPayload,
  ReinforcementAssignmentScope,
  ReinforcementFilterOptions,
  ReinforcementScopeOption,
  ReinforcementStage,
  ReinforcementTask,
  ReinforcementTaskFilters,
  ReinforcementTaskTarget,
  ReinforcementTaskTargetInput,
} from "../types/reinforcement";

const clone = <T,>(value: T): T => {
  if (typeof value === "undefined") {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
};
const now = new Date();
const dateFromNow = (days: number) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  return value;
};
const isoFromNow = (days: number) => dateFromNow(days).toISOString();
const dateOnlyFromNow = (days: number) => isoFromNow(days).slice(0, 10);
const structure = getStructureTreeSnapshot("year-2", "term-2-2");
const stagesById = new Map(structure.stages.map((item) => [item.id, item]));
const gradesById = new Map(structure.grades.map((item) => [item.id, item]));
const sectionsById = new Map(structure.sections.map((item) => [item.id, item]));
const classroomsById = new Map(structure.classrooms.map((item) => [item.id, item]));

const schoolTarget = { id: "school-main", nameAr: "المدرسة بالكامل", nameEn: "Whole School" };

interface StudentSeed {
  studentId: string;
  studentName: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  classId: string;
  className: string;
}

const createStage = (
  id: string,
  titleEn: string,
  titleAr: string,
  proofType: ReinforcementStage["proofType"],
  overrides: Partial<ReinforcementStage> = {},
): ReinforcementStage => ({ id, titleEn, titleAr, proofType, isCompleted: false, isApproved: false, ...overrides });

const classNameFor = (gradeId: string, sectionId: string) => {
  const grade = gradesById.get(gradeId);
  const section = sectionsById.get(sectionId);
  return `${grade?.nameEn || gradeId} - ${section?.nameEn || sectionId}`;
};

const studentSeeds: StudentSeed[] = [
  { studentId: "STD-1001", studentName: "Ahmed Hassan", stageId: "stage-2", gradeId: "grade-5", sectionId: "section-7", classroomId: "classroom-9", classId: "classroom-9", className: classNameFor("grade-5", "section-7") },
  { studentId: "STD-1002", studentName: "Sara Mohammed", stageId: "stage-2", gradeId: "grade-4", sectionId: "section-5", classroomId: "classroom-6", classId: "classroom-6", className: classNameFor("grade-4", "section-5") },
  { studentId: "STD-1003", studentName: "Omar Abdullah", stageId: "stage-2", gradeId: "grade-6", sectionId: "section-9", classroomId: "classroom-11", classId: "classroom-11", className: classNameFor("grade-6", "section-9") },
  { studentId: "STD-1004", studentName: "Fatima Khalid", stageId: "stage-1", gradeId: "grade-1", sectionId: "section-1", classroomId: "classroom-1", classId: "classroom-1", className: classNameFor("grade-1", "section-1") },
  { studentId: "STD-1005", studentName: "Layla Salem", stageId: "stage-2", gradeId: "grade-5", sectionId: "section-8", classroomId: "classroom-10", classId: "classroom-10", className: classNameFor("grade-5", "section-8") },
  { studentId: "STD-1006", studentName: "Noura Mariam", stageId: "stage-3", gradeId: "grade-7", sectionId: "section-11", classroomId: "classroom-13", classId: "classroom-13", className: classNameFor("grade-7", "section-11") },
];

const countStudents = (predicate: (student: StudentSeed) => boolean) => studentSeeds.filter(predicate).length;

const makeStudentTarget = (student: StudentSeed): ReinforcementTaskTarget => {
  const stage = stagesById.get(student.stageId);
  const grade = gradesById.get(student.gradeId);
  const section = sectionsById.get(student.sectionId);
  const classroom = classroomsById.get(student.classroomId);
  return {
    scopeType: "student",
    scopeId: student.studentId,
    nameAr: student.studentName,
    nameEn: student.studentName,
    stageId: student.stageId,
    stageNameAr: stage?.nameAr,
    stageNameEn: stage?.nameEn,
    gradeId: student.gradeId,
    gradeNameAr: grade?.nameAr,
    gradeNameEn: grade?.nameEn,
    sectionId: student.sectionId,
    sectionNameAr: section?.nameAr,
    sectionNameEn: section?.nameEn,
    classroomId: student.classroomId,
    classroomNameAr: classroom?.nameAr,
    classroomNameEn: classroom?.nameEn,
    audienceCount: 1,
  };
};

const scopeOption = (scopeType: ReinforcementAssignmentScope, value: string, nameAr: string, nameEn: string, audienceCount: number, searchText?: string): ReinforcementScopeOption => ({ value, scopeType, nameAr, nameEn, audienceCount, searchText });

const scopeTargets: Record<ReinforcementAssignmentScope, ReinforcementScopeOption[]> = {
  school: [scopeOption("school", schoolTarget.id, schoolTarget.nameAr, schoolTarget.nameEn, studentSeeds.length)],
  stage: structure.stages.map((item) => scopeOption("stage", item.id, item.nameAr, item.nameEn, countStudents((student) => student.stageId === item.id))),
  grade: structure.grades.map((item) => scopeOption("grade", item.id, item.nameAr, item.nameEn, countStudents((student) => student.gradeId === item.id))),
  section: structure.sections.map((item) => { const grade = gradesById.get(item.gradeId); return scopeOption("section", item.id, `${grade?.nameAr || ""} - ${item.nameAr}`.trim(), `${grade?.nameEn || ""} - ${item.nameEn}`.trim(), countStudents((student) => student.sectionId === item.id)); }),
  classroom: structure.classrooms.map((item) => { const section = sectionsById.get(item.sectionId); const grade = section ? gradesById.get(section.gradeId) : undefined; return scopeOption("classroom", item.id, `${grade?.nameAr || ""} - ${item.nameAr}`.trim(), `${grade?.nameEn || ""} - ${item.nameEn}`.trim(), countStudents((student) => student.classroomId === item.id)); }),
  student: studentSeeds.map((item) => scopeOption("student", item.studentId, item.studentName, item.studentName, 1, `${item.studentName} ${item.className}`)),
};

const targetLookup = new Map<string, ReinforcementTaskTarget>();
const putTarget = (target: ReinforcementTaskTarget) => targetLookup.set(`${target.scopeType}:${target.scopeId}`, target);
putTarget({ scopeType: "school", scopeId: schoolTarget.id, nameAr: schoolTarget.nameAr, nameEn: schoolTarget.nameEn, audienceCount: studentSeeds.length });
structure.stages.forEach((item) => putTarget({ scopeType: "stage", scopeId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, stageId: item.id, stageNameAr: item.nameAr, stageNameEn: item.nameEn, audienceCount: countStudents((student) => student.stageId === item.id) }));
structure.grades.forEach((item) => { const stage = stagesById.get(item.stageId); putTarget({ scopeType: "grade", scopeId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, stageId: item.stageId, stageNameAr: stage?.nameAr, stageNameEn: stage?.nameEn, gradeId: item.id, gradeNameAr: item.nameAr, gradeNameEn: item.nameEn, audienceCount: countStudents((student) => student.gradeId === item.id) }); });
structure.sections.forEach((item) => { const grade = gradesById.get(item.gradeId); const stage = grade ? stagesById.get(grade.stageId) : undefined; putTarget({ scopeType: "section", scopeId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, stageId: stage?.id, stageNameAr: stage?.nameAr, stageNameEn: stage?.nameEn, gradeId: grade?.id, gradeNameAr: grade?.nameAr, gradeNameEn: grade?.nameEn, sectionId: item.id, sectionNameAr: item.nameAr, sectionNameEn: item.nameEn, audienceCount: countStudents((student) => student.sectionId === item.id) }); });
structure.classrooms.forEach((item) => { const section = sectionsById.get(item.sectionId); const grade = section ? gradesById.get(section.gradeId) : undefined; const stage = grade ? stagesById.get(grade.stageId) : undefined; putTarget({ scopeType: "classroom", scopeId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, stageId: stage?.id, stageNameAr: stage?.nameAr, stageNameEn: stage?.nameEn, gradeId: grade?.id, gradeNameAr: grade?.nameAr, gradeNameEn: grade?.nameEn, sectionId: section?.id, sectionNameAr: section?.nameAr, sectionNameEn: section?.nameEn, classroomId: item.id, classroomNameAr: item.nameAr, classroomNameEn: item.nameEn, audienceCount: countStudents((student) => student.classroomId === item.id) }); });
studentSeeds.forEach((item) => putTarget(makeStudentTarget(item)));

const summarizeTargets = (targets: ReinforcementTaskTarget[], locale: "ar" | "en") => {
  const names = targets.map((target) => (locale === "ar" ? target.nameAr : target.nameEn));
  if (names.length === 0) return locale === "ar" ? "بدون جمهور" : "No audience";
  if (names.length === 1) return names[0] || "";
  if (names.length === 2) return `${names[0]}, ${names[1]}`;
  return locale === "ar" ? `${names[0]}, ${names[1]} +${names.length - 2}` : `${names[0]}, ${names[1]} +${names.length - 2} more`;
};

const audienceCountFor = (targets: ReinforcementTaskTarget[]) => targets.reduce((sum, target) => sum + (target.audienceCount || 1), 0);

const applyTargetFields = (task: Omit<ReinforcementTask, "targets" | "primaryTargetType" | "primaryTargetId" | "targetSummaryAr" | "targetSummaryEn" | "audienceCount" | "studentId" | "studentName" | "classId" | "className"> & { targets: ReinforcementTaskTarget[] }): ReinforcementTask => {
  const primaryTarget = task.targets[0];
  const student = primaryTarget?.scopeType === "student" && task.targets.length === 1 ? studentSeeds.find((item) => item.studentId === primaryTarget.scopeId) : undefined;
  return {
    ...task,
    primaryTargetType: primaryTarget?.scopeType || "student",
    primaryTargetId: primaryTarget?.scopeId || "",
    targetSummaryAr: summarizeTargets(task.targets, "ar"),
    targetSummaryEn: summarizeTargets(task.targets, "en"),
    audienceCount: audienceCountFor(task.targets),
    studentId: student?.studentId,
    studentName: student?.studentName,
    classId: student?.classId,
    className: student?.className,
  };
};

const resolveTargets = (inputs: ReinforcementTaskTargetInput[]) => {
  if (inputs.length === 0) throw new Error("targets_required");
  const scopeType = inputs[0]?.scopeType;
  if (!inputs.every((item) => item.scopeType === scopeType)) throw new Error("mixed_scope_types");
  const seen = new Set<string>();
  return inputs.map((input) => {
    const key = `${input.scopeType}:${input.scopeId}`;
    if (seen.has(key)) throw new Error("duplicate_targets");
    seen.add(key);
    const target = targetLookup.get(key);
    if (!target) throw new Error("target_not_found");
    return clone(target);
  });
};
const studentTarget = (index: number) => [makeStudentTarget(studentSeeds[index])];
const clonedTargets = (...keys: string[]) => keys.map((key) => clone(targetLookup.get(key)!));
const seedTask = (task: Omit<ReinforcementTask, "primaryTargetType" | "primaryTargetId" | "targetSummaryAr" | "targetSummaryEn" | "audienceCount" | "studentId" | "studentName" | "classId" | "className">) => applyTargetFields(task);

const mapStagePayloads = (
  taskId: string,
  stages: CreateReinforcementStagePayload[],
): ReinforcementStage[] =>
  stages.map((stage, index) =>
    createStage(
      `${taskId}-ST-${index + 1}`,
      stage.titleEn,
      stage.titleAr,
      stage.proofType,
      {
        descriptionAr: stage.descriptionAr,
        descriptionEn: stage.descriptionEn,
      },
    ),
  );

let tasksStore: ReinforcementTask[] = [
  seedTask({ id: "RT-1001", titleAr: "قيادة ركن القراءة", titleEn: "Lead the Reading Corner", descriptionAr: "تنظيم ركن القراءة.", descriptionEn: "Organize the reading corner.", targets: studentTarget(4), source: "teacher", status: "in_progress", rewardType: "badge", rewardValue: "Reading Star Badge", dueDate: dateOnlyFromNow(2), assignedById: "EMP-201", assignedByName: "Ms. Huda", createdAt: isoFromNow(-8), updatedAt: isoFromNow(-1), stages: [createStage("RT-1001-ST-1", "Prepare board", "إعداد اللوحة", "image", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-7), proofUrl: "/proofs/reading-board.jpg" }), createStage("RT-1001-ST-2", "Facilitate session", "تنفيذ الجلسة", "video", { isCompleted: true, isApproved: false, submittedAt: isoFromNow(-1), proofUrl: "/proofs/reading-session.mp4" })] }),
  seedTask({ id: "RT-1002", titleAr: "مبادرة النظام الصباحي", titleEn: "Morning Routine Initiative", descriptionAr: "مهمة صباحية قصيرة.", descriptionEn: "A short morning routine task.", targets: studentTarget(0), source: "system", status: "not_completed", rewardType: "xp", rewardValue: "100 XP", dueDate: dateOnlyFromNow(4), assignedById: "SYS-001", assignedByName: "Behavior Engine", createdAt: isoFromNow(-5), updatedAt: isoFromNow(-2), stages: [createStage("RT-1002-ST-1", "Attendance streak", "سلسلة الحضور", "none", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-4) }), createStage("RT-1002-ST-2", "Uniform check", "فحص الزي", "image"), createStage("RT-1002-ST-3", "Reflection note", "ملاحظة انعكاسية", "document")] }),
  seedTask({ id: "RT-1003", titleAr: "مساعدة زميل أكاديميا", titleEn: "Academic Peer Support", descriptionAr: "دعم زميل في الرياضيات.", descriptionEn: "Support a peer in math.", targets: studentTarget(1), source: "teacher", status: "completed", rewardType: "moral", rewardValue: "Recognition Certificate", dueDate: dateOnlyFromNow(-4), assignedById: "EMP-102", assignedByName: "Mr. Kareem", createdAt: isoFromNow(-14), updatedAt: isoFromNow(-3), stages: [createStage("RT-1003-ST-1", "Plan support", "تخطيط الدعم", "document", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-13) }), createStage("RT-1003-ST-2", "Deliver support", "تنفيذ الدعم", "image", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-8), proofUrl: "/proofs/support.jpg" })] }),
  seedTask({ id: "RT-1004", titleAr: "تحدي قيادة شعب الصف السابع", titleEn: "Grade 7 Section Leadership Challenge", descriptionAr: "مهمة لشعب الصف السابع.", descriptionEn: "A task for Grade 7 sections.", targets: clonedTargets("section:section-7", "section:section-8"), source: "parent", status: "in_progress", rewardType: "badge", rewardValue: "Leader Badge", dueDate: dateOnlyFromNow(5), assignedById: "PAR-501", assignedByName: "Parent Portal", createdAt: isoFromNow(-6), updatedAt: isoFromNow(-2), stages: [createStage("RT-1004-ST-1", "Prep checklist", "قائمة التحضير", "document", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-5) }), createStage("RT-1004-ST-2", "Lead line-up", "قيادة الاصطفاف", "video", { isCompleted: true, isApproved: false, submittedAt: isoFromNow(-2), proofUrl: "/proofs/lineup.mp4" })] }),
  seedTask({ id: "RT-1005", titleAr: "تحدي الانضباط للمرحلة المتوسطة", titleEn: "Middle School Discipline Challenge", descriptionAr: "مهمة للصفين السادس والسابع.", descriptionEn: "A task for Grades 6 and 7.", targets: clonedTargets("grade:grade-4", "grade:grade-5"), source: "system", status: "not_completed", rewardType: "financial", rewardValue: "25 SAR voucher", dueDate: dateOnlyFromNow(-2), assignedById: "SYS-001", assignedByName: "Behavior Engine", createdAt: isoFromNow(-11), updatedAt: isoFromNow(-2), stages: [createStage("RT-1005-ST-1", "Attendance proof", "إثبات الحضور", "image", { isCompleted: true, isApproved: false, submittedAt: isoFromNow(-3), proofUrl: "/proofs/attendance.jpg" })] }),
  seedTask({ id: "RT-1006", titleAr: "دعم معامل العلوم", titleEn: "Support the Science Labs", descriptionAr: "مهمة لعدة فصول.", descriptionEn: "A task for multiple classrooms.", targets: clonedTargets("classroom:classroom-11", "classroom:classroom-13"), source: "teacher", status: "cancelled", rewardType: "moral", rewardValue: "Principal appreciation", dueDate: dateOnlyFromNow(-8), assignedById: "EMP-333", assignedByName: "Mr. Sameh", createdAt: isoFromNow(-20), updatedAt: isoFromNow(-6), stages: [createStage("RT-1006-ST-1", "Collect materials", "جمع المواد", "image", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-18) }), createStage("RT-1006-ST-2", "Setup support", "المساعدة في التجهيز", "video", { isCompleted: true, isApproved: true, submittedAt: isoFromNow(-12) })] }),
];


const getCompletedStages = (task: ReinforcementTask) => task.stages.filter((stage) => stage.isCompleted).length;
const getCompletionRate = (task: ReinforcementTask) => task.stages.length === 0 ? 0 : (getCompletedStages(task) / task.stages.length) * 100;


export async function getReinforcementSummaryCard() {
  const inProgress = tasksStore.filter((task) => task.status === "in_progress").length;
  const notCompleted = tasksStore.filter((task) => task.status === "not_completed").length;
  const completionRate = tasksStore.reduce((sum, task) => sum + getCompletionRate(task), 0) / Math.max(tasksStore.length, 1);
  return clone({ inProgress, notCompleted, completionRate: Number(completionRate.toFixed(1)) });
}

export async function getReinforcementFilterOptions(): Promise<ReinforcementFilterOptions> {
  return clone({ students: studentSeeds.map((student) => ({ studentId: student.studentId, studentName: student.studentName })), classes: [...new Set(studentSeeds.map((student) => student.className))], scopeTargets });
}

export async function getReinforcementTasks(filters: ReinforcementTaskFilters = {}): Promise<ReinforcementTask[]> {
  const search = filters.search?.trim().toLowerCase();
  const tasks = tasksStore.filter((task) => {
    if (search) {
      const haystack = [task.id, task.studentName, task.className, task.titleEn, task.titleAr, task.assignedByName, task.targetSummaryEn, task.targetSummaryAr, ...task.targets.flatMap((target) => [target.nameEn, target.nameAr])].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.assignmentScope && filters.assignmentScope !== "all" && task.primaryTargetType !== filters.assignmentScope) return false;
    if (filters.targetId && !task.targets.some((target) => target.scopeId === filters.targetId)) return false;
    if (filters.student && task.studentId !== filters.student) return false;
    if (filters.className && task.className !== filters.className) return false;
    if (filters.source && filters.source !== "all" && task.source !== filters.source) return false;
    if (filters.status && filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.rewardType && filters.rewardType !== "all" && task.rewardType !== filters.rewardType) return false;
    if (filters.dueDate && task.dueDate !== filters.dueDate) return false;
    return true;
  });
  return clone(tasks);
}

export async function getReinforcementTaskById(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  return task ? clone(task) : null;
}

export async function duplicateTask(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;
  const duplicate = applyTargetFields({ ...clone(task), id: `RT-${1000 + tasksStore.length + 1}`, status: "not_completed", createdAt: now.toISOString(), updatedAt: now.toISOString(), targets: task.targets.map((target) => clone(target)), stages: task.stages.map((stage, index) => ({ ...stage, id: `${task.id}-COPY-ST-${index + 1}`, isCompleted: false, isApproved: false, submittedAt: undefined, proofUrl: undefined })) });
  tasksStore = [duplicate, ...tasksStore];
  return clone(duplicate);
}

export async function createReinforcementTask(payload: CreateReinforcementTaskPayload): Promise<ReinforcementTask> {
  const taskId = `RT-${1000 + tasksStore.length + 1}`;
  const task = applyTargetFields({ id: taskId, titleAr: payload.titleAr, titleEn: payload.titleEn, descriptionAr: payload.descriptionAr, descriptionEn: payload.descriptionEn, targets: resolveTargets(payload.targets), source: payload.source, status: "not_completed", rewardType: payload.rewardType, rewardValue: payload.rewardValue, dueDate: payload.dueDate, assignedById: payload.assignedById, assignedByName: payload.assignedByName, createdAt: now.toISOString(), updatedAt: now.toISOString(), stages: mapStagePayloads(taskId, payload.stages) });
  tasksStore = [task, ...tasksStore];
  return clone(task);
}

export async function cancelTask(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;
  const nextTask: ReinforcementTask = { ...task, status: "cancelled", updatedAt: now.toISOString() };
  tasksStore = tasksStore.map((item) => (item.id === taskId ? nextTask : item));
  return clone(nextTask);
}
