"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { SetupProgress } from "../SetupProgress";
import {
  createClassroom,
  createGrade,
  createSection,
  createStage,
  updateClassroom,
  updateGrade,
  updateSection,
  updateStage,
  type Grade,
  type Section,
  type Stage,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface AcademicStructureSetupStepCopy {
  summary: string;
  stageTitle: string;
  gradeTitle: string;
  sectionTitle: string;
  classroomTitle: string;
  nameAr: string;
  nameEn: string;
  save: string;
  saving: string;
  required: string;
  saveFailed: string;
  stageCreated: string;
  gradeCreated: string;
  sectionCreated: string;
  classroomCreated: string;
  complete: string;
  progressLabel: string;
  progressText(completed: number, total: number): string;
  stage: string;
  grade: string;
  section: string;
  classroom: string;
  done: string;
  remaining: string;
  manage: string;
}

interface AcademicStructureSetupStepProps {
  copy: AcademicStructureSetupStepCopy;
  yearId: string;
  termId: string;
  tree: StructureTree;
  refreshStep(stepId: "structure"): Promise<void> | void;
}

type NextAction =
  | { type: "stage"; title: string; order: number }
  | { type: "grade"; title: string; stage: Stage; order: number }
  | { type: "section"; title: string; grade: Grade; order: number }
  | { type: "classroom"; title: string; section: Section; order: number }
  | { type: "complete"; title: string };
type EditableNode =
  | { type: "stage"; node: Stage }
  | { type: "grade"; node: Grade }
  | { type: "section"; node: Section }
  | { type: "classroom"; node: StructureTree["classrooms"][number] };

const completedStepsByAction = {
  stage: 0,
  grade: 1,
  section: 2,
  classroom: 3,
  complete: 4,
} as const;

function resolveNextAction(tree: StructureTree, copy: AcademicStructureSetupStepCopy): NextAction {
  const firstStage = tree.stages[0];
  if (!firstStage) {
    return { type: "stage", title: copy.stageTitle, order: tree.stages.length + 1 };
  }

  const gradesForStage = tree.grades.filter((grade) => grade.stageId === firstStage.id);
  const firstGrade = gradesForStage[0];
  if (!firstGrade) {
    return {
      type: "grade",
      title: copy.gradeTitle,
      stage: firstStage,
      order: gradesForStage.length + 1,
    };
  }

  const sectionsForGrade = tree.sections.filter((section) => section.gradeId === firstGrade.id);
  if (sectionsForGrade.length === 0) {
    return {
      type: "section",
      title: copy.sectionTitle,
      grade: firstGrade,
      order: sectionsForGrade.length + 1,
    };
  }

  const firstSection = sectionsForGrade[0];
  const classroomsForSection = tree.classrooms.filter(
    (classroom) => classroom.sectionId === firstSection.id,
  );
  if (classroomsForSection.length === 0) {
    return {
      type: "classroom",
      title: copy.classroomTitle,
      section: firstSection,
      order: classroomsForSection.length + 1,
    };
  }

  return { type: "complete", title: copy.complete };
}

export function AcademicStructureSetupStep({
  copy,
  yearId,
  termId,
  tree,
  refreshStep,
}: AcademicStructureSetupStepProps) {
  const locale = useLocale();
  const nextAction = useMemo(() => resolveNextAction(tree, copy), [copy, tree]);
  const completedSteps = completedStepsByAction[nextAction.type];
  const actionKey =
    nextAction.type === "grade"
      ? `${nextAction.type}:${nextAction.stage.id}`
      : nextAction.type === "section"
        ? `${nextAction.type}:${nextAction.grade.id}`
        : nextAction.type === "classroom"
          ? `${nextAction.type}:${nextAction.section.id}`
        : nextAction.type;
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [formActionKey, setFormActionKey] = useState(actionKey);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingNode, setEditingNode] = useState<EditableNode | null>(null);
  const currentNameAr = formActionKey === actionKey ? nameAr : "";
  const currentNameEn = formActionKey === actionKey ? nameEn : "";
  const editNode = (node: EditableNode) => {
    setEditingNode(node);
    setNameAr(node.node.nameAr);
    setNameEn(node.node.nameEn);
    setFormActionKey(actionKey);
    setError("");
  };
  const localizedName = (node: { name: string; nameAr: string; nameEn: string }) =>
    locale === "ar" ? node.nameAr || node.name : node.nameEn || node.name;

  const successNotice = success ? (
    <p
      aria-live="polite"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
      role="status"
    >
      {success}
    </p>
  ) : null;

  const progressIndicator = (
    <SetupProgress
      completed={completedSteps}
      done={copy.done}
      label={copy.progressLabel}
      progressText={copy.progressText(completedSteps, 4)}
      remaining={copy.remaining}
      steps={[
        { id: "stage", label: copy.stage, complete: completedSteps >= 1 },
        { id: "grade", label: copy.grade, complete: completedSteps >= 2 },
        { id: "section", label: copy.section, complete: completedSteps >= 3 },
        { id: "classroom", label: copy.classroom, complete: completedSteps >= 4 },
      ]}
      total={4}
    />
  );

  const handleSubmit = async () => {
    if (!currentNameAr.trim() || !currentNameEn.trim()) {
      setError(copy.required);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const basePayload = {
        name: currentNameEn.trim() || currentNameAr.trim(),
        nameAr: currentNameAr.trim(),
        nameEn: currentNameEn.trim(),
        order: nextAction.type === "complete" ? 0 : nextAction.order,
      };

      if (editingNode) {
        const payload = { name: currentNameEn.trim(), nameAr: currentNameAr.trim(), nameEn: currentNameEn.trim() };
        if (editingNode.type === "stage") await updateStage(yearId, termId, editingNode.node.id, payload);
        else if (editingNode.type === "grade") await updateGrade(yearId, termId, editingNode.node.id, payload);
        else if (editingNode.type === "section") await updateSection(yearId, termId, editingNode.node.id, payload);
        else await updateClassroom(yearId, termId, editingNode.node.id, payload);
        setSuccess(copy.manage);
        setEditingNode(null);
      } else if (nextAction.type === "stage") {
        await createStage(yearId, termId, basePayload);
        setSuccess(copy.stageCreated);
      } else if (nextAction.type === "grade") {
        await createGrade(yearId, termId, {
          ...basePayload,
          stageId: nextAction.stage.id,
          capacity: 30,
        });
        setSuccess(copy.gradeCreated);
      } else if (nextAction.type === "section") {
        await createSection(yearId, termId, {
          ...basePayload,
          gradeId: nextAction.grade.id,
          capacity: 30,
        });
        setSuccess(copy.sectionCreated);
      } else if (nextAction.type === "classroom") {
        await createClassroom(yearId, termId, {
          ...basePayload,
          sectionId: nextAction.section.id,
          capacity: 30,
        });
        setSuccess(copy.classroomCreated);
      }

      setNameAr("");
      setNameEn("");
      setFormActionKey(actionKey);
      await refreshStep("structure");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {progressIndicator}
      <div className="flex flex-wrap gap-2">
        {tree.stages.map((node) => <Button key={node.id} onClick={() => editNode({ type: "stage", node })} size="sm" type="button" variant="secondary">{copy.stage}: {localizedName(node)}</Button>)}
        {tree.grades.map((node) => <Button key={node.id} onClick={() => editNode({ type: "grade", node })} size="sm" type="button" variant="secondary">{copy.grade}: {localizedName(node)}</Button>)}
        {tree.sections.map((node) => <Button key={node.id} onClick={() => editNode({ type: "section", node })} size="sm" type="button" variant="secondary">{copy.section}: {localizedName(node)}</Button>)}
        {tree.classrooms.map((node) => <Button key={node.id} onClick={() => editNode({ type: "classroom", node })} size="sm" type="button" variant="secondary">{copy.classroom}: {localizedName(node)}</Button>)}
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-950">{editingNode ? copy.manage : nextAction.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{copy.summary}</p>
      </div>
      {nextAction.type !== "complete" || editingNode ? <>
        <div className="grid gap-3 md:grid-cols-2">
          <Input dir="rtl" label={copy.nameAr} onChange={(event) => { setNameAr(event.target.value); setFormActionKey(actionKey); setError(""); setSuccess(""); }} value={currentNameAr} />
          <Input label={copy.nameEn} onChange={(event) => { setNameEn(event.target.value); setFormActionKey(actionKey); setError(""); setSuccess(""); }} value={currentNameEn} />
        </div>
      </> : null}
      {successNotice}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {nextAction.type !== "complete" || editingNode ? <div className="flex flex-wrap gap-2">
        <Button loading={isSaving} onClick={() => void handleSubmit()} type="button">
          {isSaving ? copy.saving : editingNode ? copy.manage : copy.save}
        </Button>
      </div> : null}
    </div>
  );
}
