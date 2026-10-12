"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type { useHomeworkImportBatch } from "../hooks/useHomeworkImportBatch";
import { homeworkBatchPlan } from "../utils/homeworkImportBatchTargets";
import { teacherClassroomIds, teacherSubjectIds, teacherTargetOptions } from "../utils/homeworkImportTeacherTargets";

type TeacherTargetsState = Pick<ReturnType<typeof useHomeworkImportBatch>, "context" | "academicYearId" | "termId" | "subjectId" | "setSubjectId" | "selection" | "setSelection">;

export default function HomeworkImportTeacherTargets({ batch }: { batch: TeacherTargetsState }) {
  const t = useTranslations("academics.homework.importBatch");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  if (!batch.context || batch.selection.type !== "teacher") return null;
  const context = batch.context;
  const selection = batch.selection;
  const { academicYearId, termId, subjectId } = batch;
  const teachers = teacherTargetOptions(context, termId);
  const subjectIds = teacherSubjectIds(context, termId, selection.teacherUserId);
  const subjects = context.subjects.filter(subject => subjectIds.includes(subject.id));
  const candidates = homeworkBatchPlan({ context, academicYearId, termId, subjectId, locale, selection: { ...selection, excludedClassroomIds: [] } }).rows;
  const eligibleIds = candidates.filter(row => row.eligible).map(row => row.classroomId);
  const selectedCount = eligibleIds.filter(id => !selection.excludedClassroomIds.includes(id)).length;
  const choices = candidates.filter(row => `${row.classroomName} ${row.hierarchy}`.toLowerCase().includes(search.trim().toLowerCase()));

  function selectTeacher(teacherUserId: string) {
    const allowed = teacherSubjectIds(context, termId, teacherUserId);
    const nextSubject = allowed.includes(subjectId) && context.subjects.some(subject => subject.id === subjectId) ? subjectId : "";
    batch.setSubjectId(nextSubject);
    batch.setSelection({ type: "teacher", teacherUserId, classroomIds: teacherClassroomIds(context, termId, nextSubject, teacherUserId), excludedClassroomIds: [] });
    setSearch("");
  }

  function selectSubject(nextSubject: string) {
    batch.setSubjectId(nextSubject);
    batch.setSelection({ ...selection, classroomIds: teacherClassroomIds(context, termId, nextSubject, selection.teacherUserId), excludedClassroomIds: [] });
    setSearch("");
  }

  function toggleClass(id: string) {
    const excluded = selection.excludedClassroomIds;
    batch.setSelection({ ...selection, excludedClassroomIds: excluded.includes(id) ? excluded.filter(value => value !== id) : [...excluded, id] });
  }

  return <div className="min-w-0 space-y-4">
    <p className="text-sm text-gray-600">{t("teacherHelp")}</p>
    <div className="grid gap-4 md:grid-cols-2 [&>div]:min-w-0">
      <Select label={t("chooseTeacherLabel")} placeholder={t("chooseTeacher")} searchable options={teachers} value={selection.teacherUserId} onChange={selectTeacher} />
      <Select label={t("subject")} placeholder={t("chooseSubject")} searchable disabled={!selection.teacherUserId} options={subjects.map(subject => ({ value: subject.id, label: (locale === "ar" ? subject.nameAr || subject.nameEn : subject.nameEn || subject.nameAr) || subject.name }))} value={subjectId} onChange={selectSubject} />
    </div>
    {!teachers.length && <p role="status" className="text-sm">{t("noTeachers")}</p>}
    {selection.teacherUserId && !subjects.length && <p role="status" className="text-sm">{t("noTeacherSubjects")}</p>}
    {selection.teacherUserId && subjectId && <>
      <Input label={t("searchClasses")} value={search} onChange={event => setSearch(event.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm" aria-live="polite">{t("selected", { count: selectedCount })}</p>
        <Button variant="outline" size="sm" className="min-h-11" disabled={!eligibleIds.length} onClick={() => batch.setSelection({ ...selection, excludedClassroomIds: selection.classroomIds.filter(id => !eligibleIds.includes(id)) })}>{t("selectAllTeacherClasses")}</Button>
        <Button variant="outline" size="sm" className="min-h-11" disabled={!selectedCount} onClick={() => batch.setSelection({ ...selection, excludedClassroomIds: [...selection.classroomIds] })}>{t("clearTeacherClasses")}</Button>
      </div>
      {!candidates.length && <p role="status" className="text-sm">{t("noTeacherClasses")}</p>}
      {!!candidates.length && !eligibleIds.length && <p role="status" className="text-sm">{t("noEligibleTeacherClasses")}</p>}
      <div className="grid max-h-64 gap-3 overflow-y-auto sm:grid-cols-2">{choices.map(row => <Checkbox key={row.classroomId} label={row.classroomName || t("unavailable")} description={`${row.hierarchy} · ${row.eligible ? t("teacherStudents", { count: row.studentCount }) : t(`skips.${row.skipReason}`)}`} disabled={!row.eligible} checked={row.eligible && !selection.excludedClassroomIds.includes(row.classroomId)} onChange={() => toggleClass(row.classroomId)} />)}</div>
    </>}
  </div>;
}
