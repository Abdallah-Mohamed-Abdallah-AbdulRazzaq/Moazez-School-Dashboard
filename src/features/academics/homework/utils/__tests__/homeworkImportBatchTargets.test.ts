import { expect, it } from "vitest";
import { homeworkBatchPlan, homeworkBatchPayload } from "../homeworkImportBatchTargets";
import type { HomeworkBatchSelection } from "../homeworkImportBatch.types";
import { batchContext, batchIds, batchMetadata } from "./homeworkImportBatchFixtures";

const request = () => ({ academicYearId: batchIds.year, termId: batchIds.term, subjectId: batchIds.subject, context: batchContext(), locale: "en" });

it.each([
  [{ type: "classes", classroomIds: [batchIds.classB, batchIds.classA, batchIds.classA] }, [batchIds.classA, batchIds.classB]],
  [{ type: "section", id: batchIds.sectionA }, [batchIds.classA]],
  [{ type: "grade", id: batchIds.gradeA }, [batchIds.classA, batchIds.classB]],
  [{ type: "stage", id: batchIds.stageA }, [batchIds.classA, batchIds.classB, batchIds.classC]],
  [{ type: "school" }, [batchIds.classA, batchIds.classB, batchIds.classC, batchIds.classD]],
] satisfies Array<[HomeworkBatchSelection, string[]]>)("expands %j to exactly its unique classrooms", (selection, expected) => {
  const plan = homeworkBatchPlan({ ...request(), selection });
  expect(plan.rows.map(row => row.classroomId).sort()).toEqual([...expected].sort());
  expect(plan.rows.every(row => row.eligible)).toBe(true);
});

it.each(["missingAllocation", "missingTeacher", "ambiguousAllocation", "noStudents", "invalidStructure"] as const)("explains %s while retaining eligible classes", (reason) => {
  const input = request();
  if (reason === "missingAllocation") input.context.allocations[0].subjectId = batchIds.otherSubject;
  if (reason === "missingTeacher") input.context.allocations[0].teacherId = null;
  if (reason === "ambiguousAllocation") input.context.allocations.push({ ...input.context.allocations[0], id: batchIds.allocationB, teacherId: batchIds.teacherB });
  if (reason === "noStudents") input.context.enrollments[0].status = "withdrawn";
  if (reason === "invalidStructure") input.context.structure.sections = input.context.structure.sections.slice(1);
  const plan = homeworkBatchPlan({ ...input, selection: { type: "classes", classroomIds: [batchIds.classA, batchIds.classB] } });
  expect(plan.rows.find(row => row.classroomId === batchIds.classA)).toMatchObject({ eligible: false, skipReason: reason });
  expect(plan.rows.find(row => row.classroomId === batchIds.classB)).toMatchObject({ eligible: true, allocationId: batchIds.allocationB, teacherUserId: batchIds.teacherB });
});

it("excludes another term and year, deduplicates records, and never uses names as identifiers", () => {
  const input = request();
  input.context.structure.classrooms[1].nameEn = input.context.structure.classrooms[0].nameEn;
  input.context.allocations.push({ ...input.context.allocations[0] });
  input.context.enrollments.push({ ...input.context.enrollments[0] });
  input.context.allocations[1].termId = "another-term";
  input.context.enrollments[2].academicYearId = "another-year";
  const plan = homeworkBatchPlan({ ...input, selection: { type: "school" } });
  expect(plan.rows.find(row => row.classroomId === batchIds.classA)).toMatchObject({ eligible: true, studentCount: 1 });
  expect(plan.rows.find(row => row.classroomId === batchIds.classB)).toMatchObject({ eligible: false, skipReason: "missingAllocation" });
  expect(plan.rows.find(row => row.classroomId === batchIds.classC)).toMatchObject({ eligible: false, skipReason: "noStudents" });
});

it("keeps stale selected class IDs visible as skipped rather than substituting another class", () => {
  const plan = homeworkBatchPlan({ ...request(), selection: { type: "classes", classroomIds: ["deleted-class", batchIds.classA] } });
  expect(plan.rows.find(row => row.classroomId === "deleted-class")).toMatchObject({ eligible: false, skipReason: "missingClass" });
  expect(plan.rows).toHaveLength(2);
});

it("requires renewed review for ownership or eligibility changes but not translated labels", () => {
  const input = { ...request(), selection: { type: "school" } as const };
  const original = homeworkBatchPlan(input);
  input.context.allocations[0].teacherName = "Renamed Teacher";
  expect(homeworkBatchPlan({ ...input, locale: "ar" }).signature).toBe(original.signature);
  input.context.allocations[0].teacherId = batchIds.teacherB;
  expect(homeworkBatchPlan(input).signature).not.toBe(original.signature);
});

it("constructs only allowed parent fields for the target allocation", () => {
  const plan = homeworkBatchPlan({ ...request(), selection: { type: "school" } });
  const target = plan.rows.find(row => row.classroomId === batchIds.classB);
  if (!target?.eligible) throw new Error("Expected an eligible fixture");
  const payload = homeworkBatchPayload({ plan, target, metadata: { ...batchMetadata, title: " Practice " }, publishAt: "2099-01-01T12:00:00Z" });
  expect(payload).toMatchObject({ title: "Practice", academicYearId: batchIds.year, termId: batchIds.term, teacherSubjectAllocationId: batchIds.allocationB, targetMode: "classroom", publishAt: "2099-01-01T12:00:00Z" });
  const forbidden = ["classroomId", "subjectId", "teacherUserId", "studentIds", "timetableEntryId", "scheduleDate", "source", "rows"];
  expect(Object.keys(payload).filter(key => forbidden.includes(key))).toEqual([]);
});
