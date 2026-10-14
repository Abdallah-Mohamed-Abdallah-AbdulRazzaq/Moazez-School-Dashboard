"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { useHomeworkImportBatch } from "../hooks/useHomeworkImportBatch";
import type { HomeworkBatchSelection } from "../utils/homeworkImportBatch.types";
import HomeworkImportTeacherTargets from "./HomeworkImportTeacherTargets";

type BatchTargetsState = Pick<ReturnType<typeof useHomeworkImportBatch>, "context" | "academicYearId" | "termId" | "subjectId" | "setSubjectId" | "selection" | "setSelection" | "saving" | "loading">;
type NamedGroup = { id: string; name?: string; nameEn?: string; nameAr?: string; gradeId?: string; stageId?: string };

function localizedLabel(locale: string, entry: NamedGroup) {
  return locale === "ar" ? entry.nameAr || entry.nameEn || entry.name || "" : entry.nameEn || entry.nameAr || entry.name || "";
}

function groupLabel(locale: string, group: NamedGroup, structure: StructureTree) {
  const grade = structure.grades.find(entry => entry.id === group.gradeId);
  const stage = structure.stages.find(entry => entry.id === (grade?.stageId ?? group.stageId));
  return [stage, grade, group].filter(entry => entry !== undefined).map(entry => localizedLabel(locale, entry)).join(" / ");
}

function classroomChoices(locale: string, structure?: StructureTree) {
  return (structure?.classrooms ?? []).map(room => ({
    id: room.id, name: localizedLabel(locale, room),
    hierarchy: structure ? groupLabel(locale, structure.sections.find(section => section.id === room.sectionId) ?? room, structure) : "",
  }));
}

export default function HomeworkImportBatchTargets({ batch, writable }: { batch: BatchTargetsState; writable: boolean }) {
  const t = useTranslations("academics.homework.importBatch");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const selection = batch.selection;
  const structure = batch.context?.structure;
  const groups = selection.type === "section" ? structure?.sections : selection.type === "grade" ? structure?.grades : selection.type === "stage" ? structure?.stages : [];
  const choices = classroomChoices(locale, structure).filter(room => `${room.name} ${room.hierarchy}`.toLowerCase().includes(search.trim().toLowerCase()));
  const scopeSelections: Record<string, HomeworkBatchSelection> = { classes: { type: "classes", classroomIds: [] }, teacher: { type: "teacher", teacherUserId: "", classroomIds: [], excludedClassroomIds: [] }, section: { type: "section", id: "" }, grade: { type: "grade", id: "" }, stage: { type: "stage", id: "" }, school: { type: "school" } };
  const toggleClass = (id: string) => {
    if (selection.type !== "classes") return;
    const ids = selection.classroomIds;
    batch.setSelection({ type: "classes", classroomIds: ids.includes(id) ? ids.filter(selected => selected !== id) : [...ids, id] });
  };
  return <fieldset disabled={batch.saving || batch.loading || !writable} className="min-w-0 space-y-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 [&_[aria-haspopup=listbox]]:box-border! [&_[aria-haspopup=listbox]]:min-w-0! [&_[aria-haspopup=listbox]]:max-w-full!">
    <div className="grid gap-4 md:grid-cols-2 [&>div]:min-w-0">
      {selection.type !== "teacher" && <Select label={t("subject")} placeholder={t("chooseSubject")} searchable searchPlaceholder={t("searchGroups")} value={batch.subjectId} onChange={batch.setSubjectId} options={(batch.context?.subjects ?? []).map(subject => ({ value: subject.id, label: localizedLabel(locale, subject) }))} />}
      <Select label={t("scope")} value={selection.type} onChange={type => batch.setSelection(scopeSelections[type])} options={Object.keys(scopeSelections).map(type => ({ value: type, label: t(`scopes.${type}`) }))} />
    </div>
    {selection.type === "teacher" && <HomeworkImportTeacherTargets batch={batch} />}
    {structure && selection.type !== "classes" && selection.type !== "school" && selection.type !== "teacher" && <Select label={t(`scopes.${selection.type}`)} placeholder={t("chooseGroup")} searchable searchPlaceholder={t("searchGroups")} value={selection.id} options={(groups ?? []).map(group => ({ value: group.id, label: groupLabel(locale, group, structure) }))} onChange={id => batch.setSelection({ type: selection.type, id })} />}
    {selection.type === "classes" && <>
      <Input label={t("searchClasses")} value={search} onChange={event => setSearch(event.target.value)} />
      <p className="text-sm">{t("selected", { count: selection.classroomIds.length })}</p>
      <div className="grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">{choices.map(room => <Checkbox key={room.id} className="min-h-16 bg-white" label={room.name || t("unavailable")} description={room.hierarchy} checked={selection.classroomIds.includes(room.id)} onChange={() => toggleClass(room.id)} />)}</div>
    </>}
  </fieldset>;
}
